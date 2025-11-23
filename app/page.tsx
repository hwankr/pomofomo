'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TimerApp from '@/components/TimerApp';
import HistoryList from '@/components/HistoryList';
import LoginModal from '@/components/LoginModal';
import ReportModal from '@/components/ReportModal';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 테마 상태 (기본값: 라이트모드 false)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 사용자의 시스템 설정을 확인해서 다크모드 자동 적용 (선택사항)
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setIsDarkMode(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  if (isLoading) return null; // 깜빡임 방지용 빈 화면

  // 공통 버튼 스타일 (모드에 따라 자동 변신)
  const headerBtnStyle = `
    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    bg-white/50 text-gray-600 hover:bg-white hover:text-gray-900 border border-gray-200 shadow-sm
    dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20 dark:hover:text-white dark:border-white/10
  `;

  return (
    // ⭐️ 최상위 div에 'dark' 클래스를 넣으면 자식들이 다크모드로 변신함
    <div className={isDarkMode ? 'dark' : ''}>
      <main className="flex min-h-screen flex-col items-center bg-[#f8f9fa] dark:bg-[#0f172a] transition-colors duration-300 p-4 overflow-y-auto font-sans">
        <Toaster position="top-center" reverseOrder={false} />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onGoogleLogin={handleGoogleLogin}
        />

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />

        <div className="py-8 flex flex-col items-center w-full max-w-md relative">
          {/* --- 상단 헤더 --- */}
          <div className="w-full flex justify-between items-center mb-8 px-1">
            {/* 왼쪽: 로고 (텍스트) */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍅</span>
              <h1 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                Pomofomo
              </h1>
            </div>

            {/* 오른쪽: 버튼 그룹 */}
            <div className="flex items-center gap-2">
              {/* 🌙 테마 전환 버튼 */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={headerBtnStyle}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-yellow-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                  </svg>
                )}
              </button>

              {/* 리포트 버튼 */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className={headerBtnStyle}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                  />
                </svg>
                <span className="hidden sm:inline">Report</span>
              </button>

              {/* 로그인/로그아웃 버튼 */}
              {session ? (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className={headerBtnStyle}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`${headerBtnStyle} bg-gray-900 text-white hover:bg-gray-800 border-transparent dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
            <TimerApp />

            {session ? (
              <HistoryList />
            ) : (
              <div className="text-center text-gray-400 text-xs mt-2 dark:text-gray-500">
                로그인하면 공부 기록이 안전하게 저장됩니다.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
