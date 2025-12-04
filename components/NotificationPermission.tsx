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
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addLog = (msg: string) => {
        setDebugLog(prev => [msg, ...prev].slice(0, 10));
        console.log(msg);
    };

    const checkSubscription = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            addLog(subscription ? 'Subscription active' : 'No subscription found');
        } catch (e) {
            addLog(`Error checking subscription: ${e}`);
        }
    };

    useEffect(() => {
        const registerSwAndCheckPermission = async () => {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('/sw.js');
                    addLog('Service Worker registered');
                } catch (error) {
                    addLog(`SW registration failed: ${error}`);
                }
            }

            if (typeof window !== 'undefined' && 'Notification' in window) {
                const currentPermission = Notification.permission;
                setPermission(currentPermission);
                addLog(`Current permission: ${currentPermission}`);
                await checkSubscription();
                
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
            addLog('Starting subscription...');
            const registration = await navigator.serviceWorker.ready;
            
            // Unsubscribe existing to force refresh if needed
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                addLog('Unsubscribing existing...');
                await existingSub.unsubscribe();
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            addLog('Got push subscription');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                addLog('No user found');
                return;
            }

            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys,
            }, { onConflict: 'endpoint' });

            if (error) {
                addLog(`DB Error: ${JSON.stringify(error)}`);
                throw error;
            }

            toast.success('알림이 설정되었습니다!');
            setPermission('granted');
            setIsSubscribed(true);
            addLog('Subscription saved to DB');
        } catch (error) {
            addLog(`Subscribe failed: ${error}`);
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
        addLog(`Permission result: ${result}`);

        if (result === 'granted') {
            await subscribeUser();
        }
    };

    const sendTestNotification = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('테스트 알림', {
                body: '알림이 잘 작동합니다! 🎉',
                icon: '/icon-192x192.png'
            });
            addLog('Test notification sent');
        } catch (e) {
            addLog(`Test notification failed: ${e}`);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <div className="bg-black/80 text-white p-4 rounded-lg text-xs w-64 mb-2 backdrop-blur-sm border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Debug Info</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <div className="space-y-1 mb-3">
                        <p>Permission: <span className={permission === 'granted' ? 'text-green-400' : 'text-red-400'}>{permission}</span></p>
                        <p>Subscribed: <span className={isSubscribed ? 'text-green-400' : 'text-red-400'}>{isSubscribed ? 'Yes' : 'No'}</span></p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={subscribeUser} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">
                            Force Resubscribe
                        </button>
                        <button onClick={sendTestNotification} className="bg-gray-600 px-2 py-1 rounded hover:bg-gray-500">
                            Test Notification
                        </button>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-700">
                        <p className="font-bold mb-1">Logs:</p>
                        {debugLog.map((log, i) => (
                            <p key={i} className="truncate opacity-70">- {log}</p>
                        ))}
                    </div>
                </div>
            )}
            
            <button
                onClick={() => permission === 'granted' ? setIsOpen(!isOpen) : requestPermission()}
                className={`${permission === 'granted' ? 'bg-gray-800' : 'bg-rose-500 animate-bounce'} text-white px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-all text-sm font-medium flex items-center gap-2`}
            >
                <span>🔔</span>
                <span>{permission === 'granted' ? '알림 설정' : '알림 켜기'}</span>
            </button>
        </div>
    );
}
