// Centralized API-related types

export type DeviceType = 'POWER_MONITOR' | 'SWITCHABLE_APPLIANCE';

export interface Device {
  id: number;
  name: string;
  mqttPrefix: string;
  deviceType: DeviceType;
  priority: number;
  wattage: number;
  username: string;
  isOnline?: boolean;
  isOn?: boolean;
  currentPower?: number;
  voltage?: number;
  temperature?: number;
}

export interface DeviceRequestDTO {
  name: string;
  mqttPrefix: string;
  deviceType: DeviceType;
  priority: number;
  wattage: number;
  preventDowntime: boolean;
  maxDowntimeMinutes: number;
  minUptimeMinutes: number;
}

export interface DeviceResponseDTO {
  id: number;
  name: string;
  mqttPrefix: string;
  deviceType: DeviceType;
  priority: number;
  wattage: number;
  username: string;
  preventDowntime: boolean;
  maxDowntimeMinutes: number;
  minUptimeMinutes: number;
}

export interface DeviceStatus {
  id: number;
  source: string;
  output: boolean;
  apower: number;
  voltage: number;
  current: number;
  aenergy: {
    total: number;
    by_minute: number[];
    minute_ts: number;
  };
  temperature: { tC: number; tF: number };
}

export interface DeviceOfflineStatus {
  online: false;
}

export type DeviceStatusData = DeviceStatus | DeviceOfflineStatus;

export type AllStatusesResponse = Record<string, DeviceStatusData>;

export interface DeviceStatusUpdate {
  deviceId: number;
  username: string;
  isOnline?: boolean;
  statusJson?: DeviceStatus;
}

export interface SystemSettingsDto {
  id?: number;
  powerLimitWatts: number;
  powerOnMarginWatts: number;
  overloadCooldownSeconds: number;
}
