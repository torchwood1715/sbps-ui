import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import apiClient from '../api/apiClient';
import {isAxiosError} from 'axios';
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Button} from "../components/ui/button";
import {Switch} from "../components/ui/switch";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import type {ApiErrorResponse, SystemSettingsDto} from '@/types/api.types';
import {BellIcon, BellOffIcon} from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const SettingsPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SystemSettingsDto>({
        powerLimitWatts: 3500,
        powerOnMarginWatts: 500,
        overloadCooldownSeconds: 30,
        powerSaveLimitWatts: 1500,
        isVacationModeEnabled: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pushError, setPushError] = useState<string | null>(null);
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [isPushLoading, setIsPushLoading] = useState(true);
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get<SystemSettingsDto>('/api/settings');
                setFormData({
                    powerLimitWatts: response.data.powerLimitWatts ?? 3500,
                    powerOnMarginWatts: response.data.powerOnMarginWatts ?? 500,
                    overloadCooldownSeconds: response.data.overloadCooldownSeconds ?? 30,
                    powerSaveLimitWatts: response.data.powerSaveLimitWatts ?? 1000,
                    isVacationModeEnabled: response.data.isVacationModeEnabled ?? false,
                });
            } catch (err) {
                console.error("Failed to fetch settings", err);
                setError("Не вдалось завантажити налаштування. Використовуються стандартні.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();

        if (!vapidPublicKey) {
            console.error("VITE_VAPID_PUBLIC_KEY is not set.");
            setPushError("Push notification client is not configured.");
        }
        navigator.serviceWorker.ready
            .then((registration) => {
                return registration.pushManager.getSubscription();
            })
            .then((subscription) => {
                setIsPushSubscribed(!!subscription);
            })
            .catch((err) => {
                console.error("Error checking push subscription:", err);
                setPushError("Could not check push subscription.");
            })
            .finally(() => {
                setIsPushLoading(false);
            });
    }, [vapidPublicKey]);

    const handleChange = (field: keyof SystemSettingsDto, value: string) => {
        setFormData(prev => ({...prev, [field]: Number(value) || 0}));
    };

    const handleCheckboxChange = (field: 'isVacationModeEnabled', value: boolean) => {
        setFormData(prev => ({...prev, [field]: value}));

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

    const handlePushSubscriptionToggle = async () => {
        if (!vapidPublicKey) {
            setPushError("VAPID key is not configured. Cannot subscribe.");
            return;
        }

        setIsPushLoading(true);
        setPushError(null);

        try {
            const registration = await navigator.serviceWorker.ready;

            if (isPushSubscribed) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await apiClient.post('/api/notifications/unsubscribe', subscription.toJSON());
                    await subscription.unsubscribe();
                }
                setIsPushSubscribed(false);
            } else {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    throw new Error("Permission for notifications was not granted.");
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });

                await apiClient.post('/api/notifications/subscribe', subscription.toJSON());
                setIsPushSubscribed(true);
            }
        } catch (err) {
            console.error("Failed to toggle push subscription", err);
            let message = "Failed to update subscription.";
            if (err instanceof Error) {
                message = err.message;
            }
            setPushError(message);
        } finally {
            setIsPushLoading(false);
        }
    };

    if (isLoading) {
        return <div>Завантаження налаштувань...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Налаштування системи</CardTitle>
                    <CardDescription>
                        Налаштуйте ліміти потужності вашої системи.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="powerLimitWatts">Ліміт потужності (Вт)</Label>
                        <Input id="powerLimitWatts" type="number"
                               value={formData.powerLimitWatts}
                               onChange={(e) => handleChange('powerLimitWatts', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Загальний ліміт потужності для системи (напр. ліміт вашого вхідного автомату).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="powerSaveLimitWatts">Ліміт енергозбереження (Вт)</Label>
                        <Input id="powerSaveLimitWatts" type="number"
                               value={formData.powerSaveLimitWatts}
                               onChange={(e) => handleChange('powerSaveLimitWatts', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Ліміт, що буде використовуватись під час блекауту або у режимі "Відпустка" (напр. ліміт
                            інвертора).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="powerOnMarginWatts">Резерв для увімкнення (Вт)</Label>
                        <Input id="powerOnMarginWatts" type="number"
                               value={formData.powerOnMarginWatts}
                               onChange={(e) => handleChange('powerOnMarginWatts', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Доступна потужність, необхідна для увімкнення пристрою з черги.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="overloadCooldownSeconds">Затримка відновлення (сек)</Label>
                        <Input id="overloadCooldownSeconds" type="number"
                               value={formData.overloadCooldownSeconds}
                               onChange={(e) => handleChange('overloadCooldownSeconds', e.target.value)}
                               required
                               min="0"/>
                        <p className="text-sm text-muted-foreground">
                            Час очікування після перевантаження перед увімкненням пристроїв.
                        </p>
                    </div>
                    {error && <p className="text-red-600">{error}</p>}
                    <Card className="bg-gray-50/50">
                        <CardHeader>
                            <CardTitle>Режим "Відпустка"</CardTitle>
                            <CardDescription>
                                Примусово активує режим енергозбереження та вимикає всі не життєво важливі пристрої.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center space-x-2">
                            <Switch
                                id="vacation-mode"
                                checked={formData.isVacationModeEnabled}
                                onCheckedChange={(checked) => handleCheckboxChange('isVacationModeEnabled', checked)}
                            />
                            <Label htmlFor="vacation-mode">
                                {formData.isVacationModeEnabled ? "Режим 'Відпустка' увімкнено" : "Режим 'Відпустка' вимкнено"}
                            </Label>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-50/50">
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>
                                Отримувати push-сповіщення, коли система приймає рішення.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handlePushSubscriptionToggle}
                                disabled={isPushLoading || !vapidPublicKey}
                                variant={isPushSubscribed ? "destructive" : "default"}
                                className="w-full"
                            >
                                {isPushLoading ? (
                                    "Оновлення..."
                                ) : isPushSubscribed ? (
                                    <>
                                        <BellOffIcon className="mr-2 h-4 w-4"/>
                                        Вимкнути сповіщення на цьому пристрої
                                    </>
                                ) : (
                                    <>
                                        <BellIcon className="mr-2 h-4 w-4"/>
                                        Увімкнути сповіщення на цьому пристрої
                                    </>
                                )}
                            </Button>
                            {pushError && <p className="text-red-600 text-sm mt-3">{pushError}</p>}
                        </CardContent>
                    </Card>
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/dashboard')}>
                        Скасувати
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Збереження...' : 'Зберегти налаштування'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};