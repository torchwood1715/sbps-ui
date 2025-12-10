import {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import apiClient from '../api/apiClient';
import {isAxiosError} from 'axios';
import {useAuth} from '../hooks/useAuth';
import {Button} from "../components/ui/button";
import {Card, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import DeviceForm from '@/components/DeviceForm';
import type {ApiErrorResponse, DeviceProvider, DeviceRequestDTO, DeviceResponseDTO} from '@/types/api.types';
import type {DeviceFormData} from '@/types/forms.types';

export const DeviceSettingsPage = () => {
    const {deviceId} = useParams<{ deviceId: string }>();
    const {user} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasPowerMonitor = location.state?.hasPowerMonitor ?? false;
    const hasGridMonitor = location.state?.hasGridMonitor ?? false;

    const [formData, setFormData] = useState<DeviceFormData>({
        name: '',
        deviceType: 'SWITCHABLE_APPLIANCE',
        provider: 'SHELLY',
        nonEssential: false,
        priority: 0,
        wattage: 0,
        preventDowntime: false,
        maxDowntimeMinutes: 60,
        minUptimeMinutes: 10,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
                    provider: response.data.provider,
                    nonEssential: response.data.nonEssential,
                    priority: response.data.priority,
                    wattage: response.data.wattage,
                    preventDowntime: response.data.preventDowntime,
                    maxDowntimeMinutes: response.data.maxDowntimeMinutes ?? 60,
                    minUptimeMinutes: response.data.minUptimeMinutes ?? 10,
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

    const isMonitor = formData.deviceType === 'POWER_MONITOR' || formData.deviceType === 'GRID_MONITOR';

    const handleChange = (field: keyof DeviceFormData, value: string | number | DeviceProvider) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleCheckboxChange = (field: 'preventDowntime' | 'nonEssential', value: boolean) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSave = async () => {
        if (!deviceId) return;
        setIsSaving(true);
        const deviceData: DeviceRequestDTO = {
            name: formData.name,
            mqttPrefix: `${user?.username}-${mqttSuffix}`,
            deviceType: formData.deviceType,
            provider: formData.provider,
            nonEssential: isMonitor ? false : formData.nonEssential,
            priority: isMonitor ? 0 : formData.priority,
            wattage: isMonitor ? 0 : formData.wattage,
            preventDowntime: isMonitor ? false : formData.preventDowntime,
            maxDowntimeMinutes: isMonitor ? 0 : formData.maxDowntimeMinutes,
            minUptimeMinutes: isMonitor ? 0 : formData.minUptimeMinutes,
        };

        try {
            await apiClient.put(`/api/devices/${deviceId}`, deviceData);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to save device", error);
            let message = 'Failed to save device.';
            if (isAxiosError(error)) {
                const serverMessage = (error.response?.data as ApiErrorResponse)?.message as string | undefined;
                if (serverMessage && serverMessage.trim().length > 0) {
                    message = serverMessage;
                } else if (error.message) {
                    message = error.message;
                }
            } else if (error instanceof Error) {
                message = error.message || message;
            }
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div>Завантажуємо налаштування...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Редагувати: {formData.name}</CardTitle>
                </CardHeader>
                <DeviceForm
                    username={user?.username}
                    formData={formData}
                    onFieldChange={handleChange}
                    onCheckboxChange={handleCheckboxChange}
                    isMonitor={isMonitor}
                    hasMonitor={hasPowerMonitor}
                    hasGridMonitor={hasGridMonitor}
                    mqttSuffix={mqttSuffix}
                    setMqttSuffix={setMqttSuffix}
                />
                {error && <p className="text-red-600 px-6 pt-2">{error}</p>}
                <CardFooter className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
                        Скасувати
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};