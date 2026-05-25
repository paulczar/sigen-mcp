# sigen-status — Inverter System Overview

Quick one-shot dashboard of the entire Sigenergy ESS system. Calls all relevant MCP tools and synthesizes the results into a readable status summary.

## When to Use

Use this skill whenever the user asks for:
- "What's the system status?"
- "How's the inverter doing?"
- "Give me a dashboard / overview"
- "System health check"
- "What's the current power flow?"

## Prerequisites

- The `sigen-mcp` MCP server must be connected to the inverter
- No additional parameters needed — all tools read from the connected device

## Procedure

### 1. Read Plant Status

Call `read_plant` — this returns:
- EMS operating mode (e.g., Custom, MaxSelfConsumption, TOU)
- Grid connection status (OnGrid / OffGrid)
- Running state (Running / Standby / Fault)
- PV generation (kW)
- ESS power (kW) — positive = discharging, negative = charging
- Plant active power (kW) — negative = exporting to grid
- Load consumption (kW)
- Battery SOC (%) and SOH (%)
- Battery temperature (°C)

### 2. Read Inverter Detail

Call `read_inverter_detail` — this returns:
- Running state (should match plant)
- Active/reactive power (kW/kvar)
- Grid frequency (Hz) — should be ~50 Hz
- Phase voltage (V) and current (A)
- Power factor (should be near 1.0 or -1.0)
- Internal temperature (°C)
- Battery SOC/SOH from inverter perspective
- Total PV power (kW) — compare with read_plant

### 3. Read Accumulated Energy

Call `read_plant_energy` — this returns lifetime kWh counters:
- PV generation (total produced)
- Grid import/export (net with grid)
- Battery charge/discharge (cycles)
- EV DC charge (energy used for EV)
- EV AC charge
- Today's consumption

### 4. Read Alarms

Call `read_alarms` — this returns any active alarm descriptions.
If "No active alarms" — the system is healthy.
If alarms are present, list them all.

### 5. Synthesize

Combine the data into a structured report like:

```
## System Status — {timestamp}

**State**: {EMS Mode} | {Grid Status} | {Running State}
**Health**: {alarm count} active alarms

### Power Flow
- PV: {x} kW
- Battery: {x} kW ({x}% SOC)
- Grid: {x} kW {importing/exporting}
- Load: {x} kW
- Power Factor: {x}

### Energy (Lifetime)
- PV Generated: {x} kWh
- Grid Imported: {x} kWh / Exported: {x} kWh
- Battery: {x} kWh charged / {x} kWh discharged
- EV Charging: {x} kWh

### Inverter
- Frequency: {x} Hz
- Internal Temp: {x}°C
- Battery SOC: {x}% / SOH: {x}%
```

### Interpretation Notes

| Signal | Normal Range | Flag If |
|--------|-------------|---------|
| Grid frequency | 49.5–50.5 Hz | Outside range (grid issue) |
| Battery SOC | 10–100% | < 10% (critical low) |
| Battery SOH | 80–100% | < 80% (degraded) |
| Internal temp | < 65°C | > 65°C (overheating risk) |
| Power factor | -1.0 to 1.0 | Near 0 (poor power quality) |
| Alarms | None | Any active alarm needs investigation |
