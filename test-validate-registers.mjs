#!/usr/bin/env node
// Validate every register in registry.ts against the live inverter.
// Spawns the MCP server once, sends read_registers for each register,
// and reports which registers can/cannot be read.
//
// Usage: node test-validate-registers.mjs [host] [port]

import { spawn } from "node:child_process";
import { REGISTERS } from "./packages/modbus-mcp/dist/constants/registry.js";

const host = process.argv[2] || "192.168.86.207";
const port = process.argv[3] || "502";

// Group registers by broad section for readable output
function groupRegisters() {
  const groups = {};
  for (const [key, reg] of Object.entries(REGISTERS)) {
    let section;
    if (key.startsWith("DC_CHARGER_")) {
      section = reg.type === "holding" ? "DC Charger Holding" : "DC Charger Input";
    } else if (key.startsWith("AC_CHARGER_")) {
      section = reg.type === "holding" ? "AC Charger Holding" : "AC Charger Input";
    } else if (key.startsWith("PLANT_") || ["EMS_MODE","GRID_STATUS","BATTERY_SOC","BATTERY_SOH"].includes(key)) {
      section = reg.type === "holding" ? "Plant Holding" : "Plant Input";
    } else if (key.startsWith("INVERTER_")) {
      section = reg.type === "holding" ? "Inverter Holding" : "Inverter Input";
    } else {
      section = "Other";
    }
    if (!groups[section]) groups[section] = [];
    groups[section].push({ key, ...reg });
  }
  return groups;
}

async function main() {
  const groups = groupRegisters();
  const total = Object.values(groups).flat().length;
  const results = { pass: 0, fail: 0, skip: 0 };

  console.log(`\nValidating ${total} registers against ${host}:${port}...\n`);

  // Spawn the MCP server once and reuse
  const proc = spawn("node", ["./packages/modbus-mcp/dist/index.js", "--host", host, "--port", port], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let lineBuffer = "";
  let currentId = 1;
  const pending = new Map();

  // Readline from stdout
  proc.stdout.on("data", (data) => {
    lineBuffer += data.toString();
    while (lineBuffer.includes("\n")) {
      const nlIdx = lineBuffer.indexOf("\n");
      const line = lineBuffer.slice(0, nlIdx).trim();
      lineBuffer = lineBuffer.slice(nlIdx + 1);
      if (line) {
        try {
          const msg = JSON.parse(line);
          const resolve = pending.get(msg.id);
          if (resolve) {
            pending.delete(msg.id);
            resolve(msg);
          }
        } catch { /* ignore non-JSON output */ }
      }
    }
  });

  proc.stderr.on("data", () => {}); // swallow stderr (MCP logs)

  // Wait for server to be ready
  await new Promise((r) => setTimeout(r, 500));

  function sendRequest(address, count, slave) {
    return new Promise((resolve, reject) => {
      const id = currentId++;
      const req = JSON.stringify({
        jsonrpc: "2.0", id,
        method: "tools/call",
        params: { name: "read_registers", arguments: { address, count, slave } },
      });
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error("timeout"));
      }, 8000);
      pending.set(id, (msg) => {
        clearTimeout(timeout);
        resolve(msg);
      });
      proc.stdin.write(req + "\n");
    });
  }

  for (const [section, regs] of Object.entries(groups)) {
    console.log(`  ${section}:`);
    for (const reg of regs) {
      const count = reg.count || 1;
      try {
        const response = await sendRequest(reg.address, count, reg.slave);
        if (response.error) {
          const msg = response.error.message || "";
          if (msg.includes("Illegal data address") || msg.includes("Gateway") || msg.includes("Timeout")) {
            results.fail++;
            console.log(`    ✗ ${reg.key.padEnd(40)} addr=${reg.address} count=${count} slave=${reg.slave} — ${msg}`);
          } else {
            results.fail++;
            console.log(`    ✗ ${reg.key.padEnd(40)} addr=${reg.address} — ${msg}`);
          }
        } else {
          results.pass++;
        }
      } catch (err) {
        if (err.message === "timeout") {
          results.fail++;
          console.log(`    ✗ ${reg.key.padEnd(40)} addr=${reg.address} — timeout`);
        } else {
          results.fail++;
          console.log(`    ✗ ${reg.key.padEnd(40)} addr=${reg.address} — ${err.message}`);
        }
      }
    }
    console.log();
  }

  proc.kill();

  const grandTotal = results.pass + results.fail;
  console.log(`=== ${results.pass}/${grandTotal} registers readable, ${results.fail} failed ===\n`);
  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
