'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const VAPID_PUBLIC_KEY = 'BKb9Eet4um6MvcXDHiKIFrbeKNrZoX3Mb5INbqXFogQdNrSp8LUgorU5ZuIvS1jvEfgSGBGUMUnridUQlej-Ic0';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        const registerSwAndCheckPermission = async () => {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered');
                } catch (error) {
                    console.error('Service Worker registration failed:', error);
                }
            }

            if (typeof window !== 'undefined' && 'Notification' in window) {
                const currentPermission = Notification.permission;
                setPermission(currentPermission);
                if (currentPermission === 'granted') {
                    subscribeUser();
                }
            }
        };

        registerSwAndCheckPermission();
    }, []);

    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys,
            }, { onConflict: 'endpoint' });

            if (error) {
                console.error('Failed to save subscription:', JSON.stringify(error, null, 2));
                throw error;
            }

            toast.success('알림이 설정되었습니다!');
            setPermission('granted');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('알림 설정에 실패했습니다.');
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            await subscribeUser();
        }
    };

    if (permission === 'granted' || permission === 'denied') {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-bounce">
            <button
                onClick={requestPermission}
                className="bg-rose-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors text-sm font-medium flex items-center gap-2"
            >
                <span>🔔</span>
                <span>알림 켜기</span>
            </button>
        </div>
    );
}
