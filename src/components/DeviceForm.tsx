import React from 'react';
import {CardContent} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import type {DeviceProvider, DeviceType} from '../types/api.types';
import type {DeviceFormData} from '../types/forms.types';
import {ExternalLink} from 'lucide-react';

export interface DeviceFormProps {
    username?: string | null;
    formData: DeviceFormData;
    onFieldChange: (field: keyof DeviceFormData, value: string | number | DeviceProvider) => void;
    onCheckboxChange: (field: 'preventDowntime' | 'nonEssential', value: boolean) => void;
    isMonitor: boolean;
    hasMonitor: boolean;
    hasGridMonitor: boolean;
    mqttSuffix?: string; // used on edit page as separate state
    setMqttSuffix?: (value: string) => void;
}

const PROVIDER_CONFIG_URLS: Record<DeviceProvider, string> = {
    SHELLY: 'https://control.shelly.cloud/',
    TASMOTA: 'https://tasmota.github.io/docs/MQTT/',
};

export const DeviceForm: React.FC<DeviceFormProps> = ({
                                                          username,
                                                          formData,
                                                          onFieldChange,
                                                          onCheckboxChange,
                                                          isMonitor,
                                                          hasMonitor,
                                                          hasGridMonitor,
                                                          mqttSuffix,
                                                          setMqttSuffix,
                                                      }) => {
    return (
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Назва пристрою</Label>
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
                    <Label htmlFor="mqttSuffix">ID</Label>
                    <div className="flex items-center">
            <span
                className="inline-flex items-center px-3 h-10 bg-muted border border-r-0 border-input rounded-l-md text-muted-foreground">
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
                <Label htmlFor="provider">Провайдер</Label>
                <Select
                    value={formData.provider}
                    onValueChange={(value: DeviceProvider) => onFieldChange('provider', value)}
                    defaultValue={formData.provider}
                >
                    <SelectTrigger id="provider">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SHELLY">Shelly</SelectItem>
                        <SelectItem value="TASMOTA">Tasmota</SelectItem>
                    </SelectContent>
                </Select>
                <a
                    href={PROVIDER_CONFIG_URLS[formData.provider]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary underline flex items-center gap-1"
                >
                    <ExternalLink className="h-3 w-3"/>
                    {formData.provider === 'SHELLY'
                        ? 'Посилання на конфігурацію Shelly'
                        : 'Документація Tasmota MQTT'}
                </a>
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Тип</Label>
                <Select
                    value={formData.deviceType}
                    onValueChange={(value: DeviceType) => onFieldChange('deviceType', value)}
                >
                    <SelectTrigger id="type">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="POWER_MONITOR"
                                    disabled={hasMonitor && formData.deviceType !== 'POWER_MONITOR'}>
                            Монітор потужності (Система)
                            {hasMonitor && formData.deviceType !== 'POWER_MONITOR' && ' (Вже існує)'}
                        </SelectItem>
                        <SelectItem value="SWITCHABLE_APPLIANCE">Керований пристрій (Розетка)</SelectItem>
                        <SelectItem
                            value="GRID_MONITOR"
                            disabled={hasGridMonitor && formData.deviceType !== 'GRID_MONITOR'}
                        >
                            Монітор мережі (Вхід)
                            {hasGridMonitor && formData.deviceType !== 'GRID_MONITOR' && ' (Вже існує)'}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="wattage" className={isMonitor ? 'text-muted-foreground' : ''}>
                    Потужність (Вт)
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
                    Пріоритет (0=Високий, 10=Низький)
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
                <p className="text-sm text-muted-foreground">Пристрої з вищим пріоритетом будуть вимкнені останніми.</p>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-4">
                <Checkbox
                    id="nonEssential"
                    checked={!isMonitor && formData.nonEssential}
                    onCheckedChange={(checked) => onCheckboxChange('nonEssential', !!checked)}
                    disabled={isMonitor}
                />
                <div className="space-y-1 leading-none">
                    <Label htmlFor="nonEssential" className={isMonitor ? 'text-muted-foreground' : ''}>
                        Не життєво важливий пристрій
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Пристрій буде примусово вимкнено під час блекауту або у режимі "Відпустка".
                    </p>
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="preventDowntime"
                        checked={!isMonitor && formData.preventDowntime}
                        onCheckedChange={(checked) => onCheckboxChange('preventDowntime', !!checked)}
                        disabled={isMonitor}
                    />
                    <div className="space-y-1 leading-none">
                        <Label htmlFor="preventDowntime" className={isMonitor ? 'text-muted-foreground' : ''}>
                            Запобігати простою (напр. холодильник)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Система спробує увімкнути пристрій, якщо він був вимкнений довше заданого часу.
                        </p>
                    </div>
                </div>

                {formData.preventDowntime && !isMonitor && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxDowntimeMinutes">Макс. час простою (хв)</Label>
                            <Input
                                id="maxDowntimeMinutes"
                                type="number"
                                value={formData.maxDowntimeMinutes}
                                onChange={(e) => onFieldChange('maxDowntimeMinutes', Number(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minUptimeMinutes">Мін. час роботи (хв)</Label>
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
