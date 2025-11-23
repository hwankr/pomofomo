'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface TimerAppProps {
  settingsUpdated: number;
}

export default function TimerApp({ settingsUpdated }: TimerAppProps) {
  const [tab, setTab] = useState<'timer' | 'stopwatch'>('timer');
  const [timerMode, setTimerMode] = useState<
    'focus' | 'shortBreak' | 'longBreak'
  >('focus');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState({
    pomoTime: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomos: false,
    longBreakInterval: 4,
    volume: 50,
  });

  const loadSettings = useCallback(() => {
    const saved = localStorage.getItem('pomofomo_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings((prev) => ({ ...prev, ...parsed }));

      if (!isRunning) {
        if (timerMode === 'focus') setTimeLeft(parsed.pomoTime * 60);
        else if (timerMode === 'shortBreak')
          setTimeLeft(parsed.shortBreak * 60);
        else if (timerMode === 'longBreak') setTimeLeft(parsed.longBreak * 60);
      }
    }
    setIsLoaded(true);
  }, [isRunning, timerMode]);

  useEffect(() => {
    loadSettings();
  }, [settingsUpdated, loadSettings]);

  const playAlarm = () => {
    try {
      const audio = new Audio('/alarm.mp3');
      audio.volume = settings.volume / 100;
      audio.play();
    } catch (error) {
      console.error(error);
    }
  };

  const saveRecord = async (recordMode: string, duration: number) => {
    if (duration < 10) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);
    const toastId = toast.loading('Saving...', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontSize: '14px',
      },
    });

    try {
      const { error } = await supabase.from('study_sessions').insert({
        mode: recordMode,
        duration: duration,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success('Saved!', { id: toastId });
    } catch (e) {
      toast.error('Failed', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
      playAlarm();

      const duration =
        timerMode === 'focus'
          ? settings.pomoTime
          : timerMode === 'shortBreak'
          ? settings.shortBreak
          : settings.longBreak;

      saveRecord(timerMode === 'focus' ? 'pomo' : 'break', duration * 60);

      if (timerMode === 'focus') {
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);

        if (newCycle % settings.longBreakInterval === 0) {
          setTimerMode('longBreak');
          setTimeLeft(settings.longBreak * 60);
          toast('🎉 Long Break time!', { icon: '☕' });
          if (settings.autoStartBreaks)
            setTimeout(() => setIsRunning(true), 1000);
        } else {
          setTimerMode('shortBreak');
          setTimeLeft(settings.shortBreak * 60);
          toast('Take a short break.', { icon: '☕' });
          if (settings.autoStartBreaks)
            setTimeout(() => setIsRunning(true), 1000);
        }
      } else {
        setTimerMode('focus');
        setTimeLeft(settings.pomoTime * 60);
        toast('Time to focus!', { icon: '🔥' });
        if (settings.autoStartPomos) setTimeout(() => setIsRunning(true), 1000);
      }
    }
  }, [timeLeft, isRunning, timerMode, settings, cycleCount]);

  // --- 🍅 타이머 시작/정지 (스톱워치 끄기 기능 추가) ---
  const toggleTimer = () => {
    if (isRunning) {
      // 멈춤
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
    } else {
      // 시작 전, 스톱워치가 돌고 있다면 끈다!
      if (isStopwatchRunning) {
        if (stopwatchRef.current) clearInterval(stopwatchRef.current);
        setIsStopwatchRunning(false);
        toast('Stopwatch paused for Timer.', {
          icon: '⏸️',
          style: { background: '#333', color: '#fff', fontSize: '12px' },
        });
      }

      // 시작
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
  };

  const changeTimerMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerMode(mode);
    if (mode === 'focus') setTimeLeft(settings.pomoTime * 60);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
    else setTimeLeft(settings.longBreak * 60);
  };

  // --- ⏱️ 스톱워치 시작/정지 (타이머 끄기 기능 추가) ---
  const toggleStopwatch = () => {
    if (isStopwatchRunning) {
      // 멈춤
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      setIsStopwatchRunning(false);
    } else {
      // 시작 전, 뽀모도로 타이머가 돌고 있다면 끈다!
      if (isRunning) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);
        toast('Timer paused for Stopwatch.', {
          icon: '⏸️',
          style: { background: '#333', color: '#fff', fontSize: '12px' },
        });
      }

      // 시작
      setIsStopwatchRunning(true);
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopwatchSave = async () => {
    await saveRecord('stopwatch', stopwatchTime);
    setStopwatchTime(0);
    setIsStopwatchRunning(false);
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, []);

  const getThemeColor = () => {
    if (tab === 'stopwatch') return 'indigo';
    if (timerMode === 'shortBreak' || timerMode === 'longBreak')
      return 'emerald';
    return 'rose';
  };

  const color = getThemeColor();
  const bgLight = `bg-${color}-50`;
  const bgDark = `dark:bg-${color}-950/30`;
  const textMain = `text-${color}-500 dark:text-${color}-400`;
  const btnMain = `bg-${color}-500 hover:bg-${color}-600 shadow-${color}-200`;

  const modeBtnBase =
    'px-5 py-2 rounded-full text-sm font-bold border-2 transition-all';
  const modeBtnActive = `bg-${color}-500 text-white border-${color}-500 shadow-sm`;
  const modeBtnInactive =
    'text-gray-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5';

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      {/* 상단 탭 */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900/50 m-2 rounded-2xl">
        <button
          onClick={() => setTab('timer')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            tab === 'timer'
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          Timer
        </button>
        <button
          onClick={() => setTab('stopwatch')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            tab === 'stopwatch'
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          Stopwatch
        </button>
      </div>

      <div
        className={`px-10 py-6 flex flex-col items-center justify-center min-h-[360px] transition-colors duration-500 ${bgLight} ${bgDark}`}
      >
        {!isLoaded ? (
          <div className="text-gray-400 animate-pulse">Loading...</div>
        ) : tab === 'timer' ? (
          // --- 🍅 뽀모도로 UI ---
          <div className="text-center animate-fade-in w-full">
            {/* 모드 버튼 */}
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => changeTimerMode('focus')}
                className={`${modeBtnBase} ${
                  timerMode === 'focus' ? modeBtnActive : modeBtnInactive
                }`}
              >
                Pomodoro
              </button>
              <button
                onClick={() => changeTimerMode('shortBreak')}
                className={`${modeBtnBase} ${
                  timerMode === 'shortBreak' ? modeBtnActive : modeBtnInactive
                }`}
              >
                Short Break
              </button>
              <button
                onClick={() => changeTimerMode('longBreak')}
                className={`${modeBtnBase} ${
                  timerMode === 'longBreak' ? modeBtnActive : modeBtnInactive
                }`}
              >
                Long Break
              </button>
            </div>

            {/* 타이머 숫자 */}
            <div
              className={`text-7xl sm:text-8xl font-bold mb-4 font-mono tracking-tighter transition-colors ${textMain}`}
            >
              {formatTime(timeLeft)}
            </div>

            {/* 사이클 표시 */}
            {timerMode === 'focus' && (
              <div className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-6 opacity-90 tracking-wider">
                CYCLE {cycleCount} / {settings.longBreakInterval}
              </div>
            )}

            {/* 시작 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={toggleTimer}
                className={`px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 shadow-lg ${btnMain} dark:shadow-none w-40`}
              >
                {isRunning ? 'PAUSE' : 'START'}
              </button>
            </div>
          </div>
        ) : (
          // --- ⏱️ 스톱워치 UI ---
          <div className="text-center animate-fade-in w-full">
            <div className="mb-6 text-sm font-bold text-indigo-400 uppercase tracking-widest">
              Stopwatch
            </div>

            <div className="text-7xl sm:text-8xl font-bold mb-10 font-mono tracking-tighter text-indigo-500 dark:text-indigo-400">
              {formatTime(stopwatchTime)}
            </div>

            <div className="flex gap-4 justify-center items-center">
              <button
                onClick={toggleStopwatch}
                className="px-10 py-4 rounded-2xl font-bold text-lg text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 w-40"
              >
                {isStopwatchRunning ? 'PAUSE' : 'START'}
              </button>

              {!isStopwatchRunning && stopwatchTime > 0 && (
                <>
                  <button
                    onClick={handleStopwatchSave}
                    disabled={isSaving}
                    className="px-5 py-4 rounded-2xl font-bold text-white bg-gray-800 hover:bg-black transition-all"
                  >
                    SAVE
                  </button>
                  <button
                    onClick={resetStopwatch}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-gray-400 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
                  >
                    ↺
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
