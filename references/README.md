# Modbus Protocol References

## Official Sigenergy Modbus Protocol PDFs

| Version | Date | URL |
|---------|------|-----|
| **V2.8** | **2025-11-28** | **https://raw.githubusercontent.com/TypQxQ/Sigenergy-Local-Modbus/v.1.2.0/Modbus_reference_documentation/Modbus%20Protocol%20EN%20-%20SIGEN%20(1)/Modbus_Protocol_EN_2.8-SIGEN.pdf** |
| V2.7 | 2025-05-23 | https://www.sigenergy.com/uploads/us_download/1755488219226583.pdf |
| V2.5 | 2025-02-19 | Unpublished |
| V2.4 | 2025-02-05 | Unpublished |
| V2.3 | 2024-12-09 | Unpublished |
| V1.7 | 2024-04-09 | https://pdf.tritec.info/pdf/produkte/Sigenergy_Modbus_Protocol_20240409_EN.pdf |

> The Modbus Protocol PDF is not publicly listed on sigenergy.com — it must be requested from support or sourced from community mirrors.

### Local Files (gitignored — download manually if missing)

| File | Version | Pages | Source |
|------|---------|-------|--------|
| `Sigenergy_Modbus_Protocol_V2.8_20251128.pdf` | V2.8 (2025-11-28) | 50 | GitHub mirror (TypQxQ HACS repo) |
| `Sigenergy_Modbus_Protocol_V2.7_20250523.pdf` | V2.7 (2025-05-23) | 45 | sigenergy.com (region-locked) |
| `Sigenergy_Modbus_Protocol_V1.7_20240409.pdf` | V1.7 (2024-04-09) | 31 | tritec.info |

### Version History

- **V2.8** — Adds plant running info registers up to 30284 (General load power, Total load power), grid phase voltage/current registers. Not all V2.8 documents match.
- **V2.7** — Adds description for plant broadcast address, inverter level power control registers, AC-Charger parameter settings. 34 pages.
- **V2.5** — Adds plant ESS related registers, two grid point and two PCS power control registers
- **V2.4** — Modified a few inverter registers
- **V2.3** — Added new applicable models (three-phase products), AC charger support
- **V1.7** — Initial documented version. Added DC Charger registers, remote EMS and ESS control registers.

## Community References

- [Sigenergy-Local-Modbus (HACS)](https://github.com/TypQxQ/Sigenergy-Local-Modbus) — Home Assistant integration with extensive register definitions
- [sigenergy2mqtt](https://github.com/seud0nym/sigenergy2mqtt) — MQTT bridge with full V2.7 implementation
- [Sigenergy Modbus (Rocket-Search)](https://github.com/Rocket-Search/sigenergy-modbus) — C++ Modbus reader tool

## Notes

- Sigenergy publishes regional variants of the PDF at different URLs (US, EU, AU, etc.)
- The Modbus protocol is under active development — firmware updates may add or remove registers
- Not all registers documented in the PDF are supported by all firmware versions
