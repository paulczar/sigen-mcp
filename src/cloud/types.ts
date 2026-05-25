/** Response from device/owner/station/home */
export interface StationInfo {
  stationId: string;
  hasPv: boolean;
  hasEv: boolean;
  hasAcCharger: boolean;
  acSnList: string[];
  dcSnList: string[];
  onGrid: boolean;
  pvCapacity: number;
  batteryCapacity: number;
}

/** Response from device/sigen/station/energyflow */
export interface EnergyFlow {
  pvPower?: number;
  loadPower?: number;
  gridPower?: number;
  batteryPower?: number;
  evPower?: number;
  heatPumpPower?: number;
  acPower?: number;
  buySellPower?: number;
  batterySoc?: number;
  pvDayNrg?: number;
  /** Charging/discharging */
  esChargeDischargePower?: number;
  [key: string]: unknown;
}

/** Mode entry from device/energy-profile/mode/all/{stationId} */
export interface DefaultWorkingMode {
  label: string;
  value: string;
}

export interface EnergyProfileItem {
  name: string;
  profileId: number;
  value: number;
}

export interface OperationalModes {
  defaultWorkingModes: DefaultWorkingMode[];
  energyProfileItems: EnergyProfileItem[];
}

/** Response from device/energy-profile/mode/current/{stationId} */
export interface CurrentMode {
  currentMode: number;
  currentProfileId: number;
}

/** Smart load entry from device/system/device/systemDevice/card */
export interface SmartLoad {
  path?: number;
  name?: string;
  type?: number;
  status?: number;
  todayConsumption?: string;
  monthConsumption?: string;
  lifetimeConsumption?: string;
  [key: string]: unknown;
}

/** History entry from openapi/systems/{id}/history */
export interface HistoryEntry {
  dataTime: string;
  pvTotalPower?: number;
  loadPower?: number;
  toGridPower?: number;
  fromGridPower?: number;
  esChargePower?: number;
  esDischargePower?: number;
  batSoc?: number;
  powerGeneration?: number;
  powerUse?: number;
  [key: string]: unknown;
}

export interface HistoryResponse {
  itemList: HistoryEntry[];
  [key: string]: unknown;
}

/** Alarm page entry from device/alarm/page */
export interface AlarmEntry {
  id?: number;
  alarmCode?: string;
  alarmDesc?: string;
  alarmTime?: string;
  alarmType?: number;
  [key: string]: unknown;
}

export interface AlarmPage {
  records: AlarmEntry[];
  total: number;
  current: number;
  size: number;
  [key: string]: unknown;
}
