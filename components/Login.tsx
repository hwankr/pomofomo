'use client';

import Image from 'next/image';
import { supabase } from '@/lib/supabase';

import { isInAppBrowser, handleInAppBrowser } from '@/lib/userAgent';

export default function Login() {
  const handleLogin = async () => {
    if (isInAppBrowser()) {
      const handled = handleInAppBrowser();
      if (handled) {
        alert('구글 로그인은 보안 정책상 외부 브라우저(크롬, 사파리 등)에서 진행해야 합니다.');
        return;
      }
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // 로그아웃/재방문 후 돌아갈 곳
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 text-center max-w-sm w-full mx-auto animate-fade-in">
      <div className="text-5xl">🔒</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요해요</h2>
        <p className="text-gray-400">
          공용 기록을 저장하려면
          <br />
          구글 계정으로 로그인해 주세요.
        </p>
      </div>

      <button
        onClick={handleLogin}
        className="w-full py-4 px-6 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
      >
        <Image
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          width={24}
          height={24}
          className="w-6 h-6"
          priority
        />
        구글로 시작하기
      </button>
    </div>
  );
}
