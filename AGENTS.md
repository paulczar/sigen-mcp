# AGENTS.md — sigen-mcp

Monorepo for Sigenergy ESS MCP servers:

- **`packages/modbus-mcp/`** — Modbus TCP server (register reads, EMS control, alarms)
- **`packages/api-mcp/`** — SigenCloud API server (cloud station info, energy flow, history)
- **`packages/sigen-docs-mcp/`** — GitBook doc query server (operational modes, battery/solar/grid settings, EV charging)

## Structure

```
packages/
├── modbus-mcp/
│   ├── src/
│   │   ├── index.ts              # Modbus MCP server: setup, tools, handlers
│   │   └── constants/
│   │       └── registry.ts       # Register addresses, enum maps
│   ├── package.json              # @paulczar/sigen-modbus-mcp
│   └── tsconfig.json
└── api-mcp/
    ├── src/
    │   ├── index.ts              # Cloud API MCP server: setup, tools, handlers
    │   └── cloud/
    │       ├── client.ts         # SigenCloudClient (OAuth2, AES encrypt, endpoints)
    │       └── types.ts          # Cloud API response type interfaces
    ├── package.json              # @paulczar/sigen-api-mcp
    └── tsconfig.json
└── sigen-docs-mcp/
    ├── src/
    │   └── index.ts              # GitBook doc query MCP server: query_sigen_docs tool
    ├── package.json              # @paulczar/sigen-docs-mcp
    └── tsconfig.json
docs/
├── sigencloud-api.md            # Developer access guide
└── registers.md                 # Auto-generated Modbus register docs
skills/                          # Companion skills (sigen-status, diagnose, config, docs)
references/                      # PDFs and reference docs
```

## Core Patterns

### Adding a new tool
1. Add register address + metadata to `registry.ts` (with gain, slave ID, type comment, dataType, count)
2. Add tool schema to `ListToolsRequestSchema` handler (line ~158)
3. Add `case "tool_name":` to `CallToolRequestSchema` handler (line ~245)
4. Use `readRegister()` for 16-bit, `readRegister32()` for 32-bit (S32/U32), `readRegister64()` for 64-bit (U64)
5. Use `decodeAlarms()` for alarm bitfield registers
6. Use `Promise.all()` for parallel register reads (see `read_plant`, `read_plant_energy`)
7. Wrap unknown-register reads with `.catch(() => 0)` for optional peripherals (EVAC, etc.)
8. Return `{ content: [{ type: "text", text: "..." }] }`

### Register addressing
| Range | Type | Helper |
|-------|------|--------|
| 30001–39999 | input | `regType()` → `"input"` |
| 40001–49999 | holding | `regType()` → `"holding"` |
| 32-bit | two consecutive | `readRegister32()` |
| 64-bit | four consecutive | `readRegister64()` |

### Slave IDs
- **247** — Plant-level registers (EMS mode, battery, grid, alarms, energy counters)
- **1** — Inverter-level (PV strings, DC charger, AC charger, inverter state)
- **0** — Plant broadcast address (write-only, no reply)

### Data Types & Gains
Raw register × gain = real value. Gains in `registry.ts` `RegisterDef.gain`:

| Data Type | Gain | Applies To |
|-----------|------|------------|
| `U16`/`S16` | — | status enums, counts |
| `U16`/`S16` | ×10 | voltage (V), SOC/SOH (%), temperature (°C) |
| `U16`/`S16` | ×100 | frequency (Hz), percentage (%), current (A) |
| `U16`/`S16` | ×1000 | insulation (MΩ), power factor |
| `U32`/`S32` | ×1000 | power (kW), apparent power (kVA/kvar) |
| `U32`/`S32` | ×100 | energy (kWh), capacity (kWh), voltage (V) |
| `U64` | ×100 | accumulated energy (kWh) |

### Register Sections
| Key Prefix | Address Range | Slave | Content |
|-----------|---------------|-------|---------|
| `PLANT_*` | 30000–30284 | 247 | EMS, grid, power flow, battery, alarms, energy, smart loads |
| `PLANT_*` | 40000–40068 | 247 | Setpoints, limits, grid code config |
| `INVERTER_*` | 30500–31105 | 1 | Nameplate, state, phase power, PV strings 1–36, battery, grid |
| `DC_CHARGER_*` | 31500–31513 | 1 | EV DC charging metrics |
| `INVERTER_*` | 40500–41000 | 1 | Inverter start/stop, DC charger control |
| `AC_CHARGER_*` | 32000–32014 | 1 | EV AC charger state, power, energy, alarms |
| `AC_CHARGER_*` | 42000–42001 | 1 | AC charger control |

### Alarm Decoding
Alarm registers are bitfields. Use `decodeAlarms(registerValue, ALARM_CODE_MAP)` which returns an array of active alarm description strings. See `read_alarms` tool for usage.

### Enum Maps (import from `registry.ts`)
| Map | Values | Used By |
|-----|--------|---------|
| `EMS_MODES` | 0=MaxSelfConsumption, 1=AI, 2=TOU, 5=FullFeedIn, ... | `read_ems_mode`, `read_plant` |
| `GRID_STATUSES` | 0=OnGrid, 1=OffGrid(Auto), 2=OffGrid(Manual) | `read_grid_status`, `read_plant` |
| `RUNNING_STATES` | 0=Standby, 1=Running, 2=Fault, 3=Shutdown, 7=EnvAbnormality | `read_plant`, `read_inverter_detail` |
| `REMOTE_EMS_MODES` | Appendix 6 — remote control modes | write tools |
| `AC_CHARGER_STATES` | 0=Init through 7=Error (IEC61851-1) | `read_ac_charger` |
| `DC_CHARGER_STATUSES` | 0-6 (legacy) | `read_ev_status` |
| `DC_CHARGER_RUNNING_STATE_V28` | 0x00-0x0A (V2.8 new) | V2.8 DC charger tools |
| `OUTPUT_TYPES` | 0=L/N, 1=L1/L2/L3, 2=L1/L2/L3/N, 3=L1/L2/N | `read_inverter_detail` |
| `PCS_ALARM_CODES` | Appendix 2 — bitfield | `read_alarms` |
| `PCS_ALARM_CODES2` | Appendix 3 — bitfield | `read_alarms` |
| `ESS_ALARM_CODES` | Appendix 4 — bitfield | `read_alarms` |
| `GATEWAY_ALARM_CODES` | Appendix 5 — bitfield | `read_alarms` |
| `DC_CHARGER_ALARM_CODES` | Appendix 11 — bitfield | `read_alarms` |
| `PLANT_ALARM_CODES6` | Appendix 12 — bitfield | `read_alarms` |
| `PLANT_ALARM_CODES7` | Appendix 13 — bitfield | `read_alarms` |
| `AC_CHARGER_ALARM_CODES1/2/3` | Appendix 8/9/10 — bitfield | `read_ac_charger` |

## Conventions
- No `any` types — use proper casts
- ESM (`import`/`export`) throughout
- Functions > classes (no OOP wrappers)
- `console.error` for server logs (stdio is MCP transport)
- `Promise.all()` for parallel register reads (see `read_ev_status`)
- Keep `README.md` in sync when adding/removing packages, tools, or changing the CLI

## Anti-patterns
- Don't suppress Modbus errors — let `McpError` surface them
- Don't expose the raw `modbus-serial` client outside `index.ts`
- Don't add new dependencies without strong justification
- Don't use `.js` extensions in imports (TypeScript strict ESM convention — keep them)

## References

Reference PDFs are gitignored. Hydrate the folder after cloning:

```bash
# V2.8 — Latest (from HACS GitHub mirror)
curl -sLo references/Sigenergy_Modbus_Protocol_V2.8_20251128.pdf \
  "https://raw.githubusercontent.com/TypQxQ/Sigenergy-Local-Modbus/v.1.2.0/Modbus_reference_documentation/Modbus%20Protocol%20EN%20-%20SIGEN%20(1)/Modbus_Protocol_EN_2.8-SIGEN.pdf"

# V2.7 — Public on sigenergy.com (region-locked, may need browser User-Agent)
curl -sLO "https://www.sigenergy.com/uploads/us_download/1755488219226583.pdf"
mv 1755488219226583.pdf references/Sigenergy_Modbus_Protocol_V2.7_20250523.pdf
```

Check `references/README.md` for the full version table and download URLs. Update this section when new protocol versions are published.

## Commands
```bash
npm run build   # tsc → dist/
npm run docs    # generate docs/registers.md from registry.ts
npm install     # install deps
npx sigen-modbus-mcp --host 192.168.x.x   # run Modbus TCP server
npx sigen-api-mcp --cloud-user <email> --cloud-pass <pass>  # run cloud API server
npx sigen-docs-mcp                        # run GitBook doc query server (no args required)
```

## Release Process

When asked to "cut a release" or "bump version", the publish workflow (`publish.yml`) automatically publishes any package whose `package.json` version differs from the npm registry on push to main. This is a monorepo with independent versioning per package — only packages with actual changes should be bumped.

### Procedure

For each package (`packages/modbus-mcp/`, `packages/api-mcp/`, `packages/sigen-docs-mcp/`):

1. **Detect changes** — check if there are commits touching that package since its last tag:
   ```bash
   PACKAGE="packages/modbus-mcp"
   LAST_TAG=$(git tag --list '*modbus*' --sort=-version:refname | head -1)
   # or use the version from package.json to find the tag
   # VERSION=$(node -p "require('./$PACKAGE/package.json').version")
   # LAST_TAG=$(git tag --list "v$VERSION" | head -1 || git tag --list '*modbus*' --sort=-version:refname | head -1)
   LOG=$(git log "$LAST_TAG..HEAD" -- "$PACKAGE/" --oneline 2>/dev/null)
   ```
   If `$LOG` is non-empty, the package has unreleased changes.

2. **Bump version** — only for packages with unreleased changes. Use `npm version` to update `package.json`:
   ```bash
   npm version patch -w packages/modbus-mcp --no-git-tag-version
   ```
   Default to **patch** unless the changes warrant a minor or major bump. Do NOT use `--git-tag-version` — tags are created separately at the end.

3. **Update CHANGELOG.md** — add entries under `## [Unreleased]` for each bumped package. Follow the existing format (keepachangelog.com). If the `[Unreleased]` section already has entries, group the new ones under them.

4. **Commit and push** — commit the updated `package.json` files and `CHANGELOG.md` together:
   ```bash
   VERSION=$(node -p "require('./packages/modbus-mcp/package.json').version")
   git add packages/*/package.json CHANGELOG.md
   git commit -m "release @paulczar/sigen-modbus-mcp@$VERSION [skip ci]"
   git tag "v$VERSION"
   ```
   Use `[skip ci]` in the commit message to avoid triggering CI on the version bump commit itself. Create an annotated git tag for each bumped package. Push both commit and tags:
   ```bash
   git push && git push --tags
   ```

5. **Verify** — the `publish.yml` workflow will run on push, detect the version delta against npm, and publish only the bumped packages. No GitHub Release is needed.

### Example

```
$ npm version patch -w packages/api-mcp --no-git-tag-version
$ npm version patch -w packages/sigen-docs-mcp --no-git-tag-version
$ # edit CHANGELOG.md
$ git add packages/api-mcp/package.json packages/sigen-docs-mcp/package.json CHANGELOG.md
$ git commit -m "release @paulczar/sigen-api-mcp@0.1.2, @paulczar/sigen-docs-mcp@0.1.1 [skip ci]"
$ git tag v0.1.2 && git tag v0.1.1
$ git push && git push --tags
```

## Skills

Companion skills provide higher-level workflows on top of the MCP tools. Available in two formats:

### SKILL.md (cross-platform standard — AAIF/Linux Foundation)

Standard format compatible with Claude Code, Cursor, Codex, Copilot, VS Code, Windsurf, Roo Code, and 20+ other agents. Each skill is a directory with a `SKILL.md` containing YAML frontmatter:

```
skills/
├── sigen-status/             → "system status", "dashboard", "overview"
├── sigen-diagnose/           → "something's wrong", "alarm", "troubleshoot", "battery not charging"
├── sigen-config/             → "change EMS mode", "set charge limit", "configure"
├── sigen-docs/               → "how do I configure", "what does this setting do", "create a TOU plan"
└── sigen-config-optimizer/   → "optimize my settings", "create a custom mode", "design a TOU schedule"
```

### .opencode/skills (legacy — OpenCode native)

Legacy format for OpenCode backward compatibility in `.opencode/skills/sigen-*.md`.

### Skill Reference

| Name | Triggers | What It Does |
|---|---|---|
| `sigen-status` | "system status", "dashboard", "overview" | Calls `read_plant` + `read_inverter_detail` + `read_plant_energy` + `read_alarms` and synthesizes a formatted dashboard with interpretation |
| `sigen-diagnose` | "something's wrong", "alarm", "troubleshoot", "battery not charging" | Step-by-step diagnostic: running state → alarms → power flow → battery → EMS mode → energy trends. Includes common issue patterns with likely causes |
| `sigen-config` | "change EMS mode", "set charge limit", "configure" | Safe configuration workflow: always reads current state first, validates ranges, requires user confirmation before writes |
| `sigen-docs` | "how do I configure", "what does this setting do", "create a TOU plan" | Queries the official Sigenergy mySigen App GitBook docs via AI Answers API; prefers `query_sigen_docs` MCP tool if available, falls back to direct HTTP query |
| `sigen-config-optimizer` | "optimize my settings", "create a custom mode", "design a TOU schedule" | Full configuration design workflow: gathers current system state + user rate plan/devices/goals, queries docs for parameter details, then produces a step-by-step mySigen app setup guide. Handles seasonal adjustments |

Load a skill with `skill(name="sigen-status")` and follow its instructions. For OpenCode, use `skill(name="sigen-status")`. For other agents, reference the `skills/<name>/SKILL.md` path.

## Key references
- [references/](./references/) — Local reference documentation with version history and downloaded PDFs
- [Sigenergy Modbus Protocol PDF (V2.8)](https://raw.githubusercontent.com/TypQxQ/Sigenergy-Local-Modbus/v.1.2.0/Modbus_reference_documentation/Modbus%20Protocol%20EN%20-%20SIGEN%20(1)/Modbus_Protocol_EN_2.8-SIGEN.pdf) — Latest official Modbus register documentation
- [Sigenergy-Local-Modbus (HACS)](https://github.com/TypQxQ/Sigenergy-Local-Modbus) — Community register definitions
