# sigen-mcp

Monorepo for [Sigenergy ESS](https://www.sigenergy.com) MCP (Model Context Protocol) servers.

## Packages

| Package | Description | CLI |
|---------|-------------|-----|
| [`packages/modbus-mcp`](./packages/modbus-mcp/) | Modbus TCP — read registers, EMS mode, alarms, power flow | `sigen-modbus-mcp --host <ip>` |
| [`packages/api-mcp`](./packages/api-mcp/) | SigenCloud API — station info, energy flow, history, alarms | `sigen-api-mcp --cloud-user <email> --cloud-pass <pass>` |
| [`packages/sigen-docs-mcp`](./packages/sigen-docs-mcp/) | Sigenergy doc query — operational modes, battery/grid/solar settings | `sigen-docs-mcp` |

## Setup

```bash
npm install
npm run build
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
