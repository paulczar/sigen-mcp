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
====================================================
  SigenStor EC 10.0 SP AU     Sun 31 May 09:00
====================================================
  Custom  |  On Grid  |  Running  |  No alarms
----------------------------------------------------
  6.05 kW PV
    |
    +-- Load   4.04 kW
    +-- Bat up 2.04 kW  (SOC 3.0%, SOH 100%)
    +-- Grid   0.03 kW  (buying)
----------------------------------------------------
  Battery:  3.0% SOC  |  100% SOH  |  49.2C
  Grid:     50.02 Hz  |  241.2 V   |  PF 0.994
----------------------------------------------------
  Lifetime:
    PV Generated    5,952 kWh
    Grid Import     3,055 kWh
    Grid Export     1,559 kWh
    Bat Cycle       4,408 / 4,298 kWh
    EV DC Charged   1,238 kWh
====================================================
```

*Generated from a live 13.25 kW / 40.3 kWh system in Brisbane — battery slowly recovering from overnight drain.*

See [`packages/modbus-mcp/`](./packages/modbus-mcp/) for all available tools.

### Documentation Query (`sigen-docs` via GitBook AI Answers)

**Question:** How do I set up Time-based Control mode to charge the battery during solar hours and discharge during peak evening rates?

**Answer:**

Set **Operational mode → Time-based Control Mode** first. Then create two schedules:

1. **Solar hours** — set a **Charging** or **Self-Consumption** period so PV can feed loads and charge the battery. If needed, set **Charging Source Priority** to **PV before Grid**.
2. **Peak evening** — set a **Discharging** period with **Maximum discharging power for BAT**, **Maximum power for exporting to grid**, and **Discharge Cut-off SOC from BAT to Grid**.

Any hours you don't specify run in standby-like behavior: PV powers the load first, excess PV charges the battery, and the battery does **not** discharge.

Time-based control is designed for areas with peak and valley electricity prices and large price gaps.

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
