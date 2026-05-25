# @paulczar/sigen-api-mcp

MCP server for the SigenCloud API — read station data, energy flow, alarms, operational modes, and smart loads from your Sigenergy ESS system via the cloud.

## Prerequisites

- A SigenCloud account (the same one you use with the mySigen app)
- A developer app registration — see [docs/sigencloud-api.md](../../docs/sigencloud-api.md) for setup instructions (free, just email Sigenergy)

## Usage

### Basic usage

```bash
# Password auth (required for all tools)
npx -y @paulczar/sigen-api-mcp --cloud-user email@example.com --cloud-pass your-password

# Optional region (defaults to aus)
npx -y @paulczar/sigen-api-mcp --cloud-user email@example.com --cloud-pass your-password --cloud-region eur

# With AppKey/AppSecret (enables cloud_history tool)
npx -y @paulczar/sigen-api-mcp --cloud-user email@example.com --cloud-pass your-password --app-key YOUR_APP_KEY --app-secret YOUR_APP_SECRET
```

### Environment variables

All arguments can also be set in a `.env` file:

```
SIGEN_USERNAME=email@example.com
SIGEN_PASSWORD=your-password
SIGEN_REGION=aus
SIGEN_APP_KEY=your_app_key_here
SIGEN_APP_SECRET=your_app_secret_here
```

Then run with no args:

```bash
npx -y @paulczar/sigen-api-mcp
```

CLI args take precedence over env vars. The AppKey/AppSecret are optional — if omitted, `cloud_history` will try password-based Northbound auth as a fallback.

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

Two separate auth systems are used depending on the endpoint:

| Auth | Endpoints | Method |
|------|-----------|--------|
| **SigenCloud API** (user) | Most read tools | OAuth2 password grant with AES-encrypted password |
| **Northbound API** (developer) | `cloud_history` | AppKey:AppSecret via `/openapi/auth/login/key`, or password fallback |

For the SigenCloud API, your password is encrypted client-side using the app secret before being sent over HTTPS. Credentials are never stored — they're held in memory for the session lifetime.

For the Northbound API, provide an AppKey and AppSecret (from your developer app registration). If omitted but `cloud_history` is called, it falls back to password-based Northbound auth using your SigenCloud credentials. See [docs/sigencloud-api.md](../../docs/sigencloud-api.md) for developer app setup instructions.

## License

MIT
