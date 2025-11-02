import React, {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import {Card, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import DeviceForm from '@/components/DeviceForm';
import type { DeviceFormData } from '@/types/forms.types';

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
        preventDowntime: false,
        maxDowntimeMinutes: 60,
        minUptimeMinutes: 10,
    });

    const isMonitor = formData.deviceType === 'POWER_MONITOR';

    const handleChange = (field: keyof DeviceFormData, value: string | number) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleCheckboxChange = (field: keyof Omit<DeviceFormData, 'deviceType' | 'name' | 'mqttSuffix' | 'priority' | 'wattage' | 'maxDowntimeMinutes' | 'minUptimeMinutes'>, value: boolean) => {
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
            preventDowntime: isMonitor ? false : formData.preventDowntime,
            maxDowntimeMinutes: isMonitor ? 0 : formData.maxDowntimeMinutes,
            minUptimeMinutes: isMonitor ? 0 : formData.minUptimeMinutes,
        };

        try {
            await apiClient.post('/api/devices', deviceData);
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
                    <DeviceForm
                        username={user?.username}
                        formData={formData}
                        onFieldChange={handleChange}
                        onCheckboxChange={(field, value) => handleCheckboxChange(field as any, value)}
                        isMonitor={isMonitor}
                        hasMonitor={hasMonitor}
                    />
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