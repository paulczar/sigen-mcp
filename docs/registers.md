# Register Reference — sigen-mcp

Auto-generated from `src/constants/registry.ts`. Regenerate with `npm run docs`.

Total registers defined: **314**

## Data Types & Gains

| Data Type | Gain | Applies To |
|-----------|------|------------|
| `U16`/`S16` | — | status enums, counts |
| `U16`/`S16` | ×10 | voltage (V), SOC/SOH (%), temperature (°C) |
| `U16`/`S16` | ×100 | frequency (Hz), percentage (%), current (A) |
| `U16`/`S16` | ×1000 | insulation (MΩ), power factor |
| `U32`/`S32` | ×1000 | power (kW), apparent power (kVA/kvar) |
| `U32`/`S32` | ×100 | energy (kWh), capacity (kWh), voltage (V) |
| `U64` | ×100 | accumulated energy (kWh) |

## Slave IDs

| Slave | Target |
|-------|--------|
| **247** | Plant-level (EMS, grid, battery, energy, alarms) |
| **1** | Inverter-level (PV, phases, DC charger, AC charger) |
| **0** | Plant broadcast (write-only, no reply) |

## Plant Input (slave 247)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `EMS_MODE` | 30003 | input | Plant (247) | U16 | EMS operating mode |  |
| `GRID_STATUS` | 30004 | input | Plant (247) | U16 | Grid sensor status (0=Offline, 1=Online) |  |
| `PLANT_SYSTEM_TIME` | 30000 | input | Plant (247) | U32 32-bit x1 | System time (epoch seconds) |  |
| `PLANT_SYSTEM_TIMEZONE` | 30002 | input | Plant (247) | S16 x1 | System timezone offset (minutes) |  |
| `PLANT_GRID_ACTIVE_POWER` | 30005 | input | Plant (247) | S32 32-bit x1000 | Grid sensor active power (>0 buy, <0 sell) | kW |
| `PLANT_GRID_REACTIVE_POWER` | 30007 | input | Plant (247) | S32 32-bit x1000 | Grid sensor reactive power | kvar |
| `PLANT_ON_OFF_GRID_STATUS` | 30009 | input | Plant (247) | U16 | On/Off grid status (0=on, 1=off(auto), 2=off(manual)) |  |
| `PLANT_MAX_ACTIVE_POWER` | 30010 | input | Plant (247) | U32 32-bit x1000 | Max active power | kW |
| `PLANT_MAX_APPARENT_POWER` | 30012 | input | Plant (247) | U32 32-bit x1000 | Max apparent power | kVA |
| `BATTERY_SOC` | 30014 | input | Plant (247) | U16 x10 | Battery state of charge | % |
| `BATTERY_SOH` | 30087 | input | Plant (247) | U16 x10 | Battery state of health | % |
| `PLANT_PHASE_A_ACTIVE_POWER` | 30015 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_PHASE_B_ACTIVE_POWER` | 30017 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_PHASE_C_ACTIVE_POWER` | 30019 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_PHASE_A_REACTIVE_POWER` | 30021 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_PHASE_B_REACTIVE_POWER` | 30023 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_PHASE_C_REACTIVE_POWER` | 30025 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_ALARM1` | 30027 | input | Plant (247) | U16 | Merged Alarm1 (PCS alarm codes) |  |
| `PLANT_ALARM2` | 30028 | input | Plant (247) | U16 | Merged Alarm2 (PCS alarm codes 2) |  |
| `PLANT_ALARM3` | 30029 | input | Plant (247) | U16 | Merged Alarm3 (ESS alarm codes) |  |
| `PLANT_ALARM4` | 30030 | input | Plant (247) | U16 | Merged Alarm4 (Gateway alarm codes) |  |
| `PLANT_ALARM5` | 30072 | input | Plant (247) | U16 | Merged Alarm5 (DC charger alarm codes) |  |
| `PLANT_ALARM6` | 30280 | input | Plant (247) | U16 | Merged Alarm6 (Plant alarm 1 - Appendix 12) |  |
| `PLANT_ALARM7` | 30281 | input | Plant (247) | U16 | Merged Alarm7 (Plant alarm 2 - Appendix 13) |  |
| `PLANT_ACTIVE_POWER` | 30031 | input | Plant (247) | S32 32-bit x1000 | Plant total active power | kW |
| `PLANT_REACTIVE_POWER` | 30033 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_PV_POWER` | 30035 | input | Plant (247) | S32 32-bit x1000 | PV generation power | kW |
| `PLANT_ESS_POWER` | 30037 | input | Plant (247) | S32 32-bit x1000 | ESS power (<0 discharge, >0 charge) | kW |
| `PLANT_AVAILABLE_MAX_ACTIVE_POWER` | 30039 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_AVAILABLE_MIN_ACTIVE_POWER` | 30041 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_AVAILABLE_MAX_REACTIVE_POWER` | 30043 | input | Plant (247) | U32 32-bit x1000 |  | kvar |
| `PLANT_AVAILABLE_MIN_REACTIVE_POWER` | 30045 | input | Plant (247) | U32 32-bit x1000 |  | kvar |
| `PLANT_ESS_AVAILABLE_MAX_CHARGE_POWER` | 30047 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_ESS_AVAILABLE_MAX_DISCHARGE_POWER` | 30049 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_RUNNING_STATE` | 30051 | input | Plant (247) | U16 | Plant running state |  |
| `PLANT_GRID_SENSOR_PHASE_A_ACTIVE_POWER` | 30052 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_GRID_SENSOR_PHASE_B_ACTIVE_POWER` | 30054 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_GRID_SENSOR_PHASE_C_ACTIVE_POWER` | 30056 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_GRID_SENSOR_PHASE_A_REACTIVE_POWER` | 30058 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_GRID_SENSOR_PHASE_B_REACTIVE_POWER` | 30060 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_GRID_SENSOR_PHASE_C_REACTIVE_POWER` | 30062 | input | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_ESS_AVAILABLE_MAX_CHARGE_CAPACITY` | 30064 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_ESS_AVAILABLE_MAX_DISCHARGE_CAPACITY` | 30066 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_ESS_RATED_CHARGE_POWER` | 30068 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_ESS_RATED_DISCHARGE_POWER` | 30070 | input | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_ESS_RATED_ENERGY_CAPACITY` | 30083 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_ESS_CHARGE_CUTOFF_SOC` | 30085 | input | Plant (247) | U16 x10 |  | % |
| `PLANT_ESS_DISCHARGE_CUTOFF_SOC` | 30086 | input | Plant (247) | U16 x10 |  | % |
| `PLANT_ACCUMULATED_PV_ENERGY` | 30088 | input | Plant (247) | U64 64-bit x100 | Total PV generation | kWh |
| `PLANT_DAILY_CONSUMED_ENERGY` | 30092 | input | Plant (247) | U32 32-bit x100 | Total load daily consumption | kWh |
| `PLANT_ACCUMULATED_CONSUMED_ENERGY` | 30094 | input | Plant (247) | U64 64-bit x100 | Total load consumption | kWh |
| `PLANT_SMART_LOAD_1_TOTAL_CONSUMPTION` | 30098 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_2_TOTAL_CONSUMPTION` | 30100 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_3_TOTAL_CONSUMPTION` | 30102 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_4_TOTAL_CONSUMPTION` | 30104 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_5_TOTAL_CONSUMPTION` | 30106 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_6_TOTAL_CONSUMPTION` | 30108 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_7_TOTAL_CONSUMPTION` | 30110 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_8_TOTAL_CONSUMPTION` | 30112 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_9_TOTAL_CONSUMPTION` | 30114 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_10_TOTAL_CONSUMPTION` | 30116 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_11_TOTAL_CONSUMPTION` | 30118 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_12_TOTAL_CONSUMPTION` | 30120 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_13_TOTAL_CONSUMPTION` | 30122 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_14_TOTAL_CONSUMPTION` | 30124 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_15_TOTAL_CONSUMPTION` | 30126 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_16_TOTAL_CONSUMPTION` | 30128 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_17_TOTAL_CONSUMPTION` | 30130 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_18_TOTAL_CONSUMPTION` | 30132 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_19_TOTAL_CONSUMPTION` | 30134 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_20_TOTAL_CONSUMPTION` | 30136 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_21_TOTAL_CONSUMPTION` | 30138 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_22_TOTAL_CONSUMPTION` | 30140 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_23_TOTAL_CONSUMPTION` | 30142 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_24_TOTAL_CONSUMPTION` | 30144 | input | Plant (247) | U32 32-bit x100 |  | kWh |
| `PLANT_SMART_LOAD_1_POWER` | 30146 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_2_POWER` | 30148 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_3_POWER` | 30150 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_4_POWER` | 30152 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_5_POWER` | 30154 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_6_POWER` | 30156 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_7_POWER` | 30158 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_8_POWER` | 30160 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_9_POWER` | 30162 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_10_POWER` | 30164 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_11_POWER` | 30166 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_12_POWER` | 30168 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_13_POWER` | 30170 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_14_POWER` | 30172 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_15_POWER` | 30174 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_16_POWER` | 30176 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_17_POWER` | 30178 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_18_POWER` | 30180 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_19_POWER` | 30182 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_20_POWER` | 30184 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_21_POWER` | 30186 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_22_POWER` | 30188 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_23_POWER` | 30190 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_SMART_LOAD_24_POWER` | 30192 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_THIRD_PARTY_PV_POWER` | 30194 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_THIRD_PARTY_PV_TOTAL_ENERGY` | 30196 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_ACCUMULATED_BATTERY_CHARGE_ENERGY` | 30200 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_ACCUMULATED_BATTERY_DISCHARGE_ENERGY` | 30204 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_EVDC_CHARGE_ENERGY` | 30208 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_EVDC_DISCHARGE_ENERGY` | 30212 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_GRID_IMPORT_ENERGY` | 30216 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_GRID_EXPORT_ENERGY` | 30220 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_GENERATOR_ENERGY` | 30224 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_COMMON_LOADS_ENERGY` | 30228 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_EVAC_CHARGE_ENERGY` | 30232 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_SELF_PV_TOTAL_ENERGY` | 30236 | input | Plant (247) | U64 64-bit x100 |  | kWh |
| `PLANT_GRID_CODE_RATED_FREQUENCY` | 30276 | input | Plant (247) | U16 x100 |  | Hz |
| `PLANT_GRID_CODE_RATED_VOLTAGE` | 30277 | input | Plant (247) | U32 32-bit x100 |  | V |
| `PLANT_CURRENT_CONTROL_COMMAND` | 30279 | input | Plant (247) | U16 x100 |  | % |
| `PLANT_GENERAL_LOAD_POWER` | 30282 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_TOTAL_LOAD_POWER` | 30284 | input | Plant (247) | S32 32-bit x1000 |  | kW |
| `EMS_MODE_SETPOINT` | 40031 | holding | Plant (247) | U16 | EMS mode setpoint (write) |  |
| `MAX_CHARGE_LIMIT` | 40032 | holding | Plant (247) | U32 32-bit x1000 | Maximum charging power limit | kW |
| `MAX_DISCHARGE_LIMIT` | 40034 | holding | Plant (247) | U32 32-bit x1000 | Maximum discharging power limit | kW |

## Plant Holding (slave 247)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `PLANT_START_STOP` | 40000 | holding | Plant (247) | U16 | Plant start/stop (0=stop, 1=start) |  |
| `PLANT_ACTIVE_POWER_ADJUST` | 40001 | holding | Plant (247) | S32 32-bit x1000 |  | kW |
| `PLANT_REACTIVE_POWER_ADJUST` | 40003 | holding | Plant (247) | S32 32-bit x1000 |  | kvar |
| `PLANT_ACTIVE_POWER_PERCENT` | 40005 | holding | Plant (247) | S16 x100 |  | % |
| `PLANT_POWER_FACTOR_ADJUST` | 40007 | holding | Plant (247) | S16 x1000 |  |  |
| `PLANT_REMOTE_EMS_ENABLE` | 40029 | holding | Plant (247) | U16 |  |  |
| `PLANT_INDEPENDENT_PHASE_ENABLE` | 40030 | holding | Plant (247) | U16 |  |  |
| `PLANT_PV_MAX_POWER_LIMIT` | 40036 | holding | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_EXPORT_LIMIT` | 40038 | holding | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_IMPORT_LIMIT` | 40040 | holding | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_PCS_EXPORT_LIMIT` | 40042 | holding | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_PCS_IMPORT_LIMIT` | 40044 | holding | Plant (247) | U32 32-bit x1000 |  | kW |
| `PLANT_ESS_BACKUP_SOC` | 40046 | holding | Plant (247) | U16 x10 |  | % |
| `PLANT_ESS_CHARGE_CUTOFF_SOC_SET` | 40047 | holding | Plant (247) | U16 x10 |  | % |
| `PLANT_ESS_DISCHARGE_CUTOFF_SOC_SET` | 40048 | holding | Plant (247) | U16 x10 |  | % |
| `PLANT_ACTIVE_POWER_GRADIENT` | 40049 | holding | Plant (247) | U32 32-bit x1000 |  | %/s |
| `PLANT_LVRT_ENABLE` | 40051 | holding | Plant (247) | U16 | LVRT enable |  |
| `PLANT_LVRT_REACTIVE_COMP_FACTOR` | 40052 | holding | Plant (247) | U16 x100 | LVRT reactive power compensation factor |  |
| `PLANT_LVRT_NEG_SEQ_REACTIVE_FACTOR` | 40053 | holding | Plant (247) | U16 x100 | LVRT negative-sequence reactive compensation factor |  |
| `PLANT_LVRT_MODE` | 40054 | holding | Plant (247) | U16 | LVRT mode |  |
| `PLANT_LVRT_GRID_VOLTAGE_BLOCKING` | 40055 | holding | Plant (247) | U16 | LVRT grid voltage protection blocking |  |
| `PLANT_HVRT_ENABLE` | 40056 | holding | Plant (247) | U16 | HVRT enable |  |
| `PLANT_HVRT_REACTIVE_COMP_FACTOR` | 40057 | holding | Plant (247) | U16 x100 | HVRT reactive power compensation factor |  |
| `PLANT_HVRT_NEG_SEQ_REACTIVE_FACTOR` | 40058 | holding | Plant (247) | U16 x100 | HVRT negative-sequence reactive compensation factor |  |
| `PLANT_HVRT_MODE` | 40059 | holding | Plant (247) | U16 | HVRT mode |  |
| `PLANT_HVRT_GRID_VOLTAGE_BLOCKING` | 40060 | holding | Plant (247) | U16 | HVRT grid voltage protection blocking |  |
| `PLANT_OF_DERATING_ENABLE` | 40061 | holding | Plant (247) | U16 | Over-frequency derating enable |  |
| `PLANT_OF_DERATING_RAMP_RATE` | 40062 | holding | Plant (247) | U16 x100 | Over-frequency derating ramp rate | % |
| `PLANT_OF_DERATING_TRIGGER_FREQ` | 40063 | holding | Plant (247) | U16 x100 | Over-frequency derating trigger frequency | Hz |
| `PLANT_OF_DERATING_CUTOFF_FREQ` | 40064 | holding | Plant (247) | U16 x100 | Over-frequency derating cut-off frequency | Hz |
| `PLANT_UF_BOOST_ENABLE` | 40065 | holding | Plant (247) | U16 | Under-frequency power boost enable |  |
| `PLANT_UF_BOOST_RAMP_RATE` | 40066 | holding | Plant (247) | U16 x100 | Under-frequency boost ramp rate | % |
| `PLANT_UF_BOOST_TRIGGER_FREQ` | 40067 | holding | Plant (247) | U16 x100 | Under-frequency boost trigger frequency | Hz |
| `PLANT_UF_BOOST_CUTOFF_FREQ` | 40068 | holding | Plant (247) | U16 x100 | Under-frequency boost cut-off frequency | Hz |

## Inverter Input (slave 1)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `INVERTER_MODEL_TYPE` | 30500 | input | Inverter (1) | STRING 240-bit | Model type string |  |
| `INVERTER_SERIAL_NUMBER` | 30515 | input | Inverter (1) | STRING 160-bit |  |  |
| `INVERTER_FIRMWARE_VERSION` | 30525 | input | Inverter (1) | STRING 240-bit |  |  |
| `INVERTER_RATED_ACTIVE_POWER` | 30540 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_MAX_APPARENT_POWER` | 30542 | input | Inverter (1) | U32 32-bit x1000 |  | kVA |
| `INVERTER_MAX_ACTIVE_POWER` | 30544 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_MAX_ABSORPTION_POWER` | 30546 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_RATED_BATTERY_CAPACITY` | 30548 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_ESS_RATED_CHARGE_POWER` | 30550 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_ESS_RATED_DISCHARGE_POWER` | 30552 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_ESS_DAILY_CHARGE_ENERGY` | 30566 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_ESS_ACCUMULATED_CHARGE_ENERGY` | 30568 | input | Inverter (1) | U64 64-bit x100 |  | kWh |
| `INVERTER_ESS_DAILY_DISCHARGE_ENERGY` | 30572 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_ESS_ACCUMULATED_DISCHARGE_ENERGY` | 30574 | input | Inverter (1) | U64 64-bit x100 |  | kWh |
| `INVERTER_RUNNING_STATE` | 30578 | input | Inverter (1) | U16 | Inverter running state |  |
| `INVERTER_BATTERY_SOC` | 30601 | input | Inverter (1) | U16 x10 | Inverter battery SOC | % |
| `INVERTER_BATTERY_SOH` | 30602 | input | Inverter (1) | U16 x10 | Inverter battery SOH | % |
| `INVERTER_MAX_ACTIVE_ADJUST` | 30579 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_MIN_ACTIVE_ADJUST` | 30581 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_MAX_REACTIVE_ADJUST_FEED` | 30583 | input | Inverter (1) | U32 32-bit x1000 |  | kvar |
| `INVERTER_MAX_REACTIVE_ADJUST_ABSORB` | 30585 | input | Inverter (1) | U32 32-bit x1000 |  | kvar |
| `INVERTER_ACTIVE_POWER` | 30587 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_REACTIVE_POWER` | 30589 | input | Inverter (1) | S32 32-bit x1000 |  | kvar |
| `INVERTER_ESS_MAX_CHARGE_POWER` | 30591 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_ESS_MAX_DISCHARGE_POWER` | 30593 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `INVERTER_ESS_AVAILABLE_CHARGE_ENERGY` | 30595 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_ESS_AVAILABLE_DISCHARGE_ENERGY` | 30597 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_ESS_CHARGE_DISCHARGE_POWER` | 30599 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_ESS_AVG_CELL_TEMP` | 30603 | input | Inverter (1) | S16 x10 |  | C |
| `INVERTER_ESS_AVG_CELL_VOLTAGE` | 30604 | input | Inverter (1) | U16 x1000 |  | V |
| `INVERTER_ESS_MAX_CELL_TEMP` | 30620 | input | Inverter (1) | S16 x10 |  | C |
| `INVERTER_ESS_MIN_CELL_TEMP` | 30621 | input | Inverter (1) | S16 x10 |  | C |
| `INVERTER_ESS_MAX_CELL_VOLTAGE` | 30622 | input | Inverter (1) | U16 x1000 |  | V |
| `INVERTER_ESS_MIN_CELL_VOLTAGE` | 30623 | input | Inverter (1) | U16 x1000 |  | V |
| `INVERTER_ALARM1` | 30605 | input | Inverter (1) | U16 | Inverter Alarm1 (PCS alarm codes) |  |
| `INVERTER_ALARM2` | 30606 | input | Inverter (1) | U16 |  |  |
| `INVERTER_ALARM3` | 30607 | input | Inverter (1) | U16 |  |  |
| `INVERTER_ALARM4` | 30608 | input | Inverter (1) | U16 |  |  |
| `INVERTER_ALARM5` | 30609 | input | Inverter (1) | U16 |  |  |
| `INVERTER_ACTIVE_ADJUST_FEEDBACK` | 30613 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_REACTIVE_ADJUST_FEEDBACK` | 30615 | input | Inverter (1) | S32 32-bit x1000 |  | kvar |
| `INVERTER_ACTIVE_PERCENT_FEEDBACK` | 30617 | input | Inverter (1) | S16 x100 |  | % |
| `INVERTER_REACTIVE_PERCENT_FEEDBACK` | 30618 | input | Inverter (1) | S16 x100 |  | % |
| `INVERTER_POWER_FACTOR_FEEDBACK` | 30619 | input | Inverter (1) | S16 x1000 |  |  |
| `INVERTER_RATED_GRID_VOLTAGE` | 31000 | input | Inverter (1) | U16 x10 |  | V |
| `INVERTER_RATED_GRID_FREQUENCY` | 31001 | input | Inverter (1) | U16 x100 |  | Hz |
| `INVERTER_GRID_FREQUENCY` | 31002 | input | Inverter (1) | U16 x100 |  | Hz |
| `INVERTER_PCS_INTERNAL_TEMP` | 31003 | input | Inverter (1) | S16 x10 |  | C |
| `INVERTER_OUTPUT_TYPE` | 31004 | input | Inverter (1) | U16 | Output type (0=L/N, 1=L1/L2/L3, 2=L1/L2/L3/N, 3=L1/L2/N) |  |
| `INVERTER_AB_LINE_VOLTAGE` | 31005 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_BC_LINE_VOLTAGE` | 31007 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_CA_LINE_VOLTAGE` | 31009 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_PHASE_A_VOLTAGE` | 31011 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_PHASE_B_VOLTAGE` | 31013 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_PHASE_C_VOLTAGE` | 31015 | input | Inverter (1) | U32 32-bit x100 |  | V |
| `INVERTER_PHASE_A_CURRENT` | 31017 | input | Inverter (1) | S32 32-bit x100 |  | A |
| `INVERTER_PHASE_B_CURRENT` | 31019 | input | Inverter (1) | S32 32-bit x100 |  | A |
| `INVERTER_PHASE_C_CURRENT` | 31021 | input | Inverter (1) | S32 32-bit x100 |  | A |
| `INVERTER_POWER_FACTOR` | 31023 | input | Inverter (1) | S16 x1000 |  |  |
| `INVERTER_PACK_COUNT` | 31024 | input | Inverter (1) | U16 |  |  |
| `INVERTER_PV_STRING_COUNT` | 31025 | input | Inverter (1) | U16 |  |  |
| `INVERTER_MPPT_COUNT` | 31026 | input | Inverter (1) | U16 |  |  |
| `INVERTER_PV1_VOLTAGE` | 31027 | input | Inverter (1) | U16 x10 | PV string 1 voltage | V |
| `INVERTER_PV1_CURRENT` | 31028 | input | Inverter (1) | S16 x100 | PV string 1 current | A |
| `INVERTER_PV2_VOLTAGE` | 31029 | input | Inverter (1) | U16 x10 | PV string 2 voltage | V |
| `INVERTER_PV2_CURRENT` | 31030 | input | Inverter (1) | S16 x100 | PV string 2 current | A |
| `INVERTER_PV3_VOLTAGE` | 31031 | input | Inverter (1) | U16 x10 | PV string 3 voltage | V |
| `INVERTER_PV3_CURRENT` | 31032 | input | Inverter (1) | S16 x100 | PV string 3 current | A |
| `INVERTER_PV4_VOLTAGE` | 31033 | input | Inverter (1) | U16 x10 | PV string 4 voltage | V |
| `INVERTER_PV4_CURRENT` | 31034 | input | Inverter (1) | S16 x100 | PV string 4 current | A |
| `INVERTER_PV_POWER` | 31035 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `INVERTER_INSULATION_RESISTANCE` | 31037 | input | Inverter (1) | U16 x1000 |  | Mohm |
| `INVERTER_STARTUP_TIME` | 31038 | input | Inverter (1) | U32 32-bit |  | s |
| `INVERTER_SHUTDOWN_TIME` | 31040 | input | Inverter (1) | U32 32-bit |  | s |
| `INVERTER_PV5_VOLTAGE` | 31042 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV5_CURRENT` | 31043 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV6_VOLTAGE` | 31044 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV6_CURRENT` | 31045 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV7_VOLTAGE` | 31046 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV7_CURRENT` | 31047 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV8_VOLTAGE` | 31048 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV8_CURRENT` | 31049 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV9_VOLTAGE` | 31050 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV9_CURRENT` | 31051 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV10_VOLTAGE` | 31052 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV10_CURRENT` | 31053 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV11_VOLTAGE` | 31054 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV11_CURRENT` | 31055 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV12_VOLTAGE` | 31056 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV12_CURRENT` | 31057 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV13_VOLTAGE` | 31058 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV13_CURRENT` | 31059 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV14_VOLTAGE` | 31060 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV14_CURRENT` | 31061 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV15_VOLTAGE` | 31062 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV15_CURRENT` | 31063 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV16_VOLTAGE` | 31064 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV16_CURRENT` | 31065 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV17_VOLTAGE` | 31066 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV17_CURRENT` | 31067 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV18_VOLTAGE` | 31068 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV18_CURRENT` | 31069 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV19_VOLTAGE` | 31070 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV19_CURRENT` | 31071 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV20_VOLTAGE` | 31072 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV20_CURRENT` | 31073 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV21_VOLTAGE` | 31074 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV21_CURRENT` | 31075 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV22_VOLTAGE` | 31076 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV22_CURRENT` | 31077 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV23_VOLTAGE` | 31078 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV23_CURRENT` | 31079 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV24_VOLTAGE` | 31080 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV24_CURRENT` | 31081 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV25_VOLTAGE` | 31082 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV25_CURRENT` | 31083 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV26_VOLTAGE` | 31084 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV26_CURRENT` | 31085 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV27_VOLTAGE` | 31086 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV27_CURRENT` | 31087 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV28_VOLTAGE` | 31088 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV28_CURRENT` | 31089 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV29_VOLTAGE` | 31090 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV29_CURRENT` | 31091 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV30_VOLTAGE` | 31092 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV30_CURRENT` | 31093 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV31_VOLTAGE` | 31094 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV31_CURRENT` | 31095 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV32_VOLTAGE` | 31096 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV32_CURRENT` | 31097 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV33_VOLTAGE` | 31098 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV33_CURRENT` | 31099 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV34_VOLTAGE` | 31100 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV34_CURRENT` | 31101 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV35_VOLTAGE` | 31102 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV35_CURRENT` | 31103 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV36_VOLTAGE` | 31104 | input | Inverter (1) | S16 x10 |  | V |
| `INVERTER_PV36_CURRENT` | 31105 | input | Inverter (1) | S16 x100 |  | A |
| `INVERTER_PV_DAILY_GENERATION` | 31509 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `INVERTER_PV_TOTAL_GENERATION` | 31511 | input | Inverter (1) | U32 32-bit x100 |  | kWh |

## Inverter Holding (slave 1)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `INVERTER_START_STOP` | 40500 | holding | Inverter (1) | U16 | Inverter start/stop (0=stop, 1=start) |  |

## DC Charger Input (slave 1)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `DC_CHARGER_VOLTAGE` | 31500 | input | Inverter (1) | U16 x10 | DC charger vehicle battery voltage | V |
| `DC_CHARGER_CURRENT` | 31501 | input | Inverter (1) | U16 x10 | DC charger charging current | A |
| `DC_CHARGER_POWER` | 31502 | input | Inverter (1) | S32 32-bit x1000 | DC charger output power | kW |
| `DC_CHARGER_VEHICLE_SOC` | 31504 | input | Inverter (1) | U16 x10 | EV vehicle SOC | % |
| `DC_CHARGER_CURRENT_CHARGING_CAPACITY` | 31505 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `DC_CHARGER_CURRENT_CHARGING_DURATION` | 31507 | input | Inverter (1) | U32 32-bit |  | s |
| `DC_CHARGER_STATUS` | 31513 | input | Inverter (1) | U16 | DC charger operating status |  |
| `DC_CHARGER_START_STOP` | 41000 | holding | Inverter (1) | U16 | DC charger start/stop (0=start, 1=stop) |  |

## AC Charger Input (slave 1)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `AC_CHARGER_SYSTEM_STATE` | 32000 | input | Inverter (1) | U16 | AC charger system state (Appendix 7) |  |
| `AC_CHARGER_TOTAL_ENERGY` | 32001 | input | Inverter (1) | U32 32-bit x100 |  | kWh |
| `AC_CHARGER_CHARGING_POWER` | 32003 | input | Inverter (1) | S32 32-bit x1000 |  | kW |
| `AC_CHARGER_RATED_POWER` | 32005 | input | Inverter (1) | U32 32-bit x1000 |  | kW |
| `AC_CHARGER_RATED_CURRENT` | 32007 | input | Inverter (1) | S32 32-bit x100 |  | A |
| `AC_CHARGER_RATED_VOLTAGE` | 32009 | input | Inverter (1) | U16 x10 |  | V |
| `AC_CHARGER_INPUT_BREAKER_CURRENT` | 32010 | input | Inverter (1) | S32 32-bit x100 |  | A |
| `AC_CHARGER_ALARM1` | 32012 | input | Inverter (1) | U16 | AC charger Alarm1 (Appendix 8) |  |
| `AC_CHARGER_ALARM2` | 32013 | input | Inverter (1) | U16 | AC charger Alarm2 (Appendix 9) |  |
| `AC_CHARGER_ALARM3` | 32014 | input | Inverter (1) | U16 | AC charger Alarm3 (Appendix 10) |  |

## AC Charger Holding (slave 1)

| Key | Addr | Type | Slave | Data Type / Gain | Description | Unit |
|-----|------|------|-------|------------------|-------------|------|
| `AC_CHARGER_START_STOP` | 42000 | holding | Inverter (1) | U16 | AC charger start/stop (0=start, 1=stop) |  |
| `AC_CHARGER_OUTPUT_CURRENT` | 42001 | holding | Inverter (1) | U32 32-bit x100 |  | A |

---

# Enum Maps

### EMS Modes (register 30003)

| Value | Label |
|-------|-------|
| 0 | Maximum Self Consumption |
| 1 | AI Mode |
| 2 | TOU (Time of Use) |
| 5 | Full Feed-In to Grid |
| 6 | VPP Scheduling |
| 7 | Remote EMS |
| 9 | Custom |


### Grid Statuses (register 30009)

| Value | Label |
|-------|-------|
| 0 | On Grid |
| 1 | Off Grid (Auto) |
| 2 | Off Grid (Manual) |


### Running States

| Value | Label |
|-------|-------|
| 0 | Standby |
| 1 | Running |
| 2 | Fault |
| 3 | Shutdown |
| 7 | Environmental Abnormality |


### Remote EMS Modes (EMS mode 7 sub-modes)

| Value | Label |
|-------|-------|
| 0 | PCS Remote Control |
| 1 | Standby |
| 2 | Maximum Self-Consumption |
| 3 | Command Charging (Grid First) |
| 4 | Command Charging (PV First) |
| 5 | Command Discharging (PV First) |
| 6 | Command Discharging (ESS First) |


### AC Charger States

| Value | Label |
|-------|-------|
| 0 | System Init |
| 1 | A1/A2 (Standby) |
| 2 | B1 (Pre-charge) |
| 3 | B2 (Connection Check) |
| 4 | C1 (Charging) |
| 5 | C2 (Charging) |
| 6 | F (Fault) |
| 7 | E (Error) |


### DC Charger Statuses (V2.7 legacy)

| Value | Label |
|-------|-------|
| 0 | System Init |
| 1 | Standby (A1/A2) |
| 2 | Pre-charge (B1) |
| 3 | Connection Check (B2) |
| 4 | Charging (C1) |
| 5 | Charging (C2) |
| 6 | Fault (F) |


### DC Charger Running State (V2.8)

| Value | Label |
|-------|-------|
| 0 | Idle |
| 1 | Occupied |
| 2 | Preparing (Comm) |
| 3 | Charging |
| 4 | Fault |
| 5 | Scheduled |
| 6 | Ended |
| 7 | Unavailable |
| 8 | Discharging |
| 9 | Alarm |
| 10 | Preparing (Insulation) |


### Output Types (register 31004)

| Value | Label |
|-------|-------|
| 0 | L/N |
| 1 | L1/L2/L3 |
| 2 | L1/L2/L3/N |
| 3 | L1/L2/N |


## Alarm Code Bit-field Maps

### PCS Alarm Codes (Alarm1)

| Value | Label |
|-------|-------|
| 0 | Software version mismatch |
| 1 | Low insulation resistance |
| 2 | Over-temperature |
| 3 | Equipment fault |
| 4 | System grounding fault |
| 5 | PV string over-voltage |
| 6 | PV string reversely connected |
| 7 | PV string back-filling |
| 8 | AFCI fault |
| 9 | Grid power outage |
| 10 | Grid over-voltage |
| 11 | Grid under-voltage |
| 12 | Grid over-frequency |
| 13 | Grid under-frequency |
| 14 | Grid voltage imbalance |
| 15 | DC component out of limit |


### PCS Alarm Codes 2 (Alarm2)

| Value | Label |
|-------|-------|
| 0 | Leak current out of limit |
| 1 | Communication abnormal |
| 2 | System internal protection |
| 3 | AFCI self-check circuit fault |
| 4 | Off-grid protection |
| 5 | Manual operation protection |
| 7 | Abnormal phase sequence |
| 8 | Short circuit to PE |
| 9 | Soft start failure |


### ESS Alarm Codes (Alarm3)

| Value | Label |
|-------|-------|
| 0 | Software version mismatch |
| 1 | Low insulation resistance to ground |
| 2 | Temperature too high |
| 3 | Equipment fault |
| 4 | Under-temperature |
| 5 | Internal protection |
| 6 | Thermal runaway |


### Gateway Alarm Codes (Alarm4)

| Value | Label |
|-------|-------|
| 0 | Software version mismatch |
| 1 | Temperature too high |
| 2 | Equipment fault |
| 3 | Excessive leakage current in off-grid output |
| 4 | N line grounding fault |
| 5 | Abnormal phase sequence of grid wiring |
| 6 | Abnormal phase sequence of inverter wiring |
| 7 | Grid phase loss |


### DC Charger Alarm Codes (Alarm5)

| Value | Label |
|-------|-------|
| 0 | Software version mismatch |
| 1 | Low insulation resistance to ground |
| 2 | Over-temperature |
| 3 | Equipment fault |
| 4 | Charging fault |
| 5 | Equipment protection |


### Plant Alarm Codes 6 (Alarm6)

| Value | Label |
|-------|-------|
| 0 | Gateway communication abnormal |
| 1 | Meter communication abnormal |
| 2 | AC power sensor communication abnormal |
| 6 | Hard protection against grid-feed power limit exceedance |
| 8 | Generator failure to start |
| 10 | CLS fault |


### Plant Alarm Codes 7 (Alarm7)

| Value | Label |
|-------|-------|
| 0 | OVGR fault |
| 1 | RPR fault |


### AC Charger Alarm Codes 1 (Appendix 8)

| Value | Label |
|-------|-------|
| 0 | Grid overvoltage |
| 1 | Grid undervoltage |
| 2 | Overload |
| 3 | Short circuit |
| 4 | Charging output overcurrent |
| 5 | Leak current out of limit |
| 6 | Grounding fault |
| 7 | Abnormal phase sequence of grid wiring |
| 8 | PEN Fault |


### AC Charger Alarm Codes 2 (Appendix 9)

| Value | Label |
|-------|-------|
| 0 | Leak current detection circuit fault |
| 1 | Relay stuck |
| 2 | Pilot circuit fault |
| 3 | Auxiliary power supply module fault |
| 4 | Electric lock fault |
| 5 | Lamp panel communication fault |


### AC Charger Alarm Codes 3 (Appendix 10)

| Value | Label |
|-------|-------|
| 0 | Too high internal temperature |
| 1 | Charging cable fault |
| 2 | Meter communication fault |


---

Generated from registry.ts — 314 register definitions, 18 enum maps.