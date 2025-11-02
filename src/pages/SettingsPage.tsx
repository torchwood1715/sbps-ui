import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import apiClient from '../api/apiClient';
import {isAxiosError} from 'axios';
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Button} from "../components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import type { SystemSettingsDto } from '@/types/api.types';

export const SettingsPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SystemSettingsDto>({
        powerLimitWatts: 3500,
        powerOnMarginWatts: 500,
        overloadCooldownSeconds: 30,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get<SystemSettingsDto>('/api/settings');
                setFormData(response.data);
            } catch (err) {
                console.error("Failed to fetch settings", err);
                setError("Could not load settings. Using defaults.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (field: keyof SystemSettingsDto, value: string) => {
        setFormData(prev => ({...prev, [field]: Number(value) || 0}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await apiClient.put('/api/settings', formData);
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to save settings", error);
            let message = 'Failed to save settings.';
            if (isAxiosError(error)) {
                const serverMessage = (error.response?.data as any)?.message as string | undefined;
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
        return <div>Loading settings...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                        Configure the main power limits for your system.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="powerLimitWatts">Power Limit (W)</Label>
                        <Input id="powerLimitWatts" type="number"
                               value={formData.powerLimitWatts}
                               onChange={(e) => handleChange('powerLimitWatts', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Total power limit for the system (e.g., your main breaker limit).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="powerOnMarginWatts">Power-On Margin (W)</Label>
                        <Input id="powerOnMarginWatts" type="number"
                               value={formData.powerOnMarginWatts}
                               onChange={(e) => handleChange('powerOnMarginWatts', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Available power needed to turn a device on.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="overloadCooldownSeconds">Overload Cooldown (sec)</Label>
                        <Input id="overloadCooldownSeconds" type="number"
                               value={formData.overloadCooldownSeconds}
                               onChange={(e) => handleChange('overloadCooldownSeconds', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Time to wait after an overload before turning devices back on.
                        </p>
                    </div>
                    {error && <p className="text-red-600">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};