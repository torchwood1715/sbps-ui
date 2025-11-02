import type { DeviceType } from './api.types';

export interface DeviceFormData {
  name: string;
  mqttSuffix?: string; // used for Create page; settings uses separate state
  deviceType: DeviceType;
  priority: number;
  wattage: number;
  preventDowntime: boolean;
  maxDowntimeMinutes: number;
  minUptimeMinutes: number;
}
