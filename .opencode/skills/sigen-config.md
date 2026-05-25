# sigen-config — Safe Configuration Changes

Guided workflow for making configuration changes to the Sigenergy ESS system. Always validates inputs before writing and confirms with the user before making changes.

## When to Use

Use this skill when the user asks to:
- "Change the EMS mode"
- "Set charge/discharge limits"
- "Write a register"
- "Change the inverter configuration"

## Prerequisites

- `sigen-mcp` MCP server must be connected
- User must explicitly confirm the change before any write is executed
- Know the current inverter state before making changes (read it first)

## Safety Rules (ALWAYS FOLLOW)

1. **Read before write**: Always call the corresponding read tool first to show the user the current value.
2. **Confirm with user**: Present the proposed change and ask for explicit confirmation before executing.
3. **Validate ranges**: Never write values outside documented safe ranges.
4. **Log changes**: Include what changed in the response.

## Procedure

### EMS Mode Change

**Register**: 40031 (slave 247, holding)

**Valid modes** (from `REMOTE_EMS_MODES` in registry.ts):

| Value | Mode | Description |
|-------|------|-------------|
| 0 | MaxSelfConsumption | Self-consumption priority |
| 1 | AI | Cloud-optimized |
| 2 | TOU | Time-of-use schedule |
| 3 | Manual | Manual control |
| 4 | Off-Grid | Force islanding |
| 5 | FullFeedIn | All PV to grid |
| 6 | Backup | Battery backup reserve |
| 7 | Economy | Grid-tied savings mode |
| 8 | Emergency | Emergency power mode |
| 9 | Custom | User-defined parameters |

**Workflow**:

1. Call `read_ems_mode()` to show current mode
2. Present the current and proposed mode to the user
3. Call `set_ems_mode({ mode: <number> })` only after explicit confirmation

### Charge/Discharge Limit Change

**Registers**:
- Max charging: 40032 (slave 247, holding) — in kW
- Max discharging: 40034 (slave 247, holding) — in kW

**Valid range**: 0 to the inverter's rated power (typically 5–15 kW depending on model)

**Workflow**:

1. Call `read_plant()` — note the current active power flow and battery SOC
2. Check: if battery SOC is very low (< 10%), warn the user before setting a discharge limit
3. Present the proposed limit to the user
4. Call `set_charge_limit({ kw: <value> })` or `set_discharge_limit({ kw: <value> })` only after confirmation

**Validation rules**:
- Must be >= 0 kW
- Should not exceed the inverter's rated power (check nameplate or documentation)
- Setting to 0 kW blocks that direction entirely
- Discharge limit during low battery can cause system instability

### Direct Register Write

For advanced users who know exactly what they're writing:

**WARNING**: Direct register writes can:
- Change system behavior unexpectedly
- Invalidate warranties
- Cause equipment damage if incorrect values are written

**Workflow**:

1. Read the current register value first: `read_registers({ address, slave })`
2. Confirm the user understands the risk
3. Execute only after explicit confirmation: `write_register({ address, value, slave })`

## General Precautions

| Situation | Action |
|-----------|--------|
| User wants to set EMS mode during off-grid | Warm: mode change while off-grid may not take effect until grid returns |
| User sets charge limit higher than inverter rating | Reject — clamp to rated max |
| User sets discharge limit above available battery power | Accept but note: actual discharge will be limited by battery BMS |
| User asks to write registers they don't understand | Push back — ask them to explain what they're trying to achieve |
