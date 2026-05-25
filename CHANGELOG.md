# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **sigen-docs-mcp** — new `@paulczar/sigen-docs-mcp` package with `query_sigen_docs` tool
  - Wraps Sigenergy's GitBook AI Answers API for natural-language doc queries
  - Covers operational modes, solar/battery/grid settings, EV charging, peak shaving
  - No credentials required
- **sigen-docs** skill — companion `skills/sigen-docs/SKILL.md` with MCP + fallback instructions
- **sigen-config-optimizer** skill — `skills/sigen-config-optimizer/SKILL.md` for designing optimal operational modes
  - Gathers live system state, rate plan, devices, and goals
  - Researches device specs (EV battery sizes, pool pump power, etc.)
  - Queries official docs for parameter constraints
  - Produces a comprehensive savable markdown report with device inventory, seasonal configurations, and step-by-step setup guide
  - Includes refinement log for iterative adjustments over time

### Changed

- README updated with all three MCP packages
- AGENTS.md updated with sigen-docs and sigen-config-optimizer skills

## [0.1.0] - 2026-05-25

### Added

- **Monorepo restructuring** — npm workspaces with `packages/modbus-mcp` and `packages/api-mcp`
- **`@paulczar/sigen-modbus-mcp`** — Modbus TCP MCP server (15 tools)
  - Plant-wide reads: EMS mode, grid status, power flow, battery SOC/SOH, alarms
  - Inverter detail: PV strings, AC/DC charging, phase power, running state
  - Accumulated energy counters (PV, grid import/export, battery, EV)
  - Write tools: set EMS mode, charge/discharge limits, write register
  - Register definitions with gain, data type, slave ID, and enum maps
  - Alarm decoding via bitfield maps (PCS, ESS, Gateway, DC/AC charger)
  - Grid code config registers (40000–40068)
- **`@paulczar/sigen-api-mcp`** — SigenCloud API MCP server (7 tools)
  - OAuth2 + AES password encryption via `SigenCloudClient`
  - Station info, energy flow, alarm list, operational modes (list/current/set), smart loads
  - History endpoint identified but blocked (requires Northbound API AppKey)
- **Agent companion skills** (`skills/` directory)
  - `sigen-status` — one-shot system dashboard (read_plant + inverter + energy + alarms)
  - `sigen-diagnose` — step-by-step diagnostic workflow for alarms/power issues
  - `sigen-config` — safe configuration workflow with read-before-write
- **Developer documentation**
  - `docs/sigencloud-api.md` — SigenCloud developer access guide
  - `docs/registers.md` — auto-generated Modbus register reference
  - `AGENTS.md` — monorepo structure, patterns, conventions, anti-patterns
  - `README.md` — setup, MCP configuration, references
  - `.env.example` — template with placeholders
- **Reference documentation**
  - Modbus protocol PDFs V1.7, V2.7, V2.8
  - Cloned `Bankilo/sigen-api` Python SDK at `/tmp/sigen-api-ref/`
- **CI** — GitHub Actions test workflow
- **Integration tests** — 22 tests for register reads, writes, and error handling
- **Register validation** — validates all 306 register definitions against spec

### Fixed

- S16 register value rendering (negative values for power, temperature)
- V2.8 API field naming alignment
- Modbus connection corruption handling
- Error message formatting consistency across all tools
- Input validation for write tools (range checks, type coercion)
