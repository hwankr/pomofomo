'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import TimerApp from '@/components/TimerApp';
import HistoryList from '@/components/HistoryList';
import LoginModal from '@/components/LoginModal';
import ReportModal from '@/components/ReportModal';
import SettingsModal from '@/components/SettingsModal';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // 프로필 메뉴 토글용

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);

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

  if (isLoading) return null;

  // 버튼 스타일 (공통)
  const headerBtnStyle = `
    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200
    bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900
    dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white
  `;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <main className="flex min-h-screen flex-col items-center bg-[#f8f9fa] dark:bg-[#0f172a] transition-colors duration-300 p-4 overflow-y-auto font-sans text-gray-900 dark:text-gray-100">
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
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={() => setSettingsUpdateTrigger((prev) => prev + 1)}
        />

        {/* 전체 레이아웃 폭을 넓혀서 여유를 줌 */}
        <div className="py-8 flex flex-col items-center w-full max-w-lg relative">
          {/* --- 헤더 (간격 조정됨) --- */}
          <div className="w-full flex justify-between items-center mb-12 px-2">
            {/* 왼쪽: 로고 */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-2xl">🍅</span>
              <h1 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                Pomofomo
              </h1>
            </div>

            {/* 오른쪽: 버튼 그룹 */}
            <div className="flex items-center gap-3">
              {/* 테마 */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`${headerBtnStyle} px-3`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              {/* 리포트 */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className={headerBtnStyle}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
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

              {/* 설정 */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className={headerBtnStyle}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38c-.551-.318-1.26-.117-1.527.461a20.845 20.845 0 01-1.44 4.282m3.102-.069a18.03 18.03 0 01.59 4.59c0 1.586-.205 3.124-.59 4.59m0-9.18a23.848 23.848 0 01-8.835-2.535"
                  />
                </svg>
                <span className="hidden sm:inline">Setting</span>
              </button>

              {/* ✨ 프로필 / 로그인 버튼 수정 ✨ */}
              {session ? (
                <div className="relative">
                  {/* 프로필 사진 버튼 */}
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-9 h-9 rounded-lg overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={
                        session.user.user_metadata.avatar_url ||
                        'https://www.svgrepo.com/show/446532/avatar.svg'
                      }
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* 드롭다운 메뉴 (클릭하면 나옴) */}
                  {isProfileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setIsProfileMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 overflow-hidden py-1 animate-fade-in">
                        <button
                          onClick={() => {
                            supabase.auth.signOut();
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
                        >
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`${headerBtnStyle} bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-8 animate-fade-in">
            <TimerApp settingsUpdated={settingsUpdateTrigger} />
            {session ? <HistoryList /> : null}
          </div>
        </div>
      </main>
    </div>
  );
}
