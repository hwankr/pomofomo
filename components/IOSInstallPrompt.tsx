'use client';

import { useEffect, useState } from 'react';
import { Share } from 'lucide-react';

export default function IOSInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if user agent is iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if app is in standalone mode
        const isStandaloneMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);
    }, []);

    if (!isIOS || isStandalone) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-8 shadow-lg animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-3">
                <p className="text-sm font-medium text-gray-800">
                    앱으로 설치하고 더 편리하게 이용하세요!
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>하단의</span>
                    <Share className="w-5 h-5 text-blue-500" />
                    <span>공유 버튼을 누르고</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                    '홈 화면에 추가'를 선택하세요
                </p>
            </div>
        </div>
    );
}
