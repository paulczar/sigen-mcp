#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ModbusRTU: new (...args: any[]) => any = require("modbus-serial");
import {
  REGISTERS,
  EMS_MODES,
  GRID_STATUSES,
  DC_CHARGER_STATUSES,
  RUNNING_STATES,
  REMOTE_EMS_MODES,
  AC_CHARGER_STATES,
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
} from "./constants/registry.js";
import { SigenCloudClient } from "./cloud/client.js";

function toProtoAddr(addr: number): number {
  return addr;
}

function regType(addr: number): "input" | "holding" {
  return addr >= 40001 ? "holding" : "input";
}

function parseArgs() {
  const args = process.argv.slice(2);
  let host = "";
  let port = 502;
  let cloudUser = "";
  let cloudPass = "";
  let cloudRegion = "aus";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--host" && i + 1 < args.length) host = args[++i];
    else if (args[i] === "--port" && i + 1 < args.length) port = parseInt(args[++i], 10);
    else if (args[i] === "--cloud-user" && i + 1 < args.length) cloudUser = args[++i];
    else if (args[i] === "--cloud-pass" && i + 1 < args.length) cloudPass = args[++i];
    else if (args[i] === "--cloud-region" && i + 1 < args.length) cloudRegion = args[++i];
  }
  if (!host) {
    console.error("Usage: sigen-mcp --host <ip> [--port <port>] [--cloud-user <email>] [--cloud-pass <password>] [--cloud-region <region>]");
    process.exit(1);
  }
  return { host, port, cloudUser, cloudPass, cloudRegion };
}

function lookupLabel(t: Record<number, string>, v: number, f?: string): string {
  return t[v] ?? f ?? `Unknown (${v})`;
}

function errMsg(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

function decodeAlarms(value: number, alarmMap: Record<number, string>): string[] {
  const active: string[] = [];
  for (const [bit, desc] of Object.entries(alarmMap)) {
    if (value & (1 << Number(bit))) {
      active.push(desc);
    }
  }
  return active;
}

const { host, port, cloudUser, cloudPass, cloudRegion } = parseArgs();
const client = new ModbusRTU();
let connected = false;

let cloudClient: SigenCloudClient | null = null;
if (cloudUser && cloudPass) {
  try {
    cloudClient = new SigenCloudClient({ region: cloudRegion, username: cloudUser, password: cloudPass });
    console.error(`SigenCloud client initialized (region: ${cloudRegion})`);
  } catch (err) {
    console.error(`SigenCloud init warning: ${errMsg(err)}`);
  }
}

async function ensureConnected() {
  if (connected) return;
  try {
    await client.connectTCP(host, { port });
    connected = true;
  } catch (err) {
    connected = false;
    throw new McpError(ErrorCode.InternalError,
      `Failed to connect: ${errMsg(err)}`);
  }
}

async function readRegister(address: number, slave: number, signed = false): Promise<number> {
  await ensureConnected();
  try {
    client.setID(slave);
    const pa = toProtoAddr(address);
    const res = regType(address) === "holding"
      ? await client.readHoldingRegisters(pa, 1)
      : await client.readInputRegisters(pa, 1);
    const val = res.data[0];
    return signed && val >= 0x8000 ? val - 0x10000 : val;
  } catch (err) {
    const msg = errMsg(err);
    if (!msg.startsWith("Modbus exception")) connected = false;
    throw new McpError(ErrorCode.InternalError, `Modbus read error at ${address}: ${msg}`);
  }
}

async function readRegister32(address: number, slave: number): Promise<number> {
  await ensureConnected();
  try {
    client.setID(slave);
    const pa = toProtoAddr(address);
    const res = regType(address) === "holding"
      ? await client.readHoldingRegisters(pa, 2)
      : await client.readInputRegisters(pa, 2);
    const raw = (res.data[0] << 16) | res.data[1];
    return raw >= 0x80000000 ? raw - 0x100000000 : raw;
  } catch (err) {
    const msg = errMsg(err);
    if (!msg.startsWith("Modbus exception")) connected = false;
    throw new McpError(ErrorCode.InternalError, `Modbus read error at ${address} (32-bit): ${msg}`);
  }
}

async function readRegister64(address: number, slave: number): Promise<number> {
  await ensureConnected();
  try {
    client.setID(slave);
    const pa = toProtoAddr(address);
    const res = regType(address) === "holding"
      ? await client.readHoldingRegisters(pa, 4)
      : await client.readInputRegisters(pa, 4);
    const hi = (res.data[0] << 16) | res.data[1];
    const lo = (res.data[2] << 16) | res.data[3];
    return Number((BigInt(hi >>> 0) << 32n) | BigInt(lo >>> 0));
  } catch (err) {
    const msg = errMsg(err);
    if (!msg.startsWith("Modbus exception")) connected = false;
    throw new McpError(ErrorCode.InternalError, `Modbus read error at ${address} (64-bit): ${msg}`);
  }
}

async function writeRegister(address: number, value: number, slave: number): Promise<void> {
  await ensureConnected();
  try {
    client.setID(slave);
    await client.writeRegister(toProtoAddr(address), value);
  } catch (err) {
    const msg = errMsg(err);
    if (!msg.startsWith("Modbus exception")) connected = false;
    throw new McpError(ErrorCode.InternalError, `Modbus write error at ${address}: ${msg}`);
  }
}

const server = new Server(
  { name: "sigen-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_registers",
      description: "Read one or more consecutive registers",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "number" },
          count: { type: "number", default: 1 },
          slave: { type: "number", default: 1 },
        },
        required: ["address"],
      },
    },
    {
      name: "read_ems_mode",
      description: "Read and decode the current EMS operating mode",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_grid_status",
      description: "Read grid connection status",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_battery_status",
      description: "Read battery SOC and SOH",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_pv_power",
      description: "Read PV generation from string voltage and current",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_ev_status",
      description: "Read DC charger status, vehicle SOC, and charging metrics",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "write_register",
      description: "Write a single holding register",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "number" },
          value: { type: "number" },
          slave: { type: "number", default: 1 },
        },
        required: ["address", "value"],
      },
    },
    {
      name: "set_ems_mode",
      description: "Set EMS operating mode (0=MaxSelfConsumption, 1=AI, 2=TOU, 5=FullFeedIn, 6=VPP, 7=RemoteEMS, 9=Custom)",
      inputSchema: {
        type: "object",
        properties: { mode: { type: "number" } },
        required: ["mode"],
      },
    },
    {
      name: "set_charge_limit",
      description: "Set max charging power limit in kW",
      inputSchema: {
        type: "object",
        properties: { kw: { type: "number" } },
        required: ["kw"],
      },
    },
    {
      name: "set_discharge_limit",
      description: "Set max discharging power limit in kW",
      inputSchema: {
        type: "object",
        properties: { kw: { type: "number" } },
        required: ["kw"],
      },
    },
    {
      name: "read_plant",
      description: "Read comprehensive plant-level status: EMS mode, grid status, power flow, battery, running state, alarms",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_plant_energy",
      description: "Read accumulated plant energy counters: PV generation, grid import/export, battery charge/discharge, EV charging",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_inverter_detail",
      description: "Read inverter-level details: running state, phase power, temperature, grid V/f, battery, PV",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_ac_charger",
      description: "Read AC EV charger status: system state, charging power, total energy, alarms",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "read_alarms",
      description: "Read and decode all active alarm registers across the system",
      inputSchema: { type: "object", properties: {} },
    },
    // ── Cloud API tools (require --cloud-user / --cloud-pass) ─────────
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
      description: "Get historical energy data at 5-minute, hourly, or daily intervals",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYYMMDD format" },
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const slave = (args?.slave as number) ?? 247;

  try {
    switch (name) {
      case "read_registers": {
        const address = args?.address as number | undefined;
        const count = (args?.count as number) ?? 1;
        if (address == null) {
          throw new McpError(ErrorCode.InvalidParams, "address is required");
        }
        await ensureConnected();
        client.setID(slave);
        const pa = toProtoAddr(address);
        let data: number[];
        try {
          if (regType(address) === "holding") throw new Error("skip");
          data = (await client.readInputRegisters(pa, count)).data;
        } catch {
          data = (await client.readHoldingRegisters(pa, count)).data;
        }
        return { content: [{ type: "text", text: `Register ${address} (${count}): [${data.join(", ")}]` }] };
      }

      case "read_ems_mode": {
        const r = REGISTERS.EMS_MODE;
        const raw = await readRegister(r.address, r.slave);
        return { content: [{ type: "text", text: `EMS Mode: ${raw} \u2013 ${lookupLabel(EMS_MODES, raw)}` }] };
      }

      case "read_grid_status": {
        const r = REGISTERS.PLANT_ON_OFF_GRID_STATUS;
        const raw = await readRegister(r.address, r.slave);
        return { content: [{ type: "text", text: `Grid Status: ${raw} \u2013 ${lookupLabel(GRID_STATUSES, raw)}` }] };
      }

      case "read_battery_status": {
        const socRaw = await readRegister(REGISTERS.BATTERY_SOC.address, REGISTERS.BATTERY_SOC.slave);
        const sohRaw = await readRegister(REGISTERS.BATTERY_SOH.address, REGISTERS.BATTERY_SOH.slave);
        return { content: [{ type: "text", text: `Battery SOC: ${(socRaw / 10).toFixed(1)}%\nBattery SOH: ${(sohRaw / 10).toFixed(1)}%` }] };
      }

      case "read_pv_power": {
        const pv1v = await readRegister(REGISTERS.INVERTER_PV1_VOLTAGE.address, REGISTERS.INVERTER_PV1_VOLTAGE.slave);
        const pv1i = await readRegister(REGISTERS.INVERTER_PV1_CURRENT.address, REGISTERS.INVERTER_PV1_CURRENT.slave);
        const pv2v = await readRegister(REGISTERS.INVERTER_PV2_VOLTAGE.address, REGISTERS.INVERTER_PV2_VOLTAGE.slave);
        const pv2i = await readRegister(REGISTERS.INVERTER_PV2_CURRENT.address, REGISTERS.INVERTER_PV2_CURRENT.slave);
        const pv3v = await readRegister(REGISTERS.INVERTER_PV3_VOLTAGE.address, REGISTERS.INVERTER_PV3_VOLTAGE.slave);
        const pv3i = await readRegister(REGISTERS.INVERTER_PV3_CURRENT.address, REGISTERS.INVERTER_PV3_CURRENT.slave);
        const pv4v = await readRegister(REGISTERS.INVERTER_PV4_VOLTAGE.address, REGISTERS.INVERTER_PV4_VOLTAGE.slave);
        const pv4i = await readRegister(REGISTERS.INVERTER_PV4_CURRENT.address, REGISTERS.INVERTER_PV4_CURRENT.slave);
        const p1 = ((pv1v / 10) * (pv1i / 100)) / 1000;
        const p2 = ((pv2v / 10) * (pv2i / 100)) / 1000;
        const p3 = ((pv3v / 10) * (pv3i / 100)) / 1000;
        const p4 = ((pv4v / 10) * (pv4i / 100)) / 1000;
        const total = p1 + p2 + p3 + p4;
        return {
          content: [{
            type: "text",
            text: [
              `PV Generation: ${total.toFixed(3)} kW`,
              `  String 1: ${p1.toFixed(3)} kW (${(pv1v / 10).toFixed(1)}V \u00d7 ${(pv1i / 100).toFixed(2)}A)`,
              `  String 2: ${p2.toFixed(3)} kW (${(pv2v / 10).toFixed(1)}V \u00d7 ${(pv2i / 100).toFixed(2)}A)`,
              `  String 3: ${p3.toFixed(3)} kW (${(pv3v / 10).toFixed(1)}V \u00d7 ${(pv3i / 100).toFixed(2)}A)`,
              `  String 4: ${p4.toFixed(3)} kW (${(pv4v / 10).toFixed(1)}V \u00d7 ${(pv4i / 100).toFixed(2)}A)`,
            ].join("\n"),
          }],
        };
      }

      case "read_ev_status": {
        const [status, soc, power, voltage, current] = await Promise.all([
          readRegister(REGISTERS.DC_CHARGER_STATUS.address, REGISTERS.DC_CHARGER_STATUS.slave),
          readRegister(REGISTERS.DC_CHARGER_VEHICLE_SOC.address, REGISTERS.DC_CHARGER_VEHICLE_SOC.slave),
          readRegister32(REGISTERS.DC_CHARGER_POWER.address, REGISTERS.DC_CHARGER_POWER.slave).catch(() => 0),
          readRegister(REGISTERS.DC_CHARGER_VOLTAGE.address, REGISTERS.DC_CHARGER_VOLTAGE.slave).catch(() => 0),
          readRegister(REGISTERS.DC_CHARGER_CURRENT.address, REGISTERS.DC_CHARGER_CURRENT.slave).catch(() => 0),
        ]);
        return {
          content: [{
            type: "text",
            text: [
              `DC Charger: ${lookupLabel(DC_CHARGER_STATUSES, status)}`,
              `Vehicle SOC: ${(soc / 10).toFixed(1)}%`,
              `Charging: ${(power / 1000).toFixed(3)} kW @ ${(voltage / 10).toFixed(1)}V / ${(current / 1000).toFixed(2)}A`,
            ].join("\n"),
          }],
        };
      }

      case "write_register": {
        const wrAddr = args?.address as number | undefined;
        const wrVal = args?.value as number | undefined;
        if (wrAddr == null) throw new McpError(ErrorCode.InvalidParams, "address is required");
        if (wrVal == null) throw new McpError(ErrorCode.InvalidParams, "value is required");
        await writeRegister(wrAddr, wrVal, slave);
        return { content: [{ type: "text", text: `Register ${wrAddr} set to ${wrVal}` }] };
      }

      case "set_ems_mode": {
        const reg = REGISTERS.EMS_MODE_SETPOINT;
        const mode = args?.mode as number | undefined;
        if (mode == null) throw new McpError(ErrorCode.InvalidParams, "mode is required");
        if (!(mode in REMOTE_EMS_MODES)) {
          throw new McpError(ErrorCode.InvalidParams,
            `Invalid EMS mode ${mode}. Valid: ${Object.entries(REMOTE_EMS_MODES).map(([k, v]) => `${k}=${v}`).join(", ")}`);
        }
        await writeRegister(reg.address, mode, reg.slave);
        return { content: [{ type: "text", text: `EMS mode set to ${mode} \u2013 ${lookupLabel(REMOTE_EMS_MODES, mode)}` }] };
      }

      case "set_charge_limit": {
        const reg = REGISTERS.MAX_CHARGE_LIMIT;
        const kw = args?.kw as number | undefined;
        if (kw == null) throw new McpError(ErrorCode.InvalidParams, "kw is required");
        if (kw < 0) throw new McpError(ErrorCode.InvalidParams, "charge limit must be >= 0");
        await writeRegister(reg.address, kw, reg.slave);
        return { content: [{ type: "text", text: `Max charge limit set to ${kw} kW` }] };
      }

      case "set_discharge_limit": {
        const reg = REGISTERS.MAX_DISCHARGE_LIMIT;
        const kw = args?.kw as number | undefined;
        if (kw == null) throw new McpError(ErrorCode.InvalidParams, "kw is required");
        if (kw < 0) throw new McpError(ErrorCode.InvalidParams, "discharge limit must be >= 0");
        await writeRegister(reg.address, kw, reg.slave);
        return { content: [{ type: "text", text: `Max discharge limit set to ${kw} kW` }] };
      }

      case "read_plant": {
        const r = REGISTERS;
        const [emsMode, gridStatusRaw, runningState, gridP, pvP, essP, plantP, loadP, soc, soh] = await Promise.all([
          readRegister(r.EMS_MODE.address, r.EMS_MODE.slave),
          readRegister(r.PLANT_ON_OFF_GRID_STATUS.address, r.PLANT_ON_OFF_GRID_STATUS.slave),
          readRegister(r.PLANT_RUNNING_STATE.address, r.PLANT_RUNNING_STATE.slave),
          readRegister32(r.PLANT_GRID_ACTIVE_POWER.address, r.PLANT_GRID_ACTIVE_POWER.slave),
          readRegister32(r.PLANT_PV_POWER.address, r.PLANT_PV_POWER.slave),
          readRegister32(r.PLANT_ESS_POWER.address, r.PLANT_ESS_POWER.slave),
          readRegister32(r.PLANT_ACTIVE_POWER.address, r.PLANT_ACTIVE_POWER.slave),
          readRegister32(r.PLANT_GENERAL_LOAD_POWER.address, r.PLANT_GENERAL_LOAD_POWER.slave).catch(() => 0),
          readRegister(r.BATTERY_SOC.address, r.BATTERY_SOC.slave),
          readRegister(r.BATTERY_SOH.address, r.BATTERY_SOH.slave),
        ]);
        return {
          content: [{
            type: "text",
            text: [
              `Plant Status:`,
              `  EMS Mode: ${emsMode} – ${lookupLabel(EMS_MODES, emsMode)}`,
              `  Grid: ${lookupLabel(GRID_STATUSES, gridStatusRaw)}`,
              `  Running State: ${lookupLabel(RUNNING_STATES, runningState)}`,
              `  Grid Power: ${(gridP / 1000).toFixed(3)} kW (>0 buy, <0 sell)`,
              `  PV Generation: ${(pvP / 1000).toFixed(3)} kW`,
              `  ESS Power: ${(essP / 1000).toFixed(3)} kW (<0 discharge, >0 charge)`,
              `  Plant Load: ${(loadP / 1000).toFixed(3)} kW`,
              `  Battery SOC: ${(soc / 10).toFixed(1)}%`,
              `  Battery SOH: ${(soh / 10).toFixed(1)}%`,
            ].join("\n"),
          }],
        };
      }

      case "read_plant_energy": {
        const r = REGISTERS;
        const [pvEnergy, gridImport, gridExport, batteryChg, batteryDis, evdcChg, evacChg, dailyConsumed] = await Promise.all([
          readRegister64(r.PLANT_ACCUMULATED_PV_ENERGY.address, r.PLANT_ACCUMULATED_PV_ENERGY.slave),
          readRegister64(r.PLANT_GRID_IMPORT_ENERGY.address, r.PLANT_GRID_IMPORT_ENERGY.slave),
          readRegister64(r.PLANT_GRID_EXPORT_ENERGY.address, r.PLANT_GRID_EXPORT_ENERGY.slave),
          readRegister64(r.PLANT_ACCUMULATED_BATTERY_CHARGE_ENERGY.address, r.PLANT_ACCUMULATED_BATTERY_CHARGE_ENERGY.slave),
          readRegister64(r.PLANT_ACCUMULATED_BATTERY_DISCHARGE_ENERGY.address, r.PLANT_ACCUMULATED_BATTERY_DISCHARGE_ENERGY.slave),
          readRegister64(r.PLANT_EVDC_CHARGE_ENERGY.address, r.PLANT_EVDC_CHARGE_ENERGY.slave),
          readRegister64(r.PLANT_EVAC_CHARGE_ENERGY.address, r.PLANT_EVAC_CHARGE_ENERGY.slave).catch(() => 0),
          readRegister32(r.PLANT_DAILY_CONSUMED_ENERGY.address, r.PLANT_DAILY_CONSUMED_ENERGY.slave).catch(() => 0),
        ]);
        return {
          content: [{
            type: "text",
            text: [
              `Accumulated Energy (kWh):`,
              `  PV Generation: ${(pvEnergy / 100).toFixed(1)}`,
              `  Grid Import: ${(gridImport / 100).toFixed(1)}`,
              `  Grid Export: ${(gridExport / 100).toFixed(1)}`,
              `  Battery Charge: ${(batteryChg / 100).toFixed(1)}`,
              `  Battery Discharge: ${(batteryDis / 100).toFixed(1)}`,
              `  EVDC Charge: ${(evdcChg / 100).toFixed(1)}`,
              `  EVAC Charge: ${(evacChg / 100).toFixed(1)}`,
              `  Today's Consumption: ${(dailyConsumed / 100).toFixed(1)}`,
            ].join("\n"),
          }],
        };
      }

      case "read_inverter_detail": {
        const r = REGISTERS;
        const [runState, activeP, reactiveP, essPwr, freq, temp, outType, phaseV, phaseI, pf, battSoc, battSoh, pvPwr] = await Promise.all([
          readRegister(r.INVERTER_RUNNING_STATE.address, r.INVERTER_RUNNING_STATE.slave),
          readRegister32(r.INVERTER_ACTIVE_POWER.address, r.INVERTER_ACTIVE_POWER.slave),
          readRegister32(r.INVERTER_REACTIVE_POWER.address, r.INVERTER_REACTIVE_POWER.slave),
          readRegister32(r.INVERTER_ESS_CHARGE_DISCHARGE_POWER.address, r.INVERTER_ESS_CHARGE_DISCHARGE_POWER.slave),
          readRegister(r.INVERTER_GRID_FREQUENCY.address, r.INVERTER_GRID_FREQUENCY.slave),
          readRegister(r.INVERTER_PCS_INTERNAL_TEMP.address, r.INVERTER_PCS_INTERNAL_TEMP.slave, true),
          readRegister(r.INVERTER_OUTPUT_TYPE.address, r.INVERTER_OUTPUT_TYPE.slave),
          readRegister32(r.INVERTER_PHASE_A_VOLTAGE.address, r.INVERTER_PHASE_A_VOLTAGE.slave),
          readRegister32(r.INVERTER_PHASE_A_CURRENT.address, r.INVERTER_PHASE_A_CURRENT.slave),
          readRegister(r.INVERTER_POWER_FACTOR.address, r.INVERTER_POWER_FACTOR.slave, true),
          readRegister(r.INVERTER_BATTERY_SOC.address, r.INVERTER_BATTERY_SOC.slave),
          readRegister(r.INVERTER_BATTERY_SOH.address, r.INVERTER_BATTERY_SOH.slave),
          readRegister32(r.INVERTER_PV_POWER.address, r.INVERTER_PV_POWER.slave),
        ]);
        return {
          content: [{
            type: "text",
            text: [
              `Inverter Status:`,
              `  Running State: ${lookupLabel(RUNNING_STATES, runState)}`,
              `  Active Power: ${(activeP / 1000).toFixed(3)} kW`,
              `  Reactive Power: ${(reactiveP / 1000).toFixed(3)} kvar`,
              `  ESS Power: ${(essPwr / 1000).toFixed(3)} kW`,
              `  Grid: ${(freq / 100).toFixed(2)} Hz / ${(phaseV / 100).toFixed(1)} V / ${(phaseI / 100).toFixed(1)} A`,
              `  Power Factor: ${(pf / 1000).toFixed(3)}`,
              `  Internal Temp: ${(temp / 10).toFixed(1)}°C`,
              `  Output Type: ${lookupLabel(OUTPUT_TYPES, outType)}`,
              `  Battery SOC: ${(battSoc / 10).toFixed(1)}% / SOH: ${(battSoh / 10).toFixed(1)}%`,
              `  PV Power: ${(pvPwr / 1000).toFixed(3)} kW`,
            ].join("\n"),
          }],
        };
      }

      case "read_ac_charger": {
        const r = REGISTERS;
        const [state, totalEnergy, chargePwr, ratedPwr, ratedCur, ratedVolt, alarm1, alarm2, alarm3] = await Promise.all([
          readRegister(r.AC_CHARGER_SYSTEM_STATE.address, r.AC_CHARGER_SYSTEM_STATE.slave).catch(() => 0),
          readRegister32(r.AC_CHARGER_TOTAL_ENERGY.address, r.AC_CHARGER_TOTAL_ENERGY.slave).catch(() => 0),
          readRegister32(r.AC_CHARGER_CHARGING_POWER.address, r.AC_CHARGER_CHARGING_POWER.slave).catch(() => 0),
          readRegister32(r.AC_CHARGER_RATED_POWER.address, r.AC_CHARGER_RATED_POWER.slave).catch(() => 0),
          readRegister32(r.AC_CHARGER_RATED_CURRENT.address, r.AC_CHARGER_RATED_CURRENT.slave).catch(() => 0),
          readRegister(r.AC_CHARGER_RATED_VOLTAGE.address, r.AC_CHARGER_RATED_VOLTAGE.slave).catch(() => 0),
          readRegister(r.AC_CHARGER_ALARM1.address, r.AC_CHARGER_ALARM1.slave).catch(() => 0),
          readRegister(r.AC_CHARGER_ALARM2.address, r.AC_CHARGER_ALARM2.slave).catch(() => 0),
          readRegister(r.AC_CHARGER_ALARM3.address, r.AC_CHARGER_ALARM3.slave).catch(() => 0),
        ]);
        return {
          content: [{
            type: "text",
            text: [
              `AC Charger (` + lookupLabel(AC_CHARGER_STATES, state) + `):`,
              `  Charging: ${(chargePwr / 1000).toFixed(3)} kW`,
              `  Total Energy: ${(totalEnergy / 100).toFixed(1)} kWh`,
              `  Rated: ${(ratedPwr / 1000).toFixed(1)} kW / ${(ratedCur / 100).toFixed(1)} A / ${(ratedVolt / 10).toFixed(0)} V`,
              `  Active Alarms:` + [alarm1, alarm2, alarm3].map((a, i) =>
                a ? `\n    ` + decodeAlarms(a, [AC_CHARGER_ALARM_CODES1, AC_CHARGER_ALARM_CODES2, AC_CHARGER_ALARM_CODES3][i]).join(", ") : ""
              ).join("").replace(/^ +/, " None"),
            ].join("\n"),
          }],
        };
      }

      case "read_alarms": {
        const r = REGISTERS;
        const [alarm1, alarm2, alarm3, alarm4, alarm5, alarm6, alarm7] = await Promise.all([
          readRegister(r.PLANT_ALARM1.address, r.PLANT_ALARM1.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM2.address, r.PLANT_ALARM2.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM3.address, r.PLANT_ALARM3.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM4.address, r.PLANT_ALARM4.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM5.address, r.PLANT_ALARM5.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM6.address, r.PLANT_ALARM6.slave).catch(() => 0),
          readRegister(r.PLANT_ALARM7.address, r.PLANT_ALARM7.slave).catch(() => 0),
        ]);
        const sections: string[] = ["Active Alarms:"];
        if (alarm1) sections.push(`  PCS Alarm1: ` + decodeAlarms(alarm1, PCS_ALARM_CODES).join(", "));
        if (alarm2) sections.push(`  PCS Alarm2: ` + decodeAlarms(alarm2, PCS_ALARM_CODES2).join(", "));
        if (alarm3) sections.push(`  ESS Alarm: ` + decodeAlarms(alarm3, ESS_ALARM_CODES).join(", "));
        if (alarm4) sections.push(`  Gateway: ` + decodeAlarms(alarm4, GATEWAY_ALARM_CODES).join(", "));
        if (alarm5) sections.push(`  DC Charger: ` + decodeAlarms(alarm5, DC_CHARGER_ALARM_CODES).join(", "));
        if (alarm6) sections.push(`  Plant Alarm6: ` + decodeAlarms(alarm6, PLANT_ALARM_CODES6).join(", "));
        if (alarm7) sections.push(`  Plant Alarm7: ` + decodeAlarms(alarm7, PLANT_ALARM_CODES7).join(", "));
        if (!alarm1 && !alarm2 && !alarm3 && !alarm4 && !alarm5 && !alarm6 && !alarm7) {
          sections.push(`  No active alarms`);
        }
        return { content: [{ type: "text", text: sections.join("\n") }] };
      }

      // ── Cloud API tools ─────────────────────────────────────────────

      case "cloud_station_info":
      case "cloud_operational_modes":
      case "cloud_current_mode":
      case "cloud_energy_flow":
      case "cloud_history":
      case "cloud_smart_loads":
      case "cloud_alarms": {
        if (!cloudClient) {
          throw new McpError(ErrorCode.InvalidRequest,
            "SigenCloud not configured. Provide --cloud-user and --cloud-pass.");
        }
        switch (name) {
          case "cloud_station_info": {
            const info = await cloudClient.getStationInfo();
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
            const modes = await cloudClient.getOperationalModes();
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
              cloudClient.getOperationalModes(),
              cloudClient.getCurrentMode(),
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
            const flow = await cloudClient.getEnergyFlow();
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
            if (!date) throw new McpError(ErrorCode.InvalidParams, "date is required (YYYYMMDD)");
            const level = (args?.level as string) ?? "day";
            const data = await cloudClient.getHistory(date, level);
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
            const loads = await cloudClient.getSmartLoads();
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
            const alarms = await cloudClient.getAlarms(page, size);
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
        }
        break;
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof McpError) throw err;
    throw new McpError(ErrorCode.InternalError,
      `Tool error: ${errMsg(err)}`);
  }
});

async function main() {
  try {
    await ensureConnected();
    console.error(`Connected to Sigenergy inverter at ${host}:${port}`);
  } catch (err) {
    console.error(`Warning: Could not connect: ${errMsg(err)}`);
  }
  await server.connect(new StdioServerTransport());
  console.error("sigen-mcp MCP server running on stdio");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
