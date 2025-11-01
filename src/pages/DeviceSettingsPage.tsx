import {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import apiClient from '../api/apiClient';
import {useAuth} from '../hooks/useAuth';
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select";
import {Button} from "../components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";

type DeviceType = 'POWER_MONITOR' | 'SWITCHABLE_APPLIANCE';

interface DeviceResponseDTO {
    id: number;
    name: string;
    mqttPrefix: string;
    deviceType: DeviceType;
    priority: number;
    wattage: number;
    username: string;
}

interface DeviceRequestDTO {
    name: string;
    mqttPrefix: string;
    deviceType: DeviceType;
    priority: number;
    wattage: number;
}

interface DeviceFormData {
    name: string;
    deviceType: DeviceType;
    priority: number;
    wattage: number;
}

export const DeviceSettingsPage = () => {
    const {deviceId} = useParams<{ deviceId: string }>();
    const {user} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasMonitor = location.state?.hasMonitor ?? false;

    const [formData, setFormData] = useState<DeviceFormData>({
        name: '',
        deviceType: 'SWITCHABLE_APPLIANCE',
        priority: 0,
        wattage: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mqttSuffix, setMqttSuffix] = useState('');

    useEffect(() => {
        const fetchDevice = async () => {
            if (!deviceId) return;
            setIsLoading(true);
            try {
                const response = await apiClient.get<DeviceResponseDTO>(`/api/devices/${deviceId}`);

                setFormData({
                    name: response.data.name,
                    deviceType: response.data.deviceType,
                    priority: response.data.priority,
                    wattage: response.data.wattage,
                });

                const prefix = `${user?.username}-`;
                if (response.data.mqttPrefix.startsWith(prefix)) {
                    setMqttSuffix(response.data.mqttPrefix.substring(prefix.length));
                } else {
                    setMqttSuffix(response.data.mqttPrefix); // Fallback
                }
            } catch (error) {
                console.error("Failed to fetch device", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDevice();
    }, [deviceId, user?.username]);

    const isMonitor = formData.deviceType === 'POWER_MONITOR';

    const handleChange = (field: keyof DeviceFormData, value: string | number) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSave = async () => {
        if (!deviceId) return;
        setIsSaving(true);
        const deviceData: DeviceRequestDTO = {
            name: formData.name,
            mqttPrefix: `${user?.username}-${mqttSuffix}`,
            deviceType: formData.deviceType,
            priority: formData.priority,
            wattage: isMonitor ? 0 : formData.wattage,
        };

        try {
            await apiClient.put(`/api/devices/${deviceId}`, deviceData);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to save device", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div>Loading device settings...</div>;
    }

    console.log("User:", user);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Edit: {formData.name}</CardTitle>
                </CardHeader>
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
                                value={mqttSuffix}
                                onChange={(e) => setMqttSuffix(e.target.value)}
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
                        >
                            <SelectTrigger id="type"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="POWER_MONITOR" disabled={hasMonitor && formData.deviceType !== 'POWER_MONITOR'}>
                                    Power Monitor {hasMonitor && formData.deviceType !== 'POWER_MONITOR' && "(Already exists)"}
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
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};