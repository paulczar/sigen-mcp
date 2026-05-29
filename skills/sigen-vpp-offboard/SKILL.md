---
name: sigen-vpp-offboard
description: |
  VPP offboarding workflow for Sigenergy ESS systems. Recovers a system stuck in VPP mode by calling the Northbound API offboard endpoint, then restores the user's preferred operating mode. Use when the system is stuck in VPP mode (mode 6) and cannot be changed, when the user accidentally enabled VPP Dispatch on their developer app, or when a VPP authorization request has expired without being resolved.
---

# sigen-vpp-offboard — VPP Offboarding

Recovers a Sigenergy ESS system from VPP mode by offboarding the developer app via the Northbound API, then restoring the user's chosen operating mode.

## Prerequisites

- `sigen-api-mcp` MCP server configured with **both** user/pass credentials **and** AppKey/AppSecret (the Northbound API auth with AppKey is required for the offboard call)
- The system must be in VPP mode (EMS mode 6) — confirm with `cloud_current_mode` or Modbus `read_ems_mode`
- The AppKey/AppSecret must be from the same developer app that caused the VPP enrollment (only the enrolled app can offboard)

## Procedure

### 1. Confirm the system is in VPP mode

Call `cloud_current_mode` or `read_ems_mode` to verify:

```
Current Mode: VPP (mode 6)
```

If the system is not in VPP mode (mode 6), this skill is not needed.

### 2. Offboard the system via Northbound API

The Northbound API offboard endpoint removes the developer app's authorization from the system, which forces it out of VPP mode.

Call `cloud_nb_offboard`:

```
cloud_nb_offboard(systemId: "<stationCode>")
```

Omitting `systemId` auto-detects the configured station.

**Expected success response:**
```
Offboard result for TAETN1768371966: {"code":0,"msg":"success","data":[{"systemId":"TAETN1768371966","result":true,"codeList":[0]}]}
```

If offboard returns `"result": false` with `codeList: [1103]`, the app may not be the one that enrolled the system in VPP, or the system may not be onboarded yet.

### 3. Confirm VPP mode is released

Call `cloud_current_mode` to verify the mode has changed. The system typically drops to **Maximum Self-Powered** (mode 0) after offboard.

```
Current Mode: Maximum Self-Powered (mode 0)
```

### 4. Ask the user which mode to restore

Present the available options from `cloud_operational_modes` and ask the user which mode they want:

| Common Modes | Value | Description |
|---|---|---|
| Maximum Self-Powered | 0 | Self-consumption priority — export excess only |
| AI Mode | 1 | AI-optimized charging/discharging |
| Time of Use (TOU) | 2 | Schedule-based with custom periods (recommended for time-of-use tariffs) |
| Full Feed-in | 5 | Export all solar, discharge battery to grid |
| Custom | 9 | User-defined energy profile |

### 5. Switch to the chosen mode

Call `cloud_set_ems_mode` with the user's chosen mode value:

```
cloud_set_ems_mode(mode: <chosen_value>)
```

For Custom mode (9), also ask for the `profileId`.

> Alternatively, use `cloud_nb_switch_mode` if you prefer the NB API path (uses NB mode values: 0=MSC, 5=FFG, 6=VPP, 8=NBI).

### 6. Verify

Call `cloud_current_mode` to confirm the switch took effect.

## Important Notes

- **Offboarding is not reversible via API**: Once offboarded, the app no longer controls the system. To re-enable NB API features (cloud_history, MQTT, battery dispatch), call `cloud_nb_onboard` — but this requires the system owner to authorize it. The authorization email must NOT expire.
- **Recreate the app with VPP=No**: To prevent this happening again, delete the developer app on [developer.sigencloud.com](https://developer.sigencloud.com/) and create a new one with **"Use in VPP Dispatch" → No**. Get new AppKey/AppSecret and update your config.
- **NB API tools require AppKey/AppSecret**: `cloud_nb_offboard`, `cloud_nb_onboard`, and `cloud_nb_switch_mode` all use the Northbound API which needs AppKey/AppSecret auth, not the End-User (user/pass) path. If you haven't configured them, the tools will error.
- **`cloud_nb_offboard` and `cloud_set_ems_mode` work together**: Offboard first to release VPP, then switch to the desired mode. Do not skip the confirm step between them.
