import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { DeviceType } from '../types/api.types';
import type { DeviceFormData } from '../types/forms.types';

export interface DeviceFormProps {
  username?: string | null;
  formData: DeviceFormData;
  onFieldChange: (field: keyof DeviceFormData, value: string | number) => void;
  onCheckboxChange: (field: 'preventDowntime', value: boolean) => void;
  isMonitor: boolean;
  hasMonitor: boolean;
  mqttSuffix?: string; // used on edit page as separate state
  setMqttSuffix?: (value: string) => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  username,
  formData,
  onFieldChange,
  onCheckboxChange,
  isMonitor,
  hasMonitor,
  mqttSuffix,
  setMqttSuffix,
}) => {
  return (
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Device Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          required
        />
      </div>

      {/* MQTT suffix input - shown when either mqttSuffix prop/state is provided (edit), or when formData has mqttSuffix (create) */}
      {(typeof mqttSuffix !== 'undefined' || typeof formData.mqttSuffix !== 'undefined') && (
        <div className="space-y-2">
          <Label htmlFor="mqttSuffix">Device ID (Suffix)</Label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 h-10 bg-muted border border-r-0 border-input rounded-l-md text-muted-foreground">
              {username}-
            </span>
            <Input
              id="mqttSuffix"
              value={typeof mqttSuffix !== 'undefined' ? mqttSuffix : (formData.mqttSuffix || '')}
              onChange={(e) =>
                typeof setMqttSuffix === 'function'
                  ? setMqttSuffix(e.target.value)
                  : onFieldChange('mqttSuffix', e.target.value)
              }
              className="rounded-l-none"
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.deviceType}
          onValueChange={(value: DeviceType) => onFieldChange('deviceType', value)}
          defaultValue={hasMonitor ? 'SWITCHABLE_APPLIANCE' : formData.deviceType}
        >
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POWER_MONITOR" disabled={hasMonitor && formData.deviceType !== 'POWER_MONITOR'}>
              Power Monitor {hasMonitor && formData.deviceType !== 'POWER_MONITOR' && '(Already exists)'}
            </SelectItem>
            <SelectItem value="SWITCHABLE_APPLIANCE">Switchable Appliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wattage" className={isMonitor ? 'text-muted-foreground' : ''}>
          Wattage (W)
        </Label>
        <Input
          id="wattage"
          type="number"
          value={isMonitor ? 0 : formData.wattage}
          onChange={(e) => onFieldChange('wattage', Number(e.target.value))}
          disabled={isMonitor}
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority" className={isMonitor ? 'text-muted-foreground' : ''}>
          Priority (0=High, 10=Low)
        </Label>
        <Input
          id="priority"
          type="number"
          value={isMonitor ? 0 : formData.priority}
          onChange={(e) => onFieldChange('priority', Number(e.target.value))}
          disabled={isMonitor}
          min="0"
          max="10"
          step="1"
        />
        <p className="text-sm text-muted-foreground">Devices with higher priority will be turned off last.</p>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="preventDowntime"
            checked={!isMonitor && formData.preventDowntime}
            onCheckedChange={(checked) => onCheckboxChange('preventDowntime', !!checked)}
            disabled={isMonitor}
          />
          <Label htmlFor="preventDowntime" className={isMonitor ? 'text-muted-foreground' : ''}>
            Prevent Downtime (e.g., for Refrigerator)
          </Label>
        </div>

        {formData.preventDowntime && !isMonitor && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="maxDowntimeMinutes">Max Downtime (min)</Label>
              <Input
                id="maxDowntimeMinutes"
                type="number"
                value={formData.maxDowntimeMinutes}
                onChange={(e) => onFieldChange('maxDowntimeMinutes', Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minUptimeMinutes">Min Uptime (min)</Label>
              <Input
                id="minUptimeMinutes"
                type="number"
                value={formData.minUptimeMinutes}
                onChange={(e) => onFieldChange('minUptimeMinutes', Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default DeviceForm;
