import { createCipheriv } from "node:crypto";
import type {
  StationInfo,
  EnergyFlow,
  OperationalModes,
  CurrentMode,
  SmartLoad,
  HistoryResponse,
  AlarmPage,
} from "./types.js";

const AES_KEY = Buffer.from("sigensigensigenp", "utf-8");
const AES_IV = Buffer.from("sigensigensigenp", "utf-8");

export const REGION_URLS: Record<string, string> = {
  aus: "https://api-aus.sigencloud.com",
  eu: "https://api-eu.sigencloud.com",
  apac: "https://api-apac.sigencloud.com",
  cn: "https://api-cn.sigencloud.com",
  us: "https://api-us.sigencloud.com",
};

function encryptPassword(plain: string): string {
  const cipher = createCipheriv("aes-128-cbc", AES_KEY, AES_IV);
  return Buffer.concat([cipher.update(plain, "utf-8"), cipher.final()]).toString("base64");
}

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SigenCloudClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: TokenInfo | null = null;
  private _stationId: string | null = null;

  // Northbound API (AppKey/AppSecret) auth
  private appKey: string;
  private appSecret: string;
  private northboundToken: TokenInfo | null = null;

  constructor(opts: { region: string; username: string; password: string; appKey?: string; appSecret?: string }) {
    const url = REGION_URLS[opts.region];
    if (!url) throw new Error(`Unknown region "${opts.region}". Valid: ${Object.keys(REGION_URLS).join(", ")}`);
    this.baseUrl = url;
    this.username = opts.username;
    this.password = opts.password;
    this.appKey = opts.appKey ?? "";
    this.appSecret = opts.appSecret ?? "";
  }

  get stationId(): string | null {
    return this._stationId;
  }

  private get isAuthenticated(): boolean {
    return this.token !== null && Date.now() / 1000 < this.token.expiresAt - 600;
  }

  private async authenticate(): Promise<void> {
    const encrypted = encryptPassword(this.password);
    const resp = await fetch(`${this.baseUrl}/auth/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from("sigen:sigen").toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: this.username,
        password: encrypted,
        grant_type: "password",
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`SigenCloud auth failed (${resp.status}): ${body}`);
    }
    const json: { data?: { access_token: string; refresh_token: string; expires_in: number } } = await resp.json();
    const data = json.data;
    if (!data?.access_token) {
      throw new Error(`SigenCloud auth failed: unexpected response — ${JSON.stringify(json)}`);
    }
    this.token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() / 1000 + data.expires_in,
    };
  }

  private async refreshToken(): Promise<void> {
    if (!this.token?.refreshToken) throw new Error("No refresh token available");
    const resp = await fetch(`${this.baseUrl}/auth/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from("sigen:sigen").toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.token.refreshToken,
      }),
    });
    if (!resp.ok) throw new Error(`Token refresh failed (${resp.status})`);
    const json: { data?: { access_token: string; refresh_token: string; expires_in: number } } = await resp.json();
    const data = json.data;
    if (!data?.access_token) throw new Error("Token refresh failed: unexpected response");
    this.token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() / 1000 + data.expires_in,
    };
  }

  private async ensureAuth(): Promise<void> {
    if (this.isAuthenticated) return;
    if (this.token?.refreshToken) {
      try {
        await this.refreshToken();
        return;
      } catch {
        this.token = null;
      }
    }
    await this.authenticate();
  }

  private async request<T>(method: string, path: string, opts?: {
    params?: Record<string, string>;
    body?: unknown;
  }): Promise<T> {
    await this.ensureAuth();
    const url = new URL(`${this.baseUrl}${path}`);
    if (opts?.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        url.searchParams.set(k, v);
      }
    }
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      if (resp.status === 429) throw new Error("SigenCloud rate limited (429)");
      throw new Error(`SigenCloud API error (${resp.status}): ${body}`);
    }
    const json: { code?: number; msg?: string; data?: T } = await resp.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`SigenCloud API error ${json.code}: ${json.msg || "unknown"}`);
    }
    return json.data as T;
  }

  private async northboundLoginWithKey(): Promise<void> {
    const key = Buffer.from(`${this.appKey}:${this.appSecret}`).toString("base64");
    const resp = await fetch(`${this.baseUrl}/openapi/auth/login/key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Northbound key auth failed (${resp.status}): ${body}`);
    }
    const json: { code?: number; msg?: string; data?: string } = await resp.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`Northbound key auth error ${json.code}: ${json.msg || "unknown"}`);
    }
    const data = json.data ? JSON.parse(json.data) : null;
    if (!data?.accessToken) throw new Error("Northbound key auth failed: no accessToken in response");
    this.northboundToken = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? "",
      expiresAt: Date.now() / 1000 + (data.expiresIn ?? 43199),
    };
    console.error("Northbound API authenticated via AppKey");
  }

  private async northboundLoginWithPassword(): Promise<void> {
    const encrypted = encryptPassword(this.password);
    const resp = await fetch(`${this.baseUrl}/openapi/auth/login/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: this.username, password: encrypted }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Northbound password auth failed (${resp.status}): ${body}`);
    }
    const json: { code?: number; msg?: string; data?: string } = await resp.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`Northbound password auth error ${json.code}: ${json.msg || "unknown"}`);
    }
    const data = json.data ? JSON.parse(json.data) : null;
    if (!data?.accessToken) throw new Error("Northbound password auth failed: no accessToken in response");
    this.northboundToken = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? "",
      expiresAt: Date.now() / 1000 + (data.expiresIn ?? 43199),
    };
    console.error("Northbound API authenticated via password");
  }

  private async ensureNorthboundAuth(): Promise<void> {
    if (this.northboundToken !== null && Date.now() / 1000 < this.northboundToken.expiresAt - 600) return;
    if (this.appKey && this.appSecret) {
      await this.northboundLoginWithKey();
    } else {
      await this.northboundLoginWithPassword();
    }
  }

  private async northboundRequest<T>(method: string, path: string, opts?: {
    params?: Record<string, string>;
  }): Promise<T> {
    await this.ensureNorthboundAuth();
    const url = new URL(`${this.baseUrl}${path}`);
    if (opts?.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        url.searchParams.set(k, v);
      }
    }
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.northboundToken!.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      if (resp.status === 429) throw new Error("SigenCloud rate limited (429)");
      throw new Error(`SigenCloud Northbound API error (${resp.status}): ${body}`);
    }
    const json: { code?: number; msg?: string; data?: T } = await resp.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`SigenCloud Northbound API error ${json.code}: ${json.msg || "unknown"}`);
    }
    return json.data as T;
  }

  private async ensureStationId(): Promise<string> {
    if (this._stationId) return this._stationId;
    const info = await this.getStationInfo();
    this._stationId = info.stationId;
    return this._stationId;
  }

  async getStationInfo(): Promise<StationInfo> {
    const data = await this.request<Record<string, unknown>>("GET", "/device/owner/station/home");
    this._stationId = String(data.stationId);
    return {
      stationId: String(data.stationId),
      hasPv: Boolean(data.hasPv),
      hasEv: Boolean(data.hasEv),
      hasAcCharger: Boolean(data.hasAcCharger),
      acSnList: (data.acSnList as string[]) || [],
      dcSnList: (data.dcSnList as string[]) || [],
      onGrid: Boolean(data.onGrid),
      pvCapacity: Number(data.pvCapacity),
      batteryCapacity: Number(data.batteryCapacity),
    };
  }

  async getEnergyFlow(): Promise<EnergyFlow> {
    const sid = await this.ensureStationId();
    return this.request<EnergyFlow>("GET", "/device/sigen/station/energyflow", {
      params: { id: sid },
    });
  }

  async getOperationalModes(): Promise<OperationalModes> {
    const sid = await this.ensureStationId();
    return this.request<OperationalModes>("GET", `/device/energy-profile/mode/all/${sid}`);
  }

  async getCurrentMode(): Promise<CurrentMode> {
    const sid = await this.ensureStationId();
    return this.request<CurrentMode>("GET", `/device/energy-profile/mode/current/${sid}`);
  }

  async getHistory(date: string, level = "day"): Promise<HistoryResponse> {
    const sid = await this.ensureStationId();
    return this.northboundRequest<HistoryResponse>("GET", `/openapi/systems/${sid}/history`, {
      params: { date, level },
    });
  }

  async getSmartLoads(): Promise<SmartLoad[]> {
    const sid = await this.ensureStationId();
    return this.request<SmartLoad[]>("GET", "/device/system/device/systemDevice/card", {
      params: { stationId: sid, showNewGenerator: "true" },
    });
  }

  async getAlarms(page = 1, size = 20): Promise<AlarmPage> {
    const sid = await this.ensureStationId();
    return this.request<AlarmPage>("GET", "/device/alarm/page", {
      params: { current: String(page), size: String(size), stationId: sid },
    });
  }
}
