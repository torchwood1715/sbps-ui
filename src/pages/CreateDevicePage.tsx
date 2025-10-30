import React, {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";

type DeviceType = 'POWER_MONITOR' | 'SWITCHABLE_APPLIANCE';

interface DeviceFormData {
    name: string;
    mqttSuffix: string;
    deviceType: DeviceType;
    priority: number;
    wattage: number;
    // preventDowntime: boolean;
}

export const CreateDevicePage = () => {
    const {user} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasMonitor = location.state?.hasMonitor ?? false;
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<DeviceFormData>({
        name: '',
        mqttSuffix: '',
        deviceType: 'SWITCHABLE_APPLIANCE',
        priority: 0,
        wattage: 100,
    });

    const isMonitor = formData.deviceType === 'POWER_MONITOR';

    const handleChange = (field: keyof Omit<DeviceFormData, 'deviceType'>, value: string | number) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const deviceData = {
            name: formData.name,
            mqttPrefix: `${user?.username}-${formData.mqttSuffix}`,
            deviceType: formData.deviceType,
            priority: formData.priority,
            wattage: isMonitor ? 0 : formData.wattage,
        };

        try {
            await apiClient.post('/devices', deviceData);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to create device", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Add New Device</CardTitle>
                </CardHeader>
                <form onSubmit={handleSave}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Device Name</Label>
                            <Input id="name" value={formData.name}
                                   onChange={(e) => handleChange('name', e.target.value)} required/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mqttSuffix">Device ID (Suffix)</Label>
                            <div className="flex items-center">
                <span
                    className="inline-flex items-center px-3 h-10 bg-muted border border-r-0 border-input rounded-l-md text-muted-foreground">
                  {user?.username}-
                </span>
                                <Input
                                    id="mqttSuffix"
                                    value={formData.mqttSuffix}
                                    onChange={(e) => handleChange('mqttSuffix', e.target.value)}
                                    className="rounded-l-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.deviceType}
                                onValueChange={(value: DeviceType) => setFormData(p => ({...p, deviceType: value}))}
                                defaultValue={hasMonitor ? 'SWITCHABLE_APPLIANCE' : formData.deviceType}
                            >
                                <SelectTrigger id="type"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="POWER_MONITOR" disabled={hasMonitor}>
                                        Power Monitor {hasMonitor && "(Already exists)"}
                                    </SelectItem>
                                    <SelectItem value="SWITCHABLE_APPLIANCE">Switchable Appliance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wattage" className={isMonitor ? "text-muted-foreground" : ""}>
                                Wattage (W)
                            </Label>
                            <Input
                                id="wattage"
                                type="number"
                                value={isMonitor ? 0 : formData.wattage}
                                onChange={(e) => handleChange('wattage', Number(e.target.value))}
                                disabled={isMonitor}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="downtime" disabled/>
                            <Label
                                htmlFor="downtime"
                                className="text-muted-foreground cursor-not-allowed"
                            >
                                Prevent Downtime (API not ready)
                            </Label>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Add Device'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};