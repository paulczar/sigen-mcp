# sigen-mcp

MCP (Model Context Protocol) server for **Sigenergy ESS** inverters over Modbus TCP. Provides direct register access and convenience tools for monitoring and controlling your inverter — no Home Assistant dependency.

## Setup

```bash
git clone <your-repo-url>
cd sigen-mcp
npm install
npm run build

# Run (specify your inverter IP)
npx sigen-mcp --host 192.168.86.207 --port 502
```

### CLI Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--host` | (required) | Inverter IP address |
| `--port` | `502` | Modbus TCP port |

## MCP Configuration

Add to your MCP client config (e.g. `claude_desktop_config.json`, `~/.hermes/config.yaml`):

```json
{
  "mcpServers": {
    "sigen-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-mcp", "--host", "192.168.86.207"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `read_registers(address, count, slave)` | Read raw registers (auto-detects input vs holding) |
| `read_ems_mode()` | Read & decode EMS operating mode (register 30003) |
| `read_grid_status()` | Read grid connection status (register 30004) |
| `read_battery_status()` | Read battery SOC and SOH |
| `read_pv_power()` | Read PV generation from individual string V/I readings |
| `read_ev_status()` | Read DC charger status, vehicle SOC, and charging metrics |
| `read_plant()` | Comprehensive plant-level status: EMS mode, power flow, battery, running state |
| `read_plant_energy()` | Accumulated energy counters: PV gen, grid import/export, battery, EV |
| `read_inverter_detail()` | Inverter-level state: phase power, temp, frequency, battery, PV |
| `read_ac_charger()` | AC EV charger status: system state, power, energy, alarms |
| `read_alarms()` | Decode all active alarms across PCS, ESS, gateway, charger |
| `write_register(address, value, slave)` | Write a single holding register |
| `set_ems_mode(mode)` | Set EMS operating mode (register 40031) |
| `set_charge_limit(kw)` | Set max charging limit (register 40032) |
| `set_discharge_limit(kw)` | Set max discharging limit (register 40034) |

## Register Definitions

All ~180 register definitions are in [`src/constants/registry.ts`](src/constants/registry.ts) — addresses, types, gain factors, slave IDs, and applicable models. Key groups:

| Section | Address Range | Slave | Count |
|---------|--------------|-------|-------|
| Plant input | 30000–30284 | 247 | ~85 (EMS, power, battery, energy, alarms, smart loads) |
| Plant holding | 40000–40068 | 247 | ~35 (setpoints, limits, grid code, EMS control) |
| Inverter input | 30500–31511 | 1 | ~95 (nameplate, state, phase power, PV strings 1–36, ESS) |
| Inverter holding | 40500–41000 | 1 | 2 (start/stop, DC charger control) |
| AC Charger input | 32000–32014 | 1 | ~10 (state, power, energy, alarms) |
| AC Charger holding | 42000–42001 | 1 | 2 (start/stop, output current) |

### Data Types & Gains

Raw register value × gain = real value. Gains defined per-register in `registry.ts`:

| Data Type | Gain | Applies To |
|-----------|------|------------|
| `U16`/`S16` | — | status enums, counts |
| `U16`/`S16` | ×10 | voltage (V), SOC/SOH (%), temperature (°C) |
| `U16`/`S16` | ×100 | frequency (Hz), percentage (%), current (A) |
| `U16`/`S16` | ×1000 | insulation (MΩ), power factor |
| `U32`/`S32` | ×1000 | power (kW), apparent power (kVA/kvar) |
| `U32`/`S32` | ×100 | energy (kWh), capacity (kWh), voltage (V) |
| `U64` | ×100 | accumulated energy (kWh) |

### Enum Maps

All enum maps (EMS modes, grid statuses, running states, output types, alarm codes per appendix) are exported from `src/constants/registry.ts` and decoded by the tools. See the file for the complete set.

## Architecture

The server communicates over **stdio** using the standard MCP protocol. It connects directly to the Sigenergy ESS inverter via Modbus TCP, bypassing any intermediate system like Home Assistant.

Register addresses and slave IDs are documented in the Sigenergy Modbus Protocol (v2.8) PDF (see [`references/`](references/)) and the [Sigenergy-Local-Modbus](https://github.com/TypQxQ/Sigenergy-Local-Modbus) HACS integration.

## Troubleshooting

- **Connection refused**: Verify the inverter IP and that Modbus TCP is enabled on the device
- **"Illegal data address"**: The register may not be supported by your firmware version. Try a different address or check the PDF for your specific firmware
- **Slave IDs**: Plant registers use slave 247, inverter/charger registers use slave 1 by default

## References

- [references/](./references/) — Local reference documentation and PDFs
- [Sigenergy-Local-Modbus (HACS)](https://github.com/TypQxQ/Sigenergy-Local-Modbus) — HACS integration this project draws register definitions from
- [Sigenergy Modbus Protocol PDF (V2.8)](https://raw.githubusercontent.com/TypQxQ/Sigenergy-Local-Modbus/v.1.2.0/Modbus_reference_documentation/Modbus%20Protocol%20EN%20-%20SIGEN%20(1)/Modbus_Protocol_EN_2.8-SIGEN.pdf) — Latest official Modbus register documentation

## License

MIT
