---
name: sigen-docs
description: |
  Query Sigenergy mySigen App documentation. Use when the user asks about configuring operational modes, solar/battery/grid settings, creating custom modes, peak shaving, tariff plans, or any other system configuration questions. Also use proactively when planning a configuration guide — consult the docs first to verify parameter names, valid ranges, and constraints before recommending settings.
---

# sigen-docs — Sigenergy Documentation Query

Query the official Sigenergy mySigen App documentation for configuration guidance. Uses the GitBook AI Answers API which searches the docs and returns synthesized answers with source references.

## Usage

### Preferred: via sigen-docs-mcp tool

If the `sigen-docs-mcp` MCP server is configured, use the `query_sigen_docs` tool directly:

```
query_sigen_docs(question: string, scope?: "user" | "installer")
```

- `question` — natural language question about system configuration (be specific)
- `scope` — `"user"` (default) for daily operation settings, `"installer"` for device parameter/comissioning

### Fallback: direct HTTP query

If the MCP is not available, send an HTTP GET to the GitBook ask API:

```http
GET https://sigenergy.gitbook.io/sige-doc-en/mysigen-app-user-manual/dian-zhan-can-shu-she-zhi/energy-management-settings/energy-storage-working-mode.md?ask=<question>
```

For installer docs:
```http
GET https://sigenergy.gitbook.io/sige-doc-en/mysigen-app-installer-manual/device-parameter-setup/sigenstor/operational-parameters.md?ask=<question>
```

The response is AI-synthesized with source links. If it returns HTML, strip tags.

### Response format

The API returns a markdown answer with source references at the bottom:

```
# Question...

Answer text with parameter details...

# Sources:

- [Page Title](url)
- [Page Title](url)
```

## When to use

- User asks about a setting they see in the app ("what does Solar Producing Priority do?")
- User wants a configuration guide based on their rate plan and goals
- User wants to understand the difference between modes, battery automation, peak shaving, etc.
- Before recommending specific settings, query the docs to verify parameter names, constraints, and valid values

## Topics covered

| Topic | Key pages |
|-------|-----------|
| Operational modes | Time-based Control, Custom Mode, AI Mode, Self-Consumption, VPP, Load Shedding |
| Solar settings | Producing priority, power limit |
| Battery settings | Charging source priority, discharge priority, level SOC, preheating, power limit, automation |
| Grid settings | Export priority, import/export limits, peak shaving, tariff plans, grid automation |
| Backup settings | Backup reserve SOC |
| EV charging | AC/DC charger settings, TOU scheduling, Ready By Time |
