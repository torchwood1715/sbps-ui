import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {PlusCircle} from 'lucide-react';
import {isAxiosError} from 'axios';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {type DonutSegment, PowerDonut} from '@/components/ui/PowerDonut';
import {LiveUsageGraph} from '@/components/ui/LiveUsageGraph';
import type {
    AllStatusesResponse,
    ApiErrorResponse,
    Device,
    DeviceStatus,
    DeviceStatusUpdate,
    SystemSettingsDto,
} from '@/types/api.types';

interface PowerHistoryPoint {
    time: number;
    power: number;
}

export const DashboardPage = () => {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState<Device[]>([]);

    const [settings, setSettings] = useState<SystemSettingsDto | null>(null);
    const [powerHistory, setPowerHistory] = useState<PowerHistoryPoint[]>([]);

    const [loadingDevices, setLoadingDevices] = useState(false);
    const [deviceError, setDeviceError] = useState<string | null>(null);

    const hasMonitor = devices.some((d) => d.deviceType === 'POWER_MONITOR');

    const powerLimit = settings?.powerLimitWatts ?? 3500;

    const updateDeviceState = (update: DeviceStatusUpdate) => {
        setDevices((prevDevices) =>
            prevDevices.map((device) => {
                if (device.id === update.deviceId) {
                    const updatedDevice = {...device};

                    if (update.isOnline !== undefined) {
                        updatedDevice.isOnline = update.isOnline;
                        if (!update.isOnline) {
                            updatedDevice.isOn = false;
                            updatedDevice.currentPower = 0;
                            updatedDevice.voltage = 0;
                            updatedDevice.temperature = 0;
                        }
                    }

                    if (update.statusJson) {
                        updatedDevice.isOnline = true;
                        updatedDevice.isOn = update.statusJson.output ?? false;
                        updatedDevice.currentPower = update.statusJson.apower ?? 0;
                        updatedDevice.voltage = update.statusJson.voltage ?? 0;
                        updatedDevice.temperature =
                            update.statusJson.temperature?.tC ?? 0;
                    }

                    return updatedDevice;
                }
                return device;
            }),
        );
    };

    const fetchData = useCallback(async () => {
        setLoadingDevices(true);
        setDeviceError(null);
        try {
            try {
                const settingsResponse =
                    await apiClient.get<SystemSettingsDto>('/api/settings');
                setSettings(settingsResponse.data);
            } catch (err) {
                console.warn('Could not load system settings, using defaults.', err);
                setSettings({
                    powerLimitWatts: 3500,
                    powerOnMarginWatts: 500,
                    overloadCooldownSeconds: 30,
                });
            }

            const listResponse = await apiClient.get<Device[]>('/api/devices');
            const baseDevices = listResponse.data;

            if (baseDevices.length === 0) {
                setDevices([]);
                return;
            }

            const statusesResponse =
                await apiClient.get<AllStatusesResponse>('/api/control/all-statuses');
            const statuses = statusesResponse.data;

            const devicesWithStatus = baseDevices.map((device) => {
                const status = statuses[device.id];

                if (status && 'online' in status && status.online === false) {
                    return {
                        ...device,
                        isOnline: false,
                        isOn: false,
                        currentPower: 0,
                        voltage: 0,
                        temperature: 0,
                    };
                }

                const fullStatus = status as DeviceStatus;
                return {
                    ...device,
                    isOnline: !!fullStatus,
                    isOn: fullStatus?.output ?? false,
                    currentPower: fullStatus?.apower ?? 0,
                    voltage: fullStatus?.voltage ?? 0,
                    temperature: fullStatus?.temperature?.tC ?? 0,
                };
            });

            setDevices(devicesWithStatus);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
            let message = 'Failed to load devices.';
            if (isAxiosError(err)) {
                const serverMessage = (err.response?.data as ApiErrorResponse)?.message;

                if (serverMessage && serverMessage.trim().length > 0) {
                    message = serverMessage;
                } else if (err.message) {
                    message = err.message;
                }
                if (err.response?.status === 401) {
                    logout();
                }
            } else if (err instanceof Error) {
                message = err.message || message;
            }
            setDeviceError(message);
        } finally {
            setLoadingDevices(false);
        }
    }, [logout]);

    useEffect(() => {
        fetchData().catch(console.error);
    }, [fetchData]);

    useEffect(() => {
        if (!user?.username) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const client = new Client({
            webSocketFactory: () => {
                return new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);
            },
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected via WebSocket: ' + frame);
            client.subscribe(`/topic/status/${user.username}`, (message) => {
                try {
                    const update = JSON.parse(message.body) as DeviceStatusUpdate;
                    updateDeviceState(update);
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            if (client) {
                void client.deactivate();
                console.log('WebSocket disconnected');
            }
        };
    }, [user]);

    useEffect(() => {
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        const UPDATE_INTERVAL_MS = 2000;

        const intervalId = setInterval(() => {
            const currentMonitor = devices.find(
                (d) => d.deviceType === 'POWER_MONITOR',
            );

            if (currentMonitor && currentMonitor.isOnline) {
                const now = Date.now();
                const newPoint: PowerHistoryPoint = {
                    time: now,
                    power: currentMonitor.currentPower ?? 0,
                };

                setPowerHistory((prevHistory) => {
                    const updatedHistory = [...prevHistory, newPoint];
                    return updatedHistory.filter((p) => p.time > now - FIVE_MINUTES_MS);
                });
            }
        }, UPDATE_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [devices]);

    const handleToggle = async (deviceId: number, currentState: boolean) => {
        const newState = !currentState;
        setDevices((prevDevices) =>
            prevDevices.map((device) =>
                device.id === deviceId ? {...device, isOn: newState} : device,
            ),
        );

        try {
            await apiClient.post(
                `/api/control/plug/${deviceId}/toggle?on=${newState}`,
            );
        } catch (error) {
            console.error('Failed to toggle device', error);
            setDevices((prevDevices) =>
                prevDevices.map((device) =>
                    device.id === deviceId ? {...device, isOn: currentState} : device,
                ),
            );
        }
    };

    const renderEmptyState = () => (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">No devices found</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first device.
            </p>
            <Button
                onClick={() => navigate('/device/create', {state: {hasMonitor: false}})}
            >
                <PlusCircle className="mr-2 h-4 w-4"/> Add Device
            </Button>
        </div>
    );

    const renderDeviceCard = (device: Device) => {
        const isMonitor = device.deviceType === 'POWER_MONITOR';
        const isSwitchable = device.deviceType === 'SWITCHABLE_APPLIANCE';
        const isOnline = device.isOnline ?? false;
        const isOn = device.isOn ?? false;
        const currentPower = device.currentPower ?? 0;
        const voltage = device.voltage ?? 0;
        const temperature = device.temperature ?? 0;

        let donutSegments: DonutSegment[] = [];
        if (isMonitor) {
            const appliances = devices.filter(
                (d) => d.deviceType === 'SWITCHABLE_APPLIANCE' && d.isOnline,
            );

            const appliancesPower = appliances.reduce(
                (sum, d) => sum + (d.currentPower ?? 0),
                0,
            );

            const otherPower = Math.max(0, currentPower - appliancesPower);

            donutSegments.push({name: 'Other', power: otherPower});

            appliances.forEach((appliance) => {
                donutSegments.push({
                    name: appliance.name,
                    power: appliance.currentPower ?? 0,
                });
            });

            donutSegments = donutSegments.filter((s) => s.power > 0.1 || s.name === 'Other');
        }

        return (
            <Card key={device.id} className={isMonitor ? 'md:col-span-2' : ''}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        {device.name}
                        <Badge variant={isOnline ? 'default' : 'outline'}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>{device.mqttPrefix}</CardDescription>
                </CardHeader>

                {isMonitor ? (
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <PowerDonut
                                segments={donutSegments}
                                totalPower={currentPower}
                                powerLimit={powerLimit}
                            />
                        </div>

                        <div>
                            <div className="grid grid-cols-3 gap-y-4 text-center mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-medium">Monitor</p>
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

                            <LiveUsageGraph
                                history={powerHistory}
                                powerLimit={powerLimit}
                            />
                        </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <div className="grid grid-cols-3 gap-y-4 gap-x-2 pt-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium">Appliance</p>
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
                )}

                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() =>
                            navigate(`/device/${device.id}/settings`, {state: {hasMonitor}})
                        }
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
                            <Label htmlFor={`toggle-${device.id}`}>{isOn ? 'On' : 'Off'}</Label>
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
                    <p className="text-muted-foreground">
                        Welcome back, {user?.username}!
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/settings')} variant="secondary">
                        Settings
                    </Button>
                    <Button onClick={logout} variant="outline">
                        Logout
                    </Button>
                </div>
            </header>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">My Devices</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        disabled={loadingDevices}
                    >
                        {loadingDevices ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    {devices.length > 0 && (
                        <Button
                            onClick={() =>
                                navigate('/device/create', {state: {hasMonitor}})
                            }
                        >
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Device
                        </Button>
                    )}
                </div>
            </div>

            {loadingDevices && <p>Loading devices...</p>}
            {deviceError && <p className="text-red-600">{deviceError}</p>}

            {!loadingDevices && !deviceError && devices.length === 0 && renderEmptyState()}

            {!loadingDevices && devices.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {devices
                        .sort((a, b) => {
                            if (a.deviceType === 'POWER_MONITOR') return -1;
                            if (b.deviceType === 'POWER_MONITOR') return 1;
                            return 0;
                        })
                        .map(renderDeviceCard)}
                </div>
            )}
        </div>
    );
};