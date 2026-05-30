---
name: sigen-status
description: |
  Quick one-shot Sigenergy ESS inverter dashboard. Calls read_plant, read_inverter_detail, read_plant_energy, and read_alarms via the sigen-mcp MCP server and synthesizes a formatted system overview with interpretation. Use proactively when the user asks for system status, dashboard, overview, health check, or current power flow. Also triggers on "how's the inverter", "what's the system doing", "give me a summary".
---

# sigen-status — Inverter System Overview

Quick one-shot dashboard of the entire Sigenergy ESS system. Calls all relevant MCP tools and synthesizes the results into a readable status summary.

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

Combine the data into an ASCII dashboard followed by a text summary.

**Dashboard template** — use plain ASCII (no Unicode box drawing) for consistent rendering:

```
====================================================
  SigenStor EC 10.0 SP AU     {day} {date} {time}
====================================================
  {EMS Mode}  |  {Grid}  |  {Running State}  |  {alarms}
----------------------------------------------------
  {PV} kW PV
    |
    +-- Load   {load} kW
    +-- Bat {up/down} {ess_power} kW  (SOC {soc}%, SOH {soh}%)
    +-- Grid   {grid_power} kW  ({buying/exporting})
----------------------------------------------------
  Battery:  {soc}% SOC  |  {soh}% SOH  |  {temp}C
  Grid:     {freq} Hz  |  {voltage} V   |  PF {pf}
----------------------------------------------------
  Lifetime:
    PV Generated    {pv_total} kWh
    Grid Import     {import} kWh
    Grid Export     {export} kWh
    Bat Cycle       {bat_charge} / {bat_discharge} kWh
    EV DC Charged   {ev_dc} kWh
    Today's Use     {today} kWh
====================================================
```

**Summary** — after the dashboard, add a brief text interpretation covering:

1. **Battery trajectory** — is SOC going up or down? How fast? Time to full/empty estimate if relevant.
2. **Solar vs load** — is PV covering the house? Any notable surplus or deficit?
3. **Grid interaction** — buying or selling? How much?
4. **Notable flags** — low SOC, high temp, alarms, poor power factor, frequency deviation
5. **Recommendation** — one sentence on what the user might want to change or watch

Example:

```
Battery's been climbing steadily all morning — 2.1% → 2.9% since first check. Six kilowatts
of solar with ~4 kW house load leaves 2 kW going into the battery. At this net charge rate
it'll take about 18 hours to fill 40 kWh from near-empty, which won't happen off solar alone
in winter. The Custom/TOU schedule is probably the bottleneck — check whether your charge
window aligns with this solar production period. Grid draw is negligible (0.01 kW), so the
house is essentially running off solar with the excess trickling into the battery.
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
