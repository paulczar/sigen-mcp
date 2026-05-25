# SigenCloud API — Developer Access

Guide to registering for SigenCloud API access via the Sigen Developer Portal.

## Prerequisites

- A Sigenergy ESS system with internet connectivity (the system must be registered in the mySigen app)
- A mySigen account (the same credentials used to log into the [mySigen mobile app](https://www.sigenergy.com/en/products/mysigen) or the [Sigen Cloud web portal](https://web-eu.sigencloud.com))

## Sign In

1. Go to [developer.sigencloud.com](https://developer.sigencloud.com/)
2. Click **Get Started** or **Sign In** (top right)
3. Use your **mySigen account credentials** (email + password) — the same login you use for the mobile app
4. If you see an `accountError` popup, try a different region/URL or check that your account is fully activated in the mySigen app first

## Create an Application

Once logged in, you'll see a default application (typically named "Dashboard") and an option to create a new one.

### Application Fields

| Field | Description |
|-------|-------------|
| **Name** | A label for your application. Choose something descriptive, e.g. `sigen-mcp`, `Home Integration`, or `My MCP Server` |
| **Auth Type** | Currently only `onboard & offboard` is available. This grants your app an `app_key`/`app_secret` pair used to authenticate API requests. "Onboard" authorizes your systems for API access; "offboard" revokes it |
| **Use in VPP Dispatch** | Controls whether your app can send battery charge/discharge commands. Set to **No** for read-only or basic control (mode switching, smart loads). Set to **Yes** if you need time-ahead battery scheduling or VPP aggregation |
| **Description** | Free-text description of what you're building |

### After Submission

1. The application status will show as **"under reviewing"**
2. Approval typically takes **a few days** (per community reports)
3. Once approved, you'll receive an **AppKey** and **AppSecret** — save these securely

## What You Can Do With Each Auth Method

### End-User API (no app needed — use your mySigen credentials directly)

| Capability | Status |
|------------|--------|
| Read station info, energy flow | ✅ Immediately |
| List/set operational modes | ✅ Immediately |
| List/control smart loads | ✅ Immediately |
| Historical data (5-min intervals) | ✅ Immediately |
| Paginated alarms | ✅ Immediately |

Requires: AES-128-CBC password encryption + OAuth2 password grant flow.

### Northbound API (requires AppKey from developer portal)

| Capability | Status |
|------------|--------|
| Everything from End-User API | ✅ After approval |
| MQTT real-time telemetry push | ✅ After approval |
| Battery dispatch / VPP commands | ✅ After approval (requires VPP=Yes) |
| System onboarding/offboarding | ✅ After approval |
| Alternate mode switching path | ✅ After approval |

> **Note:** The Northbound API (AppKey/AppSecret) is not as thoroughly tested in this project as the End-User API (user/pass). Auth, mode query, and mode switching work in testing, but the history endpoint (`/openapi/systems/{id}/history`) has shown inconsistent "Access restriction" errors. If you're building on this project, rely on the End-User API path for most tools.

### Region Base URLs

| Region | End-User API Base | OpenAPI Base | MQTT Broker |
|--------|-------------------|-------------|-------------|
| Europe | `https://api-eu.sigencloud.com` | `https://openapi-eu.sigencloud.com` | `mqtt-eu.sigencloud.com:8883` |
| Australia | `https://api-aus.sigencloud.com` | `https://openapi-aus.sigencloud.com` | `mqtt-apac.sigencloud.com:8883` |
| Asia-Pacific | `https://api-apac.sigencloud.com` | `https://openapi-apac.sigencloud.com` | `mqtt-apac.sigencloud.com:8883` |
| China | `https://api-cn.sigencloud.com` | `https://openapi-cn.sigencloud.com` | `mqtt-cn.sigencloud.com:8883` |
| United States | `https://api-us.sigencloud.com` | `https://openapi-us.sigencloud.com` | `mqtt-us.sigencloud.com:8883` |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `accountError` on login | Account region mismatch or account not activated | Try different region URLs; ensure you can log into app first |
| "under reviewing" for days | Manual approval process | Wait — community reports indicate a few days turnaround |
| HTTP 401 on API calls | Token expired or invalid | Re-authenticate; ensure AES encryption is correct (key/IV both `sigensigensigenp`) |
| HTTP 424 / rate limited | API credit limit exceeded | Reduce request frequency (5-min interval per endpoint minimum) |
| MQTT connection refused | Invalid AppKey or TLS cert issue | Verify AppKey is approved; Sigen's CA cert may need relaxed OpenSSL verification |
| "code: 1201" errors | Access restricted (e.g., date before system install) | Check request parameters |

## References

- Developer portal: [developer.sigencloud.com](https://developer.sigencloud.com/)
- Community discussion: [Facebook — Sigenergy Customers & Installer Group UK](https://www.facebook.com/groups/sigenergy/posts/837521555283594/)
- Reference Python clients on GitHub:
  - [Bankilo/sigen-api](https://github.com/Bankilo/sigen-api) — Most complete (OAuth2, Northbound, MQTT)
  - [blindman2k/sigenpy](https://github.com/blindman2k/sigenpy) — Simpler REST-only client
  - [fbradyirl/sigen](https://pypi.org/project/sigen/) — Original PyPI package (v3.0.2)
  - [schwarzbr0t/sigenergy-ha](https://github.com/schwarzbr0t/sigenergy-ha) — Home Assistant custom integration
  - [GerardBrowne/sig-data](https://github.com/GerardBrowne/sig-data) — Monitoring stack with token caching
