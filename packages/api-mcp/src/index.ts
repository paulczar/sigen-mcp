#!/usr/bin/env node

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { SigenCloudClient } from "./cloud/client.js";

function parseArgs() {
  const args = process.argv.slice(2);
  let cloudUser = "";
  let cloudPass = "";
  let cloudRegion = "aus";
  let appKey = "";
  let appSecret = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cloud-user" && i + 1 < args.length) cloudUser = args[++i];
    else if (args[i] === "--cloud-pass" && i + 1 < args.length) cloudPass = args[++i];
    else if (args[i] === "--cloud-region" && i + 1 < args.length) cloudRegion = args[++i];
    else if (args[i] === "--app-key" && i + 1 < args.length) appKey = args[++i];
    else if (args[i] === "--app-secret" && i + 1 < args.length) appSecret = args[++i];
  }
  // Fall back to env vars
  if (!cloudUser) cloudUser = process.env.SIGEN_USERNAME ?? "";
  if (!cloudPass) cloudPass = process.env.SIGEN_PASSWORD ?? "";
  if (!cloudRegion || cloudRegion === "aus") cloudRegion = process.env.SIGEN_REGION ?? "aus";
  if (!appKey) appKey = process.env.SIGEN_APP_KEY ?? "";
  if (!appSecret) appSecret = process.env.SIGEN_APP_SECRET ?? "";
  if (!cloudUser || !cloudPass) {
    console.error("Usage: sigen-api-mcp --cloud-user <email> --cloud-pass <password> [--cloud-region <region>] [--app-key <key> --app-secret <secret>]");
    console.error("       Or set SIGEN_USERNAME, SIGEN_PASSWORD, SIGEN_REGION, SIGEN_APP_KEY, SIGEN_APP_SECRET in .env");
    process.exit(1);
  }
  return { cloudUser, cloudPass, cloudRegion, appKey, appSecret };
}

const { cloudUser, cloudPass, cloudRegion, appKey, appSecret } = parseArgs();

let cloudClient: SigenCloudClient | null = null;
try {
  cloudClient = new SigenCloudClient({ region: cloudRegion, username: cloudUser, password: cloudPass, appKey, appSecret });
  console.error(`SigenCloud client initialized (region: ${cloudRegion})`);
  if (appKey) console.error("Northbound API key provided — history tool available");
} catch (err) {
  cloudClient = null;
  const msg = err && typeof err === "object" && "message" in err
    ? String((err as { message: unknown }).message)
    : String(err);
  console.error(`SigenCloud init failed: ${msg}`);
  process.exit(1);
}

const server = new Server(
  { name: "sigen-api-mcp", version: "0.1.1" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cloud_station_info",
      description: "Get station info from SigenCloud (PV/battery capacity, serial numbers, on-grid status)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cloud_operational_modes",
      description: "List all available operational modes with human-readable names",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cloud_current_mode",
      description: "Get current operational mode name and profile from SigenCloud",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cloud_energy_flow",
      description: "Get real-time energy flow from SigenCloud (includes EV, heat pump, buy/sell power)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cloud_history",
      description: "Get historical daily energy data (requires SIGEN_APP_KEY and SIGEN_APP_SECRET in .env, or --app-key / --app-secret CLI args). Uses the Northbound API — only 'day' level is supported with AppKey auth.",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYYMMDD or YYYY-MM-DD format" },
          level: { type: "string", enum: ["day", "hour", "5min"], default: "day" },
        },
        required: ["date"],
      },
    },
    {
      name: "cloud_smart_loads",
      description: "List smart loads with today/month/lifetime energy consumption",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cloud_alarms",
      description: "Get paginated active alarms from SigenCloud",
      inputSchema: {
        type: "object",
        properties: {
          page: { type: "number", default: 1 },
          size: { type: "number", default: 20 },
        },
      },
    },
    {
      name: "cloud_set_ems_mode",
      description: "Set EMS operating mode via End-User API (0=MaxSelfConsumption, 1=AI, 2=TOU, 5=FullFeedIn, 6=VPP, 7=RemoteEMS, 9=Custom). Use profileId for custom modes. Does NOT work when system is in VPP mode — use cloud_nb_offboard first.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "number", description: "EMS mode value (0-9)" },
          profileId: { type: "number", default: -1, description: "Profile ID for custom mode 9 (default: -1)" },
        },
        required: ["mode"],
      },
    },
    {
      name: "cloud_nb_offboard",
      description: "Offboard (remove) a system from the developer app via Northbound API. Use this to recover a system stuck in VPP mode — forces the system out of VPP. Requires AppKey/AppSecret. After offboard, use cloud_set_ems_mode to set the desired mode.",
      inputSchema: {
        type: "object",
        properties: {
          systemId: { type: "string", description: "System ID or stationCode (e.g. TAETN1768371966). Defaults to the configured station." },
        },
      },
    },
    {
      name: "cloud_nb_onboard",
      description: "Onboard (authorize) a system to this developer app via Northbound API. Required before NB instruction endpoints (switch_mode, battery dispatch) will work. Requires AppKey/AppSecret.",
      inputSchema: {
        type: "object",
        properties: {
          systemId: { type: "string", description: "System ID or stationCode (e.g. TAETN1768371966). Defaults to the configured station." },
        },
      },
    },
    {
      name: "cloud_nb_switch_mode",
      description: "Set EMS mode via Northbound API instruction endpoint (AppKey auth). Uses NB mode values: 0=MSC, 5=FFG, 6=VPP, 8=NBI. System must be onboarded first.",
      inputSchema: {
        type: "object",
        properties: {
          systemId: { type: "string", description: "System ID stationCode (e.g. TAETN1768371966). Defaults to the configured station." },
          mode: { type: "number", description: "NB mode value: 0=MSC, 5=FFG, 6=VPP, 8=NBI" },
        },
        required: ["mode"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "cloud_station_info": {
        const info = await cloudClient!.getStationInfo();
        return {
          content: [{
            type: "text",
            text: [
              `Station Info:`,
              `  Station ID: ${info.stationId}`,
              `  On Grid: ${info.onGrid ? "Yes" : "No"}`,
              `  PV Capacity: ${info.pvCapacity} kW`,
              `  Battery Capacity: ${info.batteryCapacity} kWh`,
              `  Has EV DC Charger: ${info.hasEv ? "Yes" : "No"}`,
              `  Has AC Charger: ${info.hasAcCharger ? "Yes" : "No"}`,
              info.dcSnList.length ? `  DC Charger SNs: ${info.dcSnList.join(", ")}` : "",
            ].filter(Boolean).join("\n"),
          }],
        };
      }

      case "cloud_operational_modes": {
        const modes = await cloudClient!.getOperationalModes();
        const lines: string[] = ["Operational Modes:"];
        for (const m of modes.defaultWorkingModes) {
          lines.push(`  ${m.label} (value: ${m.value})`);
        }
        if (modes.energyProfileItems?.length) {
          lines.push(`  Custom Profiles:`);
          for (const p of modes.energyProfileItems) {
            lines.push(`    ${p.name} (profileId: ${p.profileId})`);
          }
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cloud_current_mode": {
        const [modes, current] = await Promise.all([
          cloudClient!.getOperationalModes(),
          cloudClient!.getCurrentMode(),
        ]);
        let modeLabel = `Mode ${current.currentMode}`;
        if (current.currentMode !== 9) {
          const found = modes.defaultWorkingModes.find(m => Number(m.value) === current.currentMode);
          if (found) modeLabel = found.label;
        } else {
          const found = modes.energyProfileItems?.find(p => p.profileId === current.currentProfileId);
          if (found) modeLabel = `${found.name} (profile ${current.currentProfileId})`;
        }
        return { content: [{ type: "text", text: `Current Mode: ${modeLabel}` }] };
      }

      case "cloud_energy_flow": {
        const flow = await cloudClient!.getEnergyFlow();
        const fmt = (v: unknown, unit = "kW") => {
          const n = Number(v);
          return isNaN(n) ? "N/A" : `${n.toFixed(3)} ${unit}`;
        };
        const lines: string[] = ["Energy Flow:"];
        if (flow.pvPower !== undefined) lines.push(`  PV Generation: ${fmt(flow.pvPower)}`);
        if (flow.loadPower !== undefined) lines.push(`  Load: ${fmt(flow.loadPower)}`);
        if (flow.gridPower !== undefined) lines.push(`  Grid: ${fmt(flow.gridPower)}`);
        if (flow.batteryPower !== undefined) lines.push(`  Battery: ${fmt(flow.batteryPower)}`);
        if (flow.buySellPower !== undefined) lines.push(`  Buy/Sell: ${fmt(flow.buySellPower)}`);
        if (flow.evPower !== undefined) lines.push(`  EV: ${fmt(flow.evPower)}`);
        if (flow.heatPumpPower !== undefined) lines.push(`  Heat Pump: ${fmt(flow.heatPumpPower)}`);
        if (flow.acPower !== undefined) lines.push(`  AC Charger: ${fmt(flow.acPower)}`);
        if (flow.batterySoc !== undefined) lines.push(`  Battery SOC: ${Number(flow.batterySoc).toFixed(1)}%`);
        if (flow.pvDayNrg !== undefined) lines.push(`  PV Today: ${fmt(flow.pvDayNrg, "kWh")}`);
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cloud_history": {
        const date = args?.date as string;
        if (!date) throw new McpError(ErrorCode.InvalidParams, "date is required (YYYYMMDD or YYYY-MM-DD)");
        const level = (args?.level as string) ?? "day";
        const data = await cloudClient!.getHistory(date, level);
        const entries = (data as any).itemList || [];
        return {
          content: [{
            type: "text",
            text: [
              `History (${date}, ${level}):`,
              entries.length ? entries.slice(0, 48).map((e: Record<string, unknown>) => {
                const time = e.dataTime || "?";
                const parts = [`  ${time}`];
                if (e.pvTotalPower != null) parts.push(`PV:${e.pvTotalPower}kW`);
                if (e.loadPower != null) parts.push(`Load:${e.loadPower}kW`);
                if (e.batSoc != null) parts.push(`SOC:${e.batSoc}%`);
                if (e.toGridPower != null) parts.push(`Export:${e.toGridPower}kW`);
                if (e.fromGridPower != null) parts.push(`Import:${e.fromGridPower}kW`);
                return parts.join(" ");
              }).join("\n") : "  No data",
              entries.length > 48 ? `  ... and ${entries.length - 48} more entries` : "",
            ].filter(Boolean).join("\n"),
          }],
        };
      }

      case "cloud_smart_loads": {
        const loads = await cloudClient!.getSmartLoads();
        if (!loads.length) return { content: [{ type: "text", text: "No smart loads found" }] };
        const lines = ["Smart Loads:"];
        for (const load of loads) {
          const name = load.name || `Load ${load.path || "?"}`;
          const status = load.status === 1 ? "On" : "Off";
          const today = load.todayConsumption || "N/A";
          const month = load.monthConsumption || "N/A";
          lines.push(`  ${name} [${status}] - Today: ${today}, Month: ${month}`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cloud_alarms": {
        const page = (args?.page as number) ?? 1;
        const size = (args?.size as number) ?? 20;
        const alarms = await cloudClient!.getAlarms(page, size);
        const records = (alarms as any).records || [];
        if (!records.length) return { content: [{ type: "text", text: "No active alarms" }] };
        const lines = [
          `Alarms (page ${alarms.current}/${Math.ceil((alarms.total || 0) / (alarms.size || 1))}, total: ${alarms.total || 0}):`,
        ];
        for (const a of records) {
          lines.push(`  [${a.alarmTime || "?"}] ${a.alarmDesc || a.alarmCode || "Unknown"}`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cloud_set_ems_mode": {
        const mode = args?.mode as number | undefined;
        if (mode == null) throw new McpError(ErrorCode.InvalidParams, "mode is required");
        const profileId = (args?.profileId as number | undefined) ?? -1;
        const result = await cloudClient!.setOperationalMode(mode, profileId);
        return {
          content: [{ type: "text", text: `Set operational mode to ${mode}${result.result !== undefined ? ` (success: ${result.result})` : ""}` }],
        };
      }

      case "cloud_nb_offboard": {
        const info = await cloudClient!.getStationInfo();
        const systemId = (args?.systemId as string | undefined) ?? (info as any).stationCode ?? info.stationId;
        const result = await cloudClient!.northboundOffboard([systemId]);
        return {
          content: [{ type: "text", text: `Offboard result for ${systemId}: ${JSON.stringify(result)}` }],
        };
      }

      case "cloud_nb_onboard": {
        const info = await cloudClient!.getStationInfo();
        const systemId = (args?.systemId as string | undefined) ?? (info as any).stationCode ?? info.stationId;
        const result = await cloudClient!.northboundOnboard([systemId]);
        return {
          content: [{ type: "text", text: `Onboard result for ${systemId}: ${JSON.stringify(result)}` }],
        };
      }

      case "cloud_nb_switch_mode": {
        const mode = args?.mode as number | undefined;
        if (mode == null) throw new McpError(ErrorCode.InvalidParams, "mode is required");
        const info = await cloudClient!.getStationInfo();
        const systemId = (args?.systemId as string | undefined) ?? (info as any).stationCode ?? info.stationId;
        const result = await cloudClient!.northboundSwitchMode(systemId, mode);
        return {
          content: [{ type: "text", text: `Set NB mode to ${mode} for ${systemId}: ${JSON.stringify(result)}` }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof McpError) throw err;
    const msg = err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);
    throw new McpError(ErrorCode.InternalError, `Tool error: ${msg}`);
  }
});

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("sigen-api-mcp MCP server running on stdio");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
