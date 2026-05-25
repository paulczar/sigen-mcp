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

```bash
# Just add the config below to your MCP client — no install needed

# Or if you want to clone and develop locally:
# git clone https://github.com/paulczar/sigen-mcp
# npm install
# npm run build
```

## MCP Configuration

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
| [`sigen-config-optimizer`](./skills/sigen-config-optimizer/SKILL.md) | "optimize my settings", "create a custom mode", "design a TOU schedule" | Full configuration design with system snapshot, rate plan, and seasonal profiles |

### Claude Code

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

### Other agents

- **OpenCode** — load via `skill(name="sigen-status")` (built-in support)
- **Claude Code (Cursor, Windsurf, etc.)** — reference `skills/<name>/SKILL.md` in your project's `.claude/` instructions or agent config
- **Generic AI agents** — include the SKILL.md content in your system prompt

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
