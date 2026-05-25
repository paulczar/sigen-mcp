# sigen-diagnose — Inverter Diagnostic Workflow

Step-by-step diagnostic procedure for investigating issues with the Sigenergy ESS system. Designed for systematic troubleshooting rather than quick status checks.

## When to Use

Use this skill when the user reports:
- "Something seems wrong with the system"
- "I'm getting an alarm"
- "The battery isn't charging/discharging"
- "PV production seems low"
- "The inverter is showing an error"
- "The system went off-grid"
- "Connectivity issues with the inverter"

## Prerequisites

- `sigen-mcp` MCP server must be connected
- User should describe the observed symptom if possible

## Procedure

### Step 1: Check Running State

Call `read_plant` and look at:
- **Running State**: Should be `Running (1)`. If `Fault (2)`, `Shutdown (3)`, or `Standby (0)`, there's an operational issue.
- **Grid Status**: If `OffGrid(Auto)` or `OffGrid(Manual)`, the inverter is islanded from the grid.

→ Grid goes off-grid during:
  - Grid outage / blackout
  - Grid voltage/frequency outside limits
  - Manual islanding (e.g., for backup mode)

### Step 2: Decode Active Alarms

Call `read_alarms`. If alarms are active:
- Cross-reference with the register definitions in `registry.ts` (alarm code appendices 2–13)
- **PCS alarms (Appendix 2-3)**: Inverter hardware issues (grid fault, insulation, temperature, DC bus)
- **ESS alarms (Appendix 4)**: Battery issues (SOC low, temp, comms, cell voltage)
- **Gateway alarms (Appendix 5)**: Communication or system-level issues
- **DC Charger alarms (Appendix 11)**: EV charging issues
- **Plant alarms (Appendix 12-13)**: System configuration or sensor issues

### Step 3: Check Power Flow

Call `read_inverter_detail` looking for anomalies:

| Symptom | What to Check |
|---------|---------------|
| Low PV | PV string V/I readings — compare multiple strings. If one string is 0V while others produce, that string may be faulted |
| Battery not cycling | ESS Power ~0 kW despite PV available. Check if EMS mode is correct. Check `read_plant` for grid status |
| Export unexpectedly high/low | Plant active power vs PV generation vs ESS power vs load |
| Inverter tripping | Running state, internal temp, frequency — may be grid fault |

### Step 4: Check Battery Health

Call `read_battery_status` or extract from `read_plant`:
- **SOC vs SOH**: Rapid SOC changes with low SOH suggests battery degradation
- **Temperature**: If battery temp > 45°C or < 0°C, performance may be limited
- **ESS Power Availability**: In `read_plant`, compare current ESS power with available max charge/discharge

### Step 5: Check EMS Mode

Call `read_ems_mode`:
- **0 (MaxSelfConsumption)**: Self-consumption priority — charges battery from PV excess, discharges when load > PV
- **1 (AI)**: Cloud-optimized mode
- **2 (TOU)**: Time-of-use — follows configured schedule
- **5 (FullFeedIn)**: All PV to grid, no self-consumption
- **9 (Custom)**: Custom parameters

If the system isn't behaving as expected, the EMS mode may be wrong. Check with the user what mode they expect.

### Step 6: Check Energy Accumulators

Call `read_plant_energy` to look at trends:
- **Zero PV generation on a sunny day** → Possible inverter/panel issue
- **Unbalanced import/export** → May indicate meter wiring issue or CT clamp problem
- **EV energy vs expected** → DC charger may not be working (check Step 3)

### Common Issue Patterns

| Pattern | Likely Cause | Action |
|---------|-------------|--------|
| OffGrid + no alarms | Grid outage | Wait for grid restoration or check grid connection |
| OffGrid + PCS alarms | Grid fault (V/Hz outside limits) | Check grid quality, may need electrician |
| Running but 0 PV | Night time, or PV string fault | Check PV string voltages. If 0V on all strings → night. If 0V on one string → fault |
| Battery stuck at SOC | Hit charge/discharge limit | Check if `set_charge_limit` / `set_discharge_limit` set too low |
| Export > PV + Battery | Impossible — indicates measurement error | CT clamp may be misconfigured |
| Temperature > 65°C | Overheating | Check fan operation, ambient temp, ventilation |
| "Illegal data address" errors | Register not supported on this firmware | Expected for optional registers, not an issue if tools handle gracefully |
