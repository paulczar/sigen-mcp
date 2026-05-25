# @paulczar/sigen-modbus-mcp

MCP server for reading and writing Sigenergy ESS inverter registers via Modbus TCP. Local-only, no cloud dependency.

## Prerequisites

- LAN access to your Sigenergy inverter gateway (port 502)
- The gateway must have Modbus TCP enabled (enabled by default)

## Usage

```bash
# Direct CLI
npx -y @paulczar/sigen-modbus-mcp --host 192.168.x.x

# With custom port
npx -y @paulczar/sigen-modbus-mcp --host 192.168.x.x --port 502
```

### MCP client config

```json
{
  "mcpServers": {
    "sigen-modbus-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-modbus-mcp", "--host", "192.168.86.207"]
    }
  }
}
```

## Tools

### Read tools

| Tool | Description |
|------|-------------|
| `read_plant` | Plant-level overview: EMS mode, grid status, SOC, power flow, running state, alarms |
| `read_plant_energy` | Accumulated energy counters: PV, grid import/export, battery charge/discharge, EV charger |
| `read_inverter_detail` | Inverter-level details: PV strings (1–36), AC/DC charging, phase power, running state |
| `read_ems_mode` | Current EMS operational mode (MaxSelfConsumption, TOU, AI, FullFeedIn, etc.) |
| `read_grid_status` | Grid connection status (OnGrid, OffGrid auto/manual) |
| `read_battery_status` | Battery SOC, SOH, charge/discharge power, temperature |
| `read_pv_power` | Total PV generation power |
| `read_ev_status` | EV DC charger status, power, SOC (if DC charger present) |
| `read_ac_charger` | EV AC charger state, power, energy, alarms (if AC charger present) |
| `read_alarms` | All active alarms decoded from bitfield registers (PCS, ESS, Gateway, DC/AC charger) |
| `read_registers` | Raw register read by address or range |

### Write tools

| Tool | Description |
|------|-------------|
| `set_ems_mode` | Set EMS mode (MaxSelfConsumption, TOU, AI, FullFeedIn, etc.) |
| `set_charge_limit` | Set battery charge power limit |
| `set_discharge_limit` | Set battery discharge power limit |
| `write_register` | Write any single Modbus holding register by address |

## Features

- 300+ register definitions with gain values, data types, and slave IDs
- 32-bit and 64-bit register reads for power and energy values
- Alarm decoding from bitfield registers using Sigenergy protocol maps
- Enum lookups for EMS modes, grid status, running states, charger states
- Parallel register reads via `Promise.all()` for multi-value tools
- Graceful handling of optional peripherals (EV chargers, etc.)

## Register reference

Generated register documentation lives at `docs/registers.md` in the monorepo. Build it locally:

```bash
npm run docs -w packages/modbus-mcp
```

## Protocol documentation

Official Modbus protocol PDFs covering V2.7 and V2.8 are in the [references/](../../references/) directory.

## License

MIT
