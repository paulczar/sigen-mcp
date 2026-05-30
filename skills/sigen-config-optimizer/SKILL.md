---
name: sigen-config-optimizer
description: |
  ⚠️ EXPERIMENTAL — needs tuning. Full configuration design workflow: gathers current system state + user rate plan/devices/goals, queries docs for parameter details, researches device specifications, then produces a comprehensive markdown configuration report with step-by-step mySigen app setup instructions. Handles seasonal adjustments.
---

# sigen-config-optimizer — Operational Mode Configuration Designer

> ⚠️ **EXPERIMENTAL** — This skill is a work in progress. The generated configuration reports may contain inaccuracies or miss edge cases. Always verify recommendations against the mySigen app and official docs before applying. Feedback and refinements welcome — expect iterations.  


Designs optimal Sigenergy operational mode(s) and produces a **savable markdown report** that covers every device, every rate plan detail, every configuration step, and seasonal variations. The report is a living document that gets refined as equipment or habits change.

## Prerequisites

- `sigen-docs-mcp` MCP server (or fallback to direct GitBook ask API)
- `sigen-modbus-mcp` and/or `sigen-api-mcp` for reading current system state
- Web search capability for device spec research
- User's cooperation on rate plan details, device inventory, and goals

## Output

The skill produces a single markdown report covering:

1. **System snapshot** — current live state, battery capacity, PV rating
2. **Device inventory** — every energy device with researched specs (kWh ratings, battery sizes, charge limits)
3. **Rate plan** — structured tariff breakdown
4. **Seasonal profiles** — summer, winter, shoulder season configs if they differ
5. **Step-by-step configuration guide** — exact mySigen app settings for each season
6. **Refinement log** — place to record adjustments over time

## ⚠️ CRITICAL RULE: NO GUESSED DEFAULTS

**Never copy example/default values from the skill templates into the report.** The examples below are structural placeholders only — their numeric values (kW limits, charge rates, SOC targets, etc.) are illustrative, not factual.

**Always determine real values by (in priority order):**
1. Reading live system data via MCP tools (modbus registers, cloud API)
2. Reading the user's existing knowledge base (Obsidian vault, docs)
3. Researching manufacturer specs via web search
4. Asking the user directly

**If a value cannot be determined, leave it blank or mark it `[TBD]`** — never substitute with example defaults.

---

## Phase 1: Gather Context

### 1a. Check Existing Knowledge Base

Ask the user if they maintain a local knowledge base. Common options:

- **Obsidian vault** (`~/Documents/Obsidian/`, `~/notes/`, etc.)
- **GitHub wiki / repo markdown** (`~/projects/home/`, `~/docs/`)
- **Apple Notes / Notion / Bear** (less accessible, ask user to export relevant bits)
- **Home Assistant notes** (`~/config/`, `*.md` files)
- **Any `*.md` files in `~` or `~/Documents`**

If they do, search for existing documentation on:
- House energy system (solar, battery, inverter specs)
- Appliance specs (pool pump, hot water, AC models)
- EV details (make, model, battery size)
- Rate plan notes or past energy bills
- Previous configuration attempts or notes

```bash
# Search for energy-related markdown files
find ~/Documents/Obsidian -name "*.md" | xargs grep -li -E "solar|battery|energy|pool|ev|charger|globird|tariff|sigen|inverter" 2>/dev/null

# Or a specific known path like:
ls ~/Documents/Obsidian/MyVault/30-home/ 2>/dev/null
```

Extract any useful data — appliance models, power ratings, seasonal notes, rate plan details — and incorporate it into the device inventory and rate plan sections.

### 1a.2. Check Home Assistant MCP

If the user has the `homeassistant-mcp` (or similar) MCP server available, query it for energy-related entities:

```
# Discover energy devices
hass_list_entities?domain=sensor&search=energy
hass_list_entities?domain=sensor&search=power
hass_list_entities?domain=sensor&search=consumption
hass_list_entities?domain=switch&search=energy
hass_list_entities?domain=sensor&search=solar

# Get current power readings for known high-load devices
hass_get_entity?entity_id=sensor.pool_pump_power
hass_get_entity?entity_id=sensor.hot_water_power
hass_get_entity?entity_id=sensor.ev_charger_power
hass_get_entity?entity_id=sensor.house_energy_consumption

# Check for any energy dashboard entities
hass_list_entities?domain=sensor&search=energy_dashboard
hass_get_entity?entity_id=sensor.energy_daily_consumption
```

Useful entities to look for:

| Search Term | What You Might Find |
|-------------|---------------------|
| `solar_production`, `pv_power` | Current solar generation |
| `battery_power`, `battery_soc` | Battery charge/discharge + SOC |
| `grid_power`, `grid_import`, `grid_export` | Grid interaction |
| `pool_pump*`, `swimming_pool*` | Pool pump power and state |
| `hot_water*`, `heat_pump*`, `water_heater*` | Hot water system |
| `ev_charger*`, `wallbox*`, `car_charger*` | EV charger status |
| `ac_power*`, `aircon*`, `hvac*` | Air conditioner |
| `energy_today*`, `daily_energy*` | Daily consumption totals |

Record any discovered entities and their current values into the device inventory. Home Assistant may have devices the user forgot to mention, or may expose power readings that help estimate daily consumption.

If no Home Assistant MCP is available, skip this step.

If no existing knowledge base is found, suggest creating one as part of the report output.

### 1b. Read Current System State

Call available MCP tools to snapshot the live system:

```
read_plant              → EMS mode, grid status, running state, PV power, battery power, SOC, load
read_inverter_detail    → inverter model, PV strings (number + power per string), phase power
read_plant_energy       → lifetime PV generation, grid import/export, battery charge/discharge
read_alarms             → any active alarms
read_ev_status          → DC charger connected state, vehicle SOC, charging power (if EV connected)
read_ac_charger         → AC EV charger state (if AC EVSE present)
```

If cloud tools are available:

```
sigen-api-mcp tools     → station info (serial numbers, PV/battery capacity), energy flow, smart loads
```

Record these into the report's **System Snapshot** section:

```markdown
## System Snapshot

| Parameter | Value |
|-----------|-------|
| Inverter model | SigenStor (3-phase) |
| PV capacity | 13.25 kW |
| Battery capacity | 40.3 kWh |
| Battery SOC | 67% |
| Current EMS mode | TOU |
| Grid status | OnGrid |
| Running state | Running |
| DC EV charger | Present (EV1 PHEV connected?) |
| AC EV charger | Present (EV2 BEV connected?) |
| Smart loads detected | Pool pump (path: 1), Hot water (path: 2) |
```

### 1b. Research Device Specifications

For each known device, research its power consumption and energy requirements. Use web search to find:

| Device | What to Look Up |
|--------|----------------|
| EV (PHEV) | Battery capacity (kWh), max AC charge rate (kW), max DC charge rate (kW), usable SOC range |
| EV (BEV) | Battery capacity (kWh), max charge rate (kW), typical efficiency (kWh/100km), daily commute km |
| Pool pump | Motor power rating (W or kW), typical daily runtime, filter pump vs heater element |
| Pool heater | Heat pump input power (kW), COP, or resistive element rating (kW) |
| Hot water heat pump | Tank size (L), element power (kW), COP, typical daily consumption (kWh) |
| Hot water resistive | Element rating (kW), tank size, thermostat temp, daily consumption |
| Air conditioner | Rated cooling/heating power (kW), rated input power (kW), seasonal COP/EER |
| Spa / sauna | Heater element (kW), pump power (kW), typical usage session (kWh) |

Web search query patterns:

```
"{make} {model} battery capacity kWh charge rate"
"{make} {model} pool pump power consumption watts"
"{make} {model} heat pump input power kW"
```

If unable to find specs, ask the user or use typical defaults:

```
EV (BEV, medium)    → 60-80 kWh battery, 7-11 kW AC, up to 150 kW DC
EV (PHEV, medium)   → 15-30 kWh battery, 3-7 kW AC
Pool pump           → 1-2 kW (variable speed), 0.5-1 kWh per hour of runtime
Pool heat pump      → 3-6 kW input (COP 5-6), 15-30 kWh/day in winter
Heat pump hot water → 0.6-1.2 kW input, 2-4 kWh/day (COP 3-4)
Resistive hot water → 3.6-4.8 kW element, 6-10 kWh/day
AC (ducteda)        → 3-5 kW input, 1.5-2 kWh per hour runtime
```

Record into the report **Device Inventory**:

```markdown
## Device Inventory

### EV1: PHEV (Example)
| Parameter | Value |
|-----------|-------|
| Battery capacity | ~20 kWh |
| Max AC charge | ~7 kW (Type 2) |
| DC charge | N/A (PHEV, no DC) |
| Typical daily use | ~30-50 km → ~8-12 kWh |
| Charging preference | Solar daytime + free power window |

### EV2: BEV (Example)
| Parameter | Value |
|-----------|-------|
| Battery capacity | ~80 kWh |
| Max AC charge | 7-11 kW (Type 2) |
| Max DC charge | 150-180 kW |
| Typical daily use | ~50 km → ~10-12 kWh |
| Charging preference | Solar daytime, occasional free power window |

### Pool Pump
| Parameter | Value |
|-----------|-------|
| Motor rating | 1.1 kW (variable speed) |
| Typical runtime | 6-8 hours/day summer, 4 hours winter |
| Daily consumption | ~2-4 kWh summer, ~1-2 kWh winter |
| Smart load? | Yes (currently load path 1) |

### Hot Water Heat Pump
| Parameter | Value |
|-----------|-------|
| Input power | 0.7 kW |
| COP | 3.5 |
| Tank | 315 L |
| Daily consumption | ~3-4 kWh (summer), ~5-6 kWh (winter) |
| Smart load? | Yes (currently load path 2) |

### Air Conditioning
| Parameter | Value |
|-----------|-------|
| Cooling input | 2.5 kW |
| Heating input | 2.8 kW (heat pump) |
| Summer usage | 6-8 hours/day → 15-20 kWh/day |
| Winter usage | Occasional heat mode → 5-10 kWh/day |
| Smart load? | No (direct circuit) |
```

### 1c. Inventory Smart Loads

Call `read_smart_loads` (or cloud tools) to identify which devices are already wired as smart loads. Record:

- Load path ID
- Current name (user may want to rename)
- Current on/off state
- Whether it's being controlled manually or by schedule

If a device isn't a smart load but could be (e.g. pool pump), note this — user may want to have an electrician make it one.

### 1d. Map Seasonality

Build a seasonal profile with the user:

```markdown
## Seasonal Profiles

### Summer (Dec-Feb) — Brisbane
| Device | Pattern | Daily kWh |
|--------|---------|-----------|
| AC (cooling) | Runs 12pm-8pm most days | ~18 |
| Pool pump | 6 hours daytime | ~3 |
| Hot water | Heat pump, runs midday | ~3 |
| EV1 (PHEV) | Charges at home 3-4x/week | ~10 avg |
| EV2 (BEV) | Charges at home 5x/week | ~12 avg |
| **Total daily load** | | **~46** |

### Winter (Jun-Aug) — Brisbane
| Device | Pattern | Daily kWh |
|--------|---------|-----------|
| AC (heating) | Occasional evenings, some mornings | ~5 |
| Pool pump | 4 hours daytime, less runtime | ~2 |
| Pool heater | Runs for spa 1-2x/week | ~15 avg |
| Hot water | Heat pump, runs midday | ~5 |
| EV1 (PHEV) | Charges at home 3-4x/week | ~10 avg |
| EV2 (BEV) | Charges at home 5x/week | ~12 avg |
| **Total daily load** | | **~49** |
```

### 1e. Capture Rate Plan

Structure the tariff details:

```markdown
## Rate Plan: (Example TOU with free power + export bonus)

| Period | Time | Import Rate | Export Rate | Notes |
|--------|------|-------------|-------------|-------|
| Free power | 11:00-14:00 | $0.00/kWh | n/a | Grid charging = free |
| Off-peak | 22:00-06:00 | $0.08/kWh | $0.05/kWh | |
| Shoulder | 06:00-11:00, 14:00-16:00 | $0.15/kWh | $0.05/kWh | |
| Peak | 16:00-21:00 | $0.28/kWh | — | Avoid importing |
| Bonus export | 16:00-21:00 | — | $0.10/kWh | Export topup rate (on top of base FiT) |
| Penalty avoidance | 18:00-21:00 | — | — | Bonus for not importing (demand reduction) |
| Daily supply | All day | $1.20/day | — | |
```

### 1f. Establish Goals

Ask the user what they're optimizing for. Rate each on a scale:

| Goal | Priority (1-5) |
|------|----------------|
| Zero grid import bills | 5 |
| Minimize peak import | 4 |
| Maximize free power usage | 5 |
| Maximize export during bonus | 3 |
| EV convenience (always charged) | 4 |
| Pool heater availability | 2 |
| Backup reserve for outages | 3 |
| Set-and-forget simplicity | 3 |

---

## Phase 2: Research Configuration Parameters

Query the docs to understand available settings:

```
query_sigen_docs({ question: "What parameters can be set in Time-based Control Mode per period?" })
query_sigen_docs({ question: "What is Battery Automation and what are its available actions?" })
query_sigen_docs({ question: "What is Grid Automation and what actions can be configured?" })
query_sigen_docs({ question: "How does Solar Producing Priority work?" })
query_sigen_docs({ question: "What EV charging settings are available for scheduling and solar priority?" })
query_sigen_docs({ question: "How does peak shaving work?" })
query_sigen_docs({ question: "What Charging Source Priority options exist?" })
query_sigen_docs({ question: "How do I configure a custom TOU rate plan in the app?" })
query_sigen_docs({ question: "What is Surplus PV priority for EV charging?" })
```

---

## Phase 3: Design Configuration(s)

For each season, design the optimal mode and time periods. Consider:

### Mode Selection

| Scenario | Best Mode |
|----------|-----------|
| Free power window + export bonus + TOU | Time-based Control (or Custom) |
| Mostly self-consumption, simple rates | Self-Consumption |
| Complex multi-objective | Custom Operational Mode |
| Want AI to figure it out | Sigen AI + configured rate plan |

### Time Period Design

For each period slot, specify: time, action (charge/discharge/self-consumption), max charge power, max discharge power, grid charge cut-off SOC, discharge cut-off SOC, grid import/export limits.

```markdown
### Summer Schedule

| # | Time | Action | Charge kW | Discharge kW | Grid Import | Grid Export | Cut-off SOC |
|---|------|--------|-----------|-------------|-------------|-------------|-------------|
| 1 | 00:00-06:00 | Self-consumption | — | — | 5 kW | — | — |
| 2 | 06:00-11:00 | Self-consumption | — | — | — | — | — |
| 3 | 11:00-14:00 | Charge from grid | 7 kW | — | 12 kW | — | 100% |
| 4 | 14:00-16:00 | Self-consumption | — | — | — | — | — |
| 5 | 16:00-21:00 | Discharge to house + export | — | 5 kW | — | 10 kW | 20% |
| 6 | 21:00-00:00 | Self-consumption | — | — | 5 kW | — | — |
```

### Winter Schedule

Similar table with adjustments for less solar, pool heater, occasional AC heating.

### Design Principles

- **11am-2pm free power**: Charge battery to 100% from grid. Run pool pump, hot water, EV charging during this window.
- **6-9pm bonus export**: Discharge battery to house, export surplus at premium rate. Avoid any grid import during this window.
- **Overnight**: Self-consumption mode — battery preserves for morning. EVs charge from grid if needed (off-peak rate).
- **Daytime solar**: PV powers loads first, surplus charges battery, excess exports.
- **Solar vs Grid charging**: During free power window, Grid → PV priority (take free power). Otherwise, PV → Grid (use solar first).

### Priority Chain (in-app setting)

```
Charging Source:       PV → Grid (default except free window)
Grid Exporting:        PV → Battery (export solar first, battery supplements)
Battery Discharge:     Load → Grid (house first, then export surplus)
Solar Producing:       Load → Battery → Grid (self-consume first)
```

---

## Phase 4: Produce the Report

Output a comprehensive markdown report that can be saved to a file. Structure:

```markdown
# Sigenergy Configuration Report — {User Name}

*Generated: {date} · Version 1*

## System Overview

{Brief description of the system, goals, and approach}

## System Snapshot

{Live data table}

## Device Inventory

{All devices with researched specs}

## Rate Plan

{Tariff structure}

## Configuration

### Mode Selection
{Which mode(s) and why}

### Summer Configuration
{Time periods table + priority settings + EV settings + smart load settings}

### Winter Configuration
{Time periods table + priority settings + EV settings + smart load settings + pool heater}

### Common Settings (All Seasons)
{Settings that don't change: SOC limits, power limits, backup reserve}

## Step-by-Step Setup Guide

### Step 1: Set Battery Level Limits
`Setting → System Settings → Energy Management → Power Station Energy Config → Battery Settings → Level Settings`
- Charge Cut-off SOC: 100%
- Discharge Cut-off SOC: 10%
- Backup Reserve SOC: 20%
- Peak shaving SOC: (if used)

### Step 2: Configure Charging Source Priority
`... → Battery Settings → Charging Source Priority`
- Default order: PV → Grid

### Step 3: Configure Grid Export Priority
`... → Grid Settings → Grid Exporting Priority`
- Default order: PV → Battery

### Step 4: Set Power Limits
`... → Grid Settings → Grid Power Setting`
- Grid Export Power Limit: 10 kW
- Grid Import Power Limit: 10 kW

### Step 5: Create Time Periods (Summer)
`Setting → Operational Mode → Time-based Control`
For each period, tap Add Period and configure:

| # | Time | Type | Settings |
|---|------|------|----------|
| 1 | 00:00-06:00 | Self-consumption | Import: 5kW, Export: — |
| 2 | 06:00-11:00 | Self-consumption | Import: —, Export: — |
| 3 | 11:00-14:00 | Charge | Max charge: 7kW, Grid cut-off: 100%, Grid import: 12kW, Grid→BAT: 7kW |
| 4 | 14:00-16:00 | Self-consumption | Import: —, Export: 5kW |
| 5 | 16:00-21:00 | Discharge | Max discharge: 5kW, Export: 10kW, BAT→Grid: 5kW, Cut-off: 20% |
| 6 | 21:00-00:00 | Self-consumption | Import: 5kW, Export: — |

### Step 6: Create Time Periods (Winter)
{Same format, adjusted for winter}

### Step 7: Configure EV Charging
`Device → Sigen EV DC Charging Module → Charging Setting`
- Charging Mode: PV Surplus Charging
- Schedule: (if using)
- Max Charging Power: 7 kW (or EV max)

`Charging Preference`
- Battery Boost: Enable (allow battery to support EV charging)
- Cut-OFF SOC: 20% (don't drain battery below this for EV)
- Surplus PV Priority: EV > Battery > Load (drag to order)

### Step 8: Configure Smart Loads (if applicable)
`Device → Smart Loads`
- Pool pump: Schedule ON during free power window (11am-2pm)
- Hot water: Schedule ON during solar hours
- Smart load timers can be set to auto-off based on SOC if supported

### Step 9: Set Rate Plan in App (for AI Mode)
`Setting → System Settings → Energy Management → Grid Settings → Tariff Plan`
- Enter your rate plan details so the system understands pricing
- This helps Sigen AI mode if you switch to it

## Expected Performance

| Metric | Summer (est.) | Winter (est.) |
|--------|--------------|--------------|
| Daily solar gen | ~60 kWh | ~25 kWh |
| Daily house load | ~46 kWh | ~49 kWh |
| Grid import | ~5 kWh | ~20 kWh |
| Grid export | ~15 kWh | ~2 kWh |
| Estimated daily cost | ~$0.50 credit | ~$2.50 |
| Monthly estimate | ~$15 credit | ~$75 |

## Refinement Log

| Date | Change | Result |
|------|--------|--------|
| — | — | — |

*Note: Update this section as you adjust settings and observe results.*
```

---

## Phase 5: Deliver and Iterate

1. Present the report to the user
2. Ask if they want adjustments before applying
3. **Save the report** — if the user has a knowledge base path (e.g. their Obsidian vault or docs folder), suggest saving it there as `sigen-config-report.md`. Otherwise, suggest a location like `~/Documents/sigen-config-report.md`. Offer to write it.
4. After the user applies the configuration, wait a few days
5. Re-read system data and compare against expected performance
6. Update the report's Refinement Log with what changed and what happened
7. Revisit seasonally — especially Brisbane summer → winter transition

## Key Constraints to Document

| Constraint | Typical Value |
|------------|---------------|
| Battery capacity | 40.3 kWh (full charge shifts significant solar to evening) |
| PV capacity | 13.25 kW (summer ~60 kWh/day, winter ~25 kWh/day) |
| Max charge power | Varies by battery module count (typically 5-7 kW) |
| Max discharge power | Typically 5-7 kW |
| Grid connection limit | Usually 5-10 kW import/export (check with retailer) |
| EV DC charger max | ~7 kW AC (PHEV limit), up to 150 kW DC (BEV) |
| Free power window | 11am-2pm = 3 hours, enough to charge 40 kWh battery from ~30% SOC |
| Time periods | Up to 24 in Time-based Control (App 3.0+); older firmware may limit to 3 |
