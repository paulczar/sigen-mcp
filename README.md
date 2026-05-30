# sigen-mcp

Monorepo for [Sigenergy ESS](https://www.sigenergy.com) MCP (Model Context Protocol) servers.

## Packages

All packages are published to npm — no clone or build needed for end users.

| Package | Description | npx |
|---------|-------------|-----|
| [`@paulczar/sigen-modbus-mcp`](./packages/modbus-mcp/) | Modbus TCP — read registers, EMS mode, alarms, power flow | `npx -y @paulczar/sigen-modbus-mcp --host <ip>` |
| [`@paulczar/sigen-api-mcp`](./packages/api-mcp/) | SigenCloud API — station info, energy flow, history, alarms | `npx -y @paulczar/sigen-api-mcp --cloud-user <email> --cloud-pass <pass>` |
| [`@paulczar/sigen-docs-mcp`](./packages/sigen-docs-mcp/) | Sigenergy doc query — operational modes, battery/grid/solar settings | `npx -y @paulczar/sigen-docs-mcp` |

## Quick start

### Claude Code (easiest — one command)

```bash
/plugin install paulczar/sigen-mcp
```

This auto-loads all 6 companion skills and configures the three MCP servers. After install, fill in your Modbus host IP and cloud credentials:

```
/plugin config sigen-mcp-skills
```

Skills are namespaced as `/sigen-mcp-skills:sigen-status`, `/sigen-mcp-skills:sigen-config`, etc. Run `/help` to see them listed.

### Any MCP client (Claude Desktop, Cursor, OpenCode, etc.)

Add one or more servers to your MCP client config:

```json
{
  "mcpServers": {
    "sigen-modbus-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-modbus-mcp", "--host", "192.168.86.207"]
    },
    "sigen-api-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-api-mcp", "--cloud-user", "email@example.com", "--cloud-pass", "your-password"]
    },
    "sigen-docs-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-docs-mcp"]
    }
  }
}
```

## Companion Skills

Higher-level workflows that use the MCP tools to provide monitoring, diagnostics, configuration, documentation lookup, and optimization for Sigenergy ESS systems.

| Skill | Triggers | What It Does |
|-------|----------|-------------|
| [`sigen-status`](./skills/sigen-status/SKILL.md) | "system status", "dashboard", "overview" | Reads plant + inverter + energy + alarms and synthesizes a formatted dashboard |
| [`sigen-diagnose`](./skills/sigen-diagnose/SKILL.md) | "something's wrong", "alarm", "troubleshoot" | Step-by-step diagnostic: state → alarms → power flow → battery → trends |
| [`sigen-config`](./skills/sigen-config/SKILL.md) | "change EMS mode", "set charge limit", "configure" | Safe configuration with pre-read validation and user confirmation |
| [`sigen-docs`](./skills/sigen-docs/SKILL.md) | "how do I configure", "what does this setting do" | Queries Sigenergy mySigen App docs via MCP or direct GitBook API |
| [`sigen-config-optimizer`](./skills/sigen-config-optimizer/SKILL.md) ⚠️ | "optimize my settings", "create a custom mode", "design a TOU schedule" | Full configuration design with system snapshot, rate plan, and seasonal profiles — **experimental, needs tuning** |

## Example Output

Examples below generated from a live 13.25 kW / 40.3 kWh Sigenergy ESS in Brisbane, Australia (SigenStor EC 10.0 SP AU).

### System Dashboard (`sigen-status` via Modbus TCP)

```
## System Status — 26/05/2026, 10:35:52 am

**State**: Custom | On Grid | Running
**Health**: ✅ No active alarms

### Power Flow
- **PV**: 2.873 kW
- **Battery**: 0.978 kW (2.4% SOC / 100.0% SOH)
- **Grid**: Exporting 0.020 kW
- **Load**: 1.855 kW
- **Plant Active**: 1.875 kW

### Energy (Lifetime)
- **PV Generated**: 5,828.9 kWh
- **Grid Imported**: 2,851.7 kWh
- **Grid Exported**: 1,515.5 kWh
- **Battery Charged**: 4,222.7 kWh
- **Battery Discharged**: 4,118.6 kWh
- **EV DC Charging**: 1,205.3 kWh

### Inverter
- **Active Power**: 1.875 kW
- **Grid Frequency**: 50.02 Hz
- **Internal Temp**: 49.4°C
- **Battery SOC**: 2.4% / SOH: 100.0%
- **PV Power**: 2.873 kW
```

See [`packages/modbus-mcp/`](./packages/modbus-mcp/) for all available tools.

### Documentation Query (`sigen-docs` via GitBook AI Answers)

**Question:** I have a Catch Solar Relay for hot water. How can I set up my Sigenergy system so excess solar after the battery is full triggers the relay, while prioritizing self-consumption during peak rates 4–11pm? What EMS mode and settings should I use?

**Answer:**

Use **Time-based Control Mode** for the battery, and configure the Catch Solar Relay as a **Smart load**.

* Set **Operational mode → Time-based Control Mode**.
* Create a **Self-Consumption** period for **4:00 pm–11:00 pm**.
  During that period, PV serves the loads first. Excess PV charges the battery. The battery can also discharge to loads.
* Leave other periods unspecified if you want PV to **prioritize home loads**, then charge the battery, with **no battery discharge** outside your scheduled window.
* In **Battery Settings**, set **Charge Cut-off SOC** to your full target.

For the relay:
* Add the Catch Solar Relay under **Smart load**.
* Set **Control Mode → Auto (Time-based) → Surplus PV Only**.
* Set **Starting Power** and **Rated Power** in **Smart Load Settings → Operation Settings**.

If you also want to limit grid import during peak hours, add **Peak Shaving** in **Grid Settings**.

## Claude Code

This repo ships a [Claude Code plugin](https://code.claude.com/docs/en/plugins) at `.claude-plugin/plugin.json` for loading all skills:

```bash
# Option 1 — Local session (clone the repo)
claude --plugin-dir /path/to/sigen-mcp

# Option 2 — Standalone skills (copy individual skills to your project)
mkdir -p .claude/skills
cp -r skills/* .claude/skills/

# Option 3 — Standalone global skills (available across all projects)
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/

# Option 4 — Marketplace install (from GitHub)
/plugin marketplace add paulczar/sigen-mcp
/plugin install sigen-mcp-skills@sigen-mcp
```

After installation, skills are namespaced as `/sigen-mcp-skills:sigen-status`, `/sigen-mcp-skills:sigen-config`, etc. Run `/help` to see them listed.

### OpenCode

OpenCode loads skills from `.opencode/skills/`. The repo ships OpenCode-compatible skills there already:

```bash
# Clone and they're auto-loaded
git clone https://github.com/paulczar/sigen-mcp.git
cd sigen-mcp

# Or copy skills to your project
cp -r .opencode/skills/* /your/project/.opencode/skills/
```

Then use `skill(name="sigen-status")` to load a skill at runtime.

### Other agents (Cursor, Windsurf, etc.)

Reference `skills/<name>/SKILL.md` in your project's agent config or include the content in your system prompt.

## References

- [packages/modbus-mcp/](./packages/modbus-mcp/) — Modbus TCP server with register definitions, tools, and troubleshooting
- [packages/api-mcp/](./packages/api-mcp/) — SigenCloud API server
- [packages/sigen-docs-mcp/](./packages/sigen-docs-mcp/) — GitBook doc query MCP server
- [docs/sigencloud-api.md](./docs/sigencloud-api.md) — SigenCloud developer access guide
- [references/](./references/) — Local reference documentation and PDFs
- [Sigenergy-Local-Modbus (HACS)](https://github.com/TypQxQ/Sigenergy-Local-Modbus) — Community register definitions
- [Sigenergy Modbus Protocol PDF (V2.8)](https://raw.githubusercontent.com/TypQxQ/Sigenergy-Local-Modbus/v.1.2.0/Modbus_reference_documentation/Modbus%20Protocol%20EN%20-%20SIGEN%20(1)/Modbus_Protocol_EN_2.8-SIGEN.pdf) — Official Modbus register documentation

## License

MIT
