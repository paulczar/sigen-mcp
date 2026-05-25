#!/usr/bin/env node
// Integration tests for all MCP tools.
// Requires a live Sigenergy inverter on the network.
//
// Usage: node --test test-integration.mjs [-- --host 192.168.x.x] [--port 502]

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";

const hostIdx = process.argv.indexOf("--host");
const HOST = hostIdx !== -1 ? process.argv[hostIdx + 1] : "192.168.86.207";
const portIdx = process.argv.indexOf("--port");
const PORT = portIdx !== -1 ? process.argv[portIdx + 1] : "502";

// --- Server helper ---

class ServerSession {
  constructor() {
    this.proc = null;
    this.nextId = 1;
    this.buffer = "";
    this.pending = new Map();
  }

  start() {
    return new Promise((resolve) => {
      this.proc = spawn("node", ["./dist/index.js", "--host", HOST, "--port", PORT], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.proc.stdout.on("data", (data) => {
        this.buffer += data.toString();
        while (this.buffer.includes("\n")) {
          const nl = this.buffer.indexOf("\n");
          const line = this.buffer.slice(0, nl).trim();
          this.buffer = this.buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            const resolveFn = this.pending.get(msg.id);
            if (resolveFn) {
              this.pending.delete(msg.id);
              resolveFn(msg);
            }
          } catch { /* skip non-JSON output */ }
        }
      });

      this.proc.stderr.on("data", () => {});
      setTimeout(resolve, 1000);
    });
  }

  call(name, args = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const req = JSON.stringify({
        jsonrpc: "2.0", id,
        method: "tools/call",
        params: { name, arguments: args },
      });
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Timeout waiting for response"));
      }, 20000);
      this.pending.set(id, (msg) => {
        clearTimeout(timeout);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      });
      this.proc.stdin.write(req + "\n");
    });
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    this.pending.clear();
    this.buffer = "";
  }
}

function getText(result) {
  return result?.content?.[0]?.text || "";
}

// --- Tests ---

describe("sigen-mcp - read tools", { timeout: 90000 }, () => {
  let srv;

  before(async () => {
    srv = new ServerSession();
    await srv.start();
  });

  after(() => {
    if (srv) srv.stop();
  });

  it("read_ems_mode — returns mode number and label", async () => {
    const text = getText(await srv.call("read_ems_mode"));
    assert.ok(text);
    assert.match(text, /\d+/);
    assert.match(text, /–/);
  });

  it("read_grid_status — returns grid status", async () => {
    const text = getText(await srv.call("read_grid_status"));
    assert.ok(text);
    assert.match(text, /Grid/);
  });

  it("read_battery_status — valid SOC and SOH", async () => {
    const text = getText(await srv.call("read_battery_status"));
    assert.ok(text);
    const soc = text.match(/SOC:\s*(\d+\.?\d*)%/);
    assert.ok(soc);
    assert.ok(parseFloat(soc[1]) >= 0 && parseFloat(soc[1]) <= 100);
    const soh = text.match(/SOH:\s*(\d+\.?\d*)%/);
    assert.ok(soh);
    assert.ok(parseFloat(soh[1]) >= 0 && parseFloat(soh[1]) <= 100);
  });

  it("read_pv_power — returns voltage/current/power", async () => {
    const text = getText(await srv.call("read_pv_power"));
    assert.match(text, /kW/);
    assert.match(text, /V/);
    assert.match(text, /A/);
  });

  it("read_ev_status — returns DC charger state", async () => {
    const text = getText(await srv.call("read_ev_status"));
    assert.match(text, /DC Charger/);
  });

  it("read_registers — single register", async () => {
    const text = getText(await srv.call("read_registers", { address: 30003, slave: 247 }));
    assert.match(text, /\[\d+\]/);
  });

  it("read_registers — multiple registers", async () => {
    const text = getText(await srv.call("read_registers", { address: 30000, count: 5, slave: 247 }));
    assert.match(text, /\[/);
    const vals = text.match(/\d+/g);
    assert.ok(vals && vals.length >= 3);
  });

  it("read_registers — rejects missing address", async () => {
    await assert.rejects(
      () => srv.call("read_registers", {}),
      /address is required/i,
    );
  });

  it("read_plant — comprehensive plant status", async () => {
    const text = getText(await srv.call("read_plant"));
    assert.match(text, /EMS Mode/);
    assert.match(text, /Grid/);
    assert.match(text, /Running State/);
    assert.match(text, /PV Generation/);
    assert.match(text, /ESS Power/);
    assert.match(text, /Battery SOC/);
    assert.match(text, /Battery SOH/);
    const soc = text.match(/Battery SOC:\s*(\d+\.?\d*)%/);
    if (soc) assert.ok(parseFloat(soc[1]) >= 0 && parseFloat(soc[1]) <= 100);
  });

  it("read_plant_energy — accumulated energy counters", async () => {
    const text = getText(await srv.call("read_plant_energy"));
    assert.match(text, /PV Generation/);
    assert.match(text, /Grid Import/);
    assert.match(text, /Grid Export/);
    assert.match(text, /Battery Charge/);
    assert.match(text, /Battery Discharge/);
    // Values are formatted as "PV Generation: 1234.5" (kWh in header)
    assert.match(text, /\d+\.\d/);
  });

  it("read_inverter_detail — inverter measurements", async () => {
    const text = getText(await srv.call("read_inverter_detail"));
    assert.match(text, /Running State/);
    assert.match(text, /Active Power/);
    assert.match(text, /Hz/);
    assert.match(text, /Power Factor/);
    assert.match(text, /Internal Temp/);
    assert.match(text, /Battery SOC/);
    assert.match(text, /PV Power/);

    const freq = text.match(/(\d+\.\d+)\s*Hz/);
    if (freq) {
      const f = parseFloat(freq[1]);
      assert.ok(f >= 45 && f <= 55, `Frequency ${f} Hz out of range`);
    }
    const pf = text.match(/Power Factor:\s*(-?\d+\.?\d*)/);
    if (pf) {
      const p = parseFloat(pf[1]);
      assert.ok(p >= -1 && p <= 1, `Power factor ${p} out of range`);
    }
  });

  it("read_ac_charger — returns status (may be absent)", async () => {
    const text = getText(await srv.call("read_ac_charger"));
    assert.match(text, /AC Charger/);
    // If hardware absent, values should be 0/falsy, not an error
    assert.doesNotMatch(text, /Modbus read error/);
  });

  it("read_alarms — returns decoded alarm registers", async () => {
    const text = getText(await srv.call("read_alarms"));
    assert.ok(text);
    // Should reference alarms or report none
    assert.ok(text.includes("Alarm") || text.includes("No active"));
    assert.doesNotMatch(text, /Modbus read error/);
    assert.doesNotMatch(text, /Illegal data address/);
  });

  it("read_registers — bulk plant input range", async () => {
    const text = getText(await srv.call("read_registers", {
      address: 30005, count: 10, slave: 247,
    }));
    const vals = text.match(/\d+/g);
    assert.ok(vals && vals.length >= 8, `expected 8+ values, got ${vals?.length}`);
  });
});

describe("sigen-mcp - edge cases and write tools", { timeout: 60000 }, () => {
  let srv;

  before(async () => {
    srv = new ServerSession();
    await srv.start();
  });

  after(() => {
    if (srv) srv.stop();
  });

  it("write_register — rejects missing address", async () => {
    await assert.rejects(
      () => srv.call("write_register", {}),
      /address is required/i,
    );
  });

  it("write_register — rejects missing value", async () => {
    await assert.rejects(
      () => srv.call("write_register", { address: 40001 }),
      /value is required/i,
    );
  });

  it("set_ems_mode — rejects invalid mode", async () => {
    await assert.rejects(
      () => srv.call("set_ems_mode", { mode: 99 }),
      /invalid/i,
    );
  });

  it("set_ems_mode — rejects missing mode", async () => {
    await assert.rejects(
      () => srv.call("set_ems_mode", {}),
      /mode is required/i,
    );
  });

  it("set_charge_limit — rejects negative", async () => {
    await assert.rejects(
      () => srv.call("set_charge_limit", { kw: -1 }),
      /must be >= 0|invalid/i,
    );
  });

  it("set_discharge_limit — rejects negative", async () => {
    await assert.rejects(
      () => srv.call("set_discharge_limit", { kw: -1 }),
      /must be >= 0|invalid/i,
    );
  });

  it("set_charge_limit — rejects missing kw", async () => {
    await assert.rejects(
      () => srv.call("set_charge_limit", {}),
      /kw is required/i,
    );
  });

  it("set_discharge_limit — rejects missing kw", async () => {
    await assert.rejects(
      () => srv.call("set_discharge_limit", {}),
      /kw is required/i,
    );
  });
});
