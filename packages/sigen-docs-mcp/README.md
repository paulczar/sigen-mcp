# @paulczar/sigen-docs-mcp

MCP server for querying the official Sigenergy mySigen App documentation via GitBook's AI Answers API. No credentials required.

Ask natural-language questions about operational modes, battery settings, solar configuration, grid settings (peak shaving, tariff plans), EV charging, and any other system parameters covered in the official docs.

## Usage

```bash
npx -y @paulczar/sigen-docs-mcp
```

No arguments needed.

### MCP client config

```json
{
  "mcpServers": {
    "sigen-docs-mcp": {
      "command": "npx",
      "args": ["-y", "@paulczar/sigen-docs-mcp"]
    }
  }
}
```

## Tools

### `query_sigen_docs`

Ask a natural-language question about Sigenergy system configuration.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `question` | string | — | Natural language question (be specific about your scenario) |
| `scope` | string | `"user"` | Which manual to query. `"user"` for daily operation, `"installer"` for device parameter setup |

**Example questions:**
- "How do I set up peak shaving with my TOU rate plan?"
- "What parameters are available in Battery Automation?"
- "I have peak rates from 4–9pm and off-peak overnight, how should I configure my battery?"
- "What's the difference between MaxSelfConsumption and TOU mode?"
- "How do I set up a Catch Solar Relay for hot water diversion?"

The API returns an AI-synthesized answer with source references from the official Sigenergy documentation hosted at [sigenergy.gitbook.io](https://sigenergy.gitbook.io/sige-doc-en).

## Scope

### User scope (`scope: "user"`)
Queries the mySigen App user manual — covers daily operation settings, energy management, operational modes, battery automations, and system configuration.

### Installer scope (`scope: "installer"`)
Queries the installer manual — covers device parameter setup, grid code configuration, commissioning parameters, and advanced technical settings.

## License

MIT
