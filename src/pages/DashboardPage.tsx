import {useEffect, useState} from 'react';
import {useAuth} from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import {useNavigate} from 'react-router-dom';
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {PlusCircle} from 'lucide-react';
import {AxiosError} from "axios";

interface DeviceStatus {
    output: boolean;
    apower: number;
    voltage: number;
    current: number;
    temperature: { tC: number, tF: number };
}

interface Device {
    id: number;
    name: string;
    mqttPrefix: string;
    deviceType: 'POWER_MONITOR' | 'SWITCHABLE_APPLIANCE';
    priority: number;
    wattage: number;
    username: string;
    isOnline?: boolean;
    isOn?: boolean;
    currentPower?: number;
    voltage?: number;
    temperature?: number;
}

export const DashboardPage = () => {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [deviceError, setDeviceError] = useState<string | null>(null);

    const hasMonitor = devices.some(d => d.deviceType === 'POWER_MONITOR');

    const fetchDevices = async () => {
        setLoadingDevices(true);
        setDeviceError(null);
        try {
            const listResponse = await apiClient.get<Device[]>('/devices');
            const baseDevices = listResponse.data;

            if (baseDevices.length === 0) {
                setDevices([]);
                return;
            }

            const statusPromises = baseDevices.map(async (device) => {
                try {
                    const onlineResponse = await apiClient.get<boolean>(`/api/control/plug/${device.id}/online`);
                    const isOnline = onlineResponse.data;
                    if (!isOnline) {
                        return {
                            ...device,
                            isOnline: false,
                            isOn: false,
                            currentPower: 0,
                            voltage: 0,
                            temperature: 0,
                        };
                    }
                    const statusResponse = await apiClient.get<DeviceStatus>(`/api/control/plug/${device.id}/status`);
                    const status = statusResponse.data;

                    return {
                        ...device,
                        isOnline: true,
                        isOn: status?.output ?? false,
                        currentPower: status?.apower ?? 0,
                        voltage: status?.voltage ?? 0,
                        temperature: status?.temperature?.tC ?? 0,
                    };
                } catch (err) {
                    console.error(`Failed to fetch status for device ${device.id}`, err);
                    return {
                        ...device,
                        isOnline: false,
                        isOn: false,
                        currentPower: 0,
                        voltage: 0,
                        temperature: 0,
                    };
                }
            });
            const devicesWithStatus = await Promise.all(statusPromises);
            setDevices(devicesWithStatus);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
            setDeviceError('Failed to load devices.');
            if (err instanceof AxiosError && err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoadingDevices(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggle = async (deviceId: number, currentState: boolean) => {
        const newState = !currentState;
        setDevices(prevDevices =>
            prevDevices.map(device =>
                device.id === deviceId ? {...device, isOn: newState} : device
            )
        );

        try {
            await apiClient.post(`/api/control/plug/${deviceId}/toggle?on=${newState}`);
            await new Promise(resolve => setTimeout(resolve, 750));
            const statusRes = await apiClient.get<DeviceStatus>(`/api/control/plug/${deviceId}/status`);
            const status = statusRes.data;

            setDevices(prevDevices =>
                prevDevices.map(device =>
                    device.id === deviceId ? {
                        ...device,
                        isOn: status?.output ?? newState,
                        currentPower: status?.apower ?? 0,
                        voltage: status?.voltage ?? 0,
                        temperature: status?.temperature?.tC ?? 0,
                    } : device
                )
            );

        } catch (error) {
            console.error("Failed to toggle device", error);
            await fetchDevices();
        }
    };

    const renderEmptyState = () => (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">No devices found</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first device.
            </p>
            <Button onClick={() => navigate('/device/create', {state: {hasMonitor: false}})}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add Device
            </Button>
        </div>
    );

    const renderDeviceCard = (device: Device) => {
        const isSwitchable = device.deviceType === 'SWITCHABLE_APPLIANCE';
        const isOnline = device.isOnline ?? false;
        const isOn = device.isOn ?? false;
        const currentPower = device.currentPower ?? 0;
        const voltage = device.voltage ?? 0;
        const temperature = device.temperature ?? 0;

        return (
            <Card key={device.id}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        {device.name}
                        <Badge variant={isOnline ? "default" : "outline"}>
                            {isOnline ? "Online" : "Offline"}
                        </Badge>
                    </CardTitle>
                    <CardDescription>{device.mqttPrefix}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-y-4 gap-x-2 pt-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium">{isSwitchable ? "Appliance" : "Monitor"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Power</p>
                            <p className="font-medium">{currentPower.toFixed(2)} W</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Priority</p>
                            <p className="font-medium">{device.priority}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Voltage</p>
                            <p className="font-medium">{voltage.toFixed(1)} V</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Temp</p>
                            <p className="font-medium">{temperature.toFixed(1)} °C</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/device/${device.id}/settings`, {state: {hasMonitor}})}
                    >
                        Settings
                    </Button>
                    {isSwitchable && (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`toggle-${device.id}`}
                                checked={isOn}
                                onCheckedChange={() => handleToggle(device.id, isOn)}
                                disabled={!isOnline}
                            />
                            <Label htmlFor={`toggle-${device.id}`}>{isOn ? "On" : "Off"}</Label>
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/settings')} variant="secondary">Settings</Button>
                    <Button onClick={logout} variant="outline">Logout</Button>
                </div>
            </header>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">My Devices</h2>
                {devices.length > 0 && (
                    <Button onClick={() => navigate('/device/create', {state: {hasMonitor}})}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Device
                    </Button>
                )}
            </div>

            {loadingDevices && <p>Loading devices...</p>}
            {deviceError && <p className="text-red-600">{deviceError}</p>}

            {!loadingDevices && !deviceError && devices.length === 0 && renderEmptyState()}

            {!loadingDevices && devices.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {devices.map(renderDeviceCard)}
                </div>
            )}
        </div>
    );
};