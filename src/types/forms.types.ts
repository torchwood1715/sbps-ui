import type {DeviceProvider, DeviceType} from './api.types';

export interface DeviceFormData {
    name: string;
    mqttSuffix?: string; // used for Create page; settings uses separate state
    deviceType: DeviceType;
    provider: DeviceProvider;
    isNonEssential: boolean;
    priority: number;
    wattage: number;
    preventDowntime: boolean;
    maxDowntimeMinutes: number;
    minUptimeMinutes: number;
}
