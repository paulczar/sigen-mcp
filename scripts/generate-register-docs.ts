/**
 * Generate a comprehensive Markdown register reference from registry.ts.
 * Run: npx tsx scripts/generate-register-docs.ts
 * Output: docs/registers.md
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGISTERS,
  RegisterDef,
  EMS_MODES,
  GRID_STATUSES,
  RUNNING_STATES,
  REMOTE_EMS_MODES,
  AC_CHARGER_STATES,
  DC_CHARGER_STATUSES,
  DC_CHARGER_RUNNING_STATE_V28,
  OUTPUT_TYPES,
  PCS_ALARM_CODES,
  PCS_ALARM_CODES2,
  ESS_ALARM_CODES,
  GATEWAY_ALARM_CODES,
  DC_CHARGER_ALARM_CODES,
  PLANT_ALARM_CODES6,
  PLANT_ALARM_CODES7,
  AC_CHARGER_ALARM_CODES1,
  AC_CHARGER_ALARM_CODES2,
  AC_CHARGER_ALARM_CODES3,
} from "../packages/modbus-mcp/src/constants/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SECTIONS: { name: string; keys: string[] }[] = [];
const seen = new Set<string>();

function classifyKey(key: string): string {
  if (key.startsWith("PLANT_")) {
    const def = REGISTERS[key];
    if (def && def.type === "holding") return "Plant Holding (slave 247)";
    return "Plant Input (slave 247)";
  }
  if (key.startsWith("INVERTER_")) {
    const def = REGISTERS[key];
    if (def && def.type === "holding") return "Inverter Holding (slave 1)";
    return "Inverter Input (slave 1)";
  }
  if (key.startsWith("DC_CHARGER_")) return "DC Charger Input (slave 1)";
  if (key.startsWith("AC_CHARGER_")) {
    const def = REGISTERS[key];
    if (def && def.type === "holding") return "AC Charger Holding (slave 1)";
    return "AC Charger Input (slave 1)";
  }
  if (key.startsWith("BATTERY_")) {
    const def = REGISTERS[key];
    if (def && def.slave === 1) return "Inverter Input (slave 1)";
    return "Plant Input (slave 247)";
  }
  // Keys like EMS_MODE, GRID_STATUS, etc.
  const def = REGISTERS[key];
  if (def) {
    if (def.slave === 247) return "Plant Input (slave 247)";
    if (def.slave === 1 && def.type === "input") return "Inverter Input (slave 1)";
    if (def.slave === 1 && def.type === "holding") return "Inverter Holding (slave 1)";
  }
  return "Other";
}

const SECTION_ORDER = [
  "Plant Input (slave 247)",
  "Plant Holding (slave 247)",
  "Inverter Input (slave 1)",
  "Inverter Holding (slave 1)",
  "DC Charger Input (slave 1)",
  "AC Charger Input (slave 1)",
  "AC Charger Holding (slave 1)",
];

function buildSections() {
  const groups: Record<string, [string, RegisterDef][]> = {};
  for (const [key, def] of Object.entries(REGISTERS)) {
    const section = classifyKey(key);
    if (!groups[section]) groups[section] = [];
    groups[section].push([key, def]);
  }
  for (const name of SECTION_ORDER) {
    if (groups[name]) {
      SECTIONS.push({ name, keys: groups[name].map(([k]) => k) });
    }
  }
  // Any unclassified
  for (const [name, entries] of Object.entries(groups)) {
    if (!SECTION_ORDER.includes(name)) {
      SECTIONS.push({ name, keys: entries.map(([k]) => k) });
    }
  }
}

function typeLabel(def: RegisterDef): string {
  if (!def.dataType) return "";
  const parts = [def.dataType];
  if (def.count) parts.push(`${def.count * 16}-bit`);
  if (def.gain) parts.push(`x${def.gain}`);
  return parts.join(" ");
}

function row(key: string, def: RegisterDef): string {
  const addr = String(def.address);
  const slaveLabel = def.slave === 247 ? "Plant" : "Inverter";
  return `| \`${key}\` | ${addr} | ${def.type} | ${slaveLabel} (${def.slave}) | ${typeLabel(def)} | ${def.description ?? ""} | ${def.unit ?? ""} |`;
}

function enumTable(name: string, map: Record<number | string, string>): string {
  const rows = Object.entries(map)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join("\n");
  return `### ${name}\n\n| Value | Label |\n|-------|-------|\n${rows}\n`;
}

function generate(): string {
  buildSections();

  const lines: string[] = [];
  lines.push("# Register Reference — sigen-mcp");
  lines.push("");
  lines.push("Auto-generated from `packages/modbus-mcp/src/constants/registry.ts`. Regenerate with `npm run docs`.");
  lines.push("");
  lines.push(`Total registers defined: **${Object.keys(REGISTERS).length}**`);
  lines.push("");
  lines.push("## Data Types & Gains");
  lines.push("");
  lines.push("| Data Type | Gain | Applies To |");
  lines.push("|-----------|------|------------|");
  lines.push("| `U16`/`S16` | — | status enums, counts |");
  lines.push("| `U16`/`S16` | ×10 | voltage (V), SOC/SOH (%), temperature (°C) |");
  lines.push("| `U16`/`S16` | ×100 | frequency (Hz), percentage (%), current (A) |");
  lines.push("| `U16`/`S16` | ×1000 | insulation (MΩ), power factor |");
  lines.push("| `U32`/`S32` | ×1000 | power (kW), apparent power (kVA/kvar) |");
  lines.push("| `U32`/`S32` | ×100 | energy (kWh), capacity (kWh), voltage (V) |");
  lines.push("| `U64` | ×100 | accumulated energy (kWh) |");
  lines.push("");
  lines.push("## Slave IDs");
  lines.push("");
  lines.push("| Slave | Target |");
  lines.push("|-------|--------|");
  lines.push("| **247** | Plant-level (EMS, grid, battery, energy, alarms) |");
  lines.push("| **1** | Inverter-level (PV, phases, DC charger, AC charger) |");
  lines.push("| **0** | Plant broadcast (write-only, no reply) |");
  lines.push("");

  for (const section of SECTIONS) {
    lines.push(`## ${section.name}`);
    lines.push("");
    lines.push("| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |");
    lines.push("|-----|------|------|-------|------------------|-------------|------|");

    for (const key of section.keys) {
      const def = REGISTERS[key];
      if (def) {
        lines.push(row(key, def));
      }
    }
    lines.push("");
  }

  // Enum Maps
  lines.push("---");
  lines.push("");
  lines.push("# Enum Maps");
  lines.push("");

  const enums: [string, Record<number | string, string>][] = [
    ["EMS Modes (register 30003)", EMS_MODES],
    ["Grid Statuses (register 30009)", GRID_STATUSES],
    ["Running States", RUNNING_STATES],
    ["Remote EMS Modes (EMS mode 7 sub-modes)", REMOTE_EMS_MODES],
    ["AC Charger States", AC_CHARGER_STATES],
    ["DC Charger Statuses (V2.7 legacy)", DC_CHARGER_STATUSES],
    ["DC Charger Running State (V2.8)", DC_CHARGER_RUNNING_STATE_V28],
    ["Output Types (register 31004)", OUTPUT_TYPES],
  ];

  for (const [name, map] of enums) {
    lines.push(enumTable(name, map));
    lines.push("");
  }

  // Alarm maps
  lines.push("## Alarm Code Bit-field Maps");
  lines.push("");

  const alarms: [string, Record<number | string, string>][] = [
    ["PCS Alarm Codes (Alarm1)", PCS_ALARM_CODES],
    ["PCS Alarm Codes 2 (Alarm2)", PCS_ALARM_CODES2],
    ["ESS Alarm Codes (Alarm3)", ESS_ALARM_CODES],
    ["Gateway Alarm Codes (Alarm4)", GATEWAY_ALARM_CODES],
    ["DC Charger Alarm Codes (Alarm5)", DC_CHARGER_ALARM_CODES],
    ["Plant Alarm Codes 6 (Alarm6)", PLANT_ALARM_CODES6],
    ["Plant Alarm Codes 7 (Alarm7)", PLANT_ALARM_CODES7],
    ["AC Charger Alarm Codes 1 (Appendix 8)", AC_CHARGER_ALARM_CODES1],
    ["AC Charger Alarm Codes 2 (Appendix 9)", AC_CHARGER_ALARM_CODES2],
    ["AC Charger Alarm Codes 3 (Appendix 10)", AC_CHARGER_ALARM_CODES3],
  ];

  for (const [name, map] of alarms) {
    lines.push(enumTable(name, map));
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`Generated from packages/modbus-mcp/src/constants/registry.ts — ${Object.keys(REGISTERS).length} register definitions, ${enums.length + alarms.length} enum maps.`);

  return lines.join("\n");
}

// Write
const docsDir = resolve(ROOT, "docs");
mkdirSync(docsDir, { recursive: true });
const output = generate();
writeFileSync(resolve(docsDir, "registers.md"), output, "utf-8");
console.log(`Generated docs/registers.md — ${Object.keys(REGISTERS).length} registers, ${Object.keys(REGISTERS).length > 0 ? "OK" : "ERROR"}`);
