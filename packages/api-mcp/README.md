# @paulczar/sigen-api-mcp

MCP server for the SigenCloud API — read station data, energy flow, alarms, operational modes, and smart loads from your Sigenergy ESS system via the cloud.

## Prerequisites

- A SigenCloud account (the same one you use with the mySigen app)
- A developer app registration — see [docs/sigencloud-api.md](../../docs/sigencloud-api.md) for setup instructions (free, just email Sigenergy)

## Usage

### CLI arguments

```bash
npx -y @paulczar/sigen-api-mcp --cloud-user email@example.com --cloud-pass your-password
```

Optional region (defaults to `aus`):

```bash
npx -y @paulczar/sigen-api-mcp --cloud-user email@example.com --cloud-pass your-password --cloud-region eur
```

### Environment variables

All CLI arguments can also be set in a `.env` file for convenience:

```
SIGEN_USERNAME=email@example.com
SIGEN_PASSWORD=your-password
SIGEN_REGION=aus
```

Then run without args:

```bash
npx -y @paulczar/sigen-api-mcp
```

CLI args take precedence over env vars.

### MCP client config

```json
{
  "mcpServers": {
    "sigen-api-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-api-mcp", "--cloud-user", "email@example.com", "--cloud-pass", "your-password"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `cloud_station_info` | Station details: PV/battery capacity, serial numbers, on-grid status, location |
| `cloud_energy_flow` | Real-time energy flow: PV production, load, battery charge/discharge, grid import/export |
| `cloud_operational_modes` | List available EMS modes and their descriptions |
| `cloud_current_mode` | Current active EMS mode with parameters |
| `cloud_history` | Historical energy data (requires Northbound API AppKey/AppSecret) |
| `cloud_smart_loads` | Smart load / diversion device status |
| `cloud_alarms` | Alarm list with severity, type, and timestamp |

## Authentication

The server uses OAuth2 password grant with AES-encrypted credentials. Your password is encrypted client-side using the SigenCloud app secret before being sent over HTTPS. Credentials are never stored — they're held in memory for the session lifetime.

## License

MIT
