'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Helper for time formatting (HH:MM:SS or MM:SS)
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function TimerApp() {
  const [mode, setMode] = useState<'pomo' | 'stopwatch'>('pomo');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer states
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [initialPomoTime, setInitialPomoTime] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const pomoRef = useRef<NodeJS.Timeout | null>(null);

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize: Load state from Supabase
  useEffect(() => {
    const loadServerState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoaded(true);
        return;
      }

      const { data } = await supabase
        .from('timer_states')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setPomoTime(data.pomo_time);
        setStopwatchTime(data.stopwatch_time);
        setMode(data.mode as 'pomo' | 'stopwatch');
      }
      setIsLoaded(true);
    };
    loadServerState();
  }, []);

  // Sync state to Supabase
  const syncStateToServer = async (
    currentMode: string,
    pTime: number,
    sTime: number
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('timer_states').upsert({
      user_id: user.id,
      mode: currentMode,
      pomo_time: pTime,
      stopwatch_time: sTime,
    });
  };

  const playAlarm = () => {
    try {
      const audio = new Audio('/alarm.mp3');
      audio.play();
    } catch (error) {
      console.error(error);
    }
  };

  // Save session record
  const saveRecord = async (recordMode: string, duration: number) => {
    if (duration < 10) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);
    const toastId = toast.loading('기록 저장 중...', {
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });

    try {
      const { error } = await supabase.from('study_sessions').insert({
        mode: recordMode,
        duration: duration,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success('저장 완료', { id: toastId });
    } catch (e) {
      toast.error('저장 실패', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Pomodoro Logic
  useEffect(() => {
    if (pomoTime === 0 && isPomoRunning) {
      if (pomoRef.current) clearInterval(pomoRef.current);
      setIsPomoRunning(false);
      playAlarm();
      toast('집중 시간 종료', { icon: '🔔' });
      saveRecord('pomo', initialPomoTime);
      setPomoTime(initialPomoTime);
      syncStateToServer('pomo', initialPomoTime, stopwatchTime);
    }
  }, [pomoTime, isPomoRunning, initialPomoTime]);

  const togglePomo = () => {
    if (isPomoRunning) {
      if (pomoRef.current) clearInterval(pomoRef.current);
      setIsPomoRunning(false);
      syncStateToServer('pomo', pomoTime, stopwatchTime);
    } else {
      setIsPomoRunning(true);
      pomoRef.current = setInterval(() => {
        setPomoTime((prev) => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
  };

  const setPomoDuration = (minutes: number) => {
    if (pomoRef.current) clearInterval(pomoRef.current);
    setIsPomoRunning(false);
    const newTime = minutes * 60;
    setPomoTime(newTime);
    setInitialPomoTime(newTime);
    syncStateToServer('pomo', newTime, stopwatchTime);
  };

  const resetPomo = () => {
    setPomoDuration(25);
  };

  // Stopwatch Logic
  const toggleStopwatch = () => {
    if (isStopwatchRunning) {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      setIsStopwatchRunning(false);
      syncStateToServer('stopwatch', pomoTime, stopwatchTime);
    } else {
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
    syncStateToServer('stopwatch', pomoTime, 0);
  };

  const resetStopwatch = () => {
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    syncStateToServer('stopwatch', pomoTime, 0);
  };

  const changeMode = (newMode: 'pomo' | 'stopwatch') => {
    setMode(newMode);
    if (!isPomoRunning && !isStopwatchRunning) {
      syncStateToServer(newMode, pomoTime, stopwatchTime);
    }
  };

  useEffect(() => {
    return () => {
      if (pomoRef.current) clearInterval(pomoRef.current);
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, []);

  // Theme constants
  const themeColor = mode === 'pomo' ? 'rose' : 'indigo';
  const bgLight = mode === 'pomo' ? 'bg-rose-50' : 'bg-indigo-50';
  const bgDark =
    mode === 'pomo' ? 'dark:bg-rose-950/30' : 'dark:bg-indigo-950/30';
  const textMain =
    mode === 'pomo'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-indigo-600 dark:text-indigo-400';
  const btnMain =
    mode === 'pomo'
      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 dark:shadow-none'
      : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none';

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      {/* Mode Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900/50 m-2 rounded-2xl">
        <button
          onClick={() => changeMode('pomo')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            mode === 'pomo'
              ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => changeMode('stopwatch')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            mode === 'stopwatch'
              ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Stopwatch
        </button>
      </div>

      <div
        className={`p-8 flex flex-col items-center justify-center min-h-[320px] transition-colors duration-500 ${bgLight} ${bgDark}`}
      >
        {!isLoaded ? (
          <div className="text-gray-400 animate-pulse text-sm font-medium">
            Loading...
          </div>
        ) : mode === 'pomo' ? (
          // Pomodoro UI
          <div className="text-center animate-fade-in w-full">
            <div className="mb-6 flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isPomoRunning
                    ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'
                }`}
              >
                {isPomoRunning ? 'Focusing' : 'Ready'}
              </span>
            </div>

            <div
              className={`text-7xl sm:text-8xl font-black mb-8 font-mono tracking-tighter transition-colors ${textMain}`}
            >
              {formatTime(pomoTime)}
            </div>

            <div className="flex gap-2 justify-center mb-8">
              {[25, 5, 0.1].map((min) => (
                <button
                  key={min}
                  onClick={() => setPomoDuration(min)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500 hover:text-rose-500 transition-all active:scale-95"
                >
                  {min === 0.1 ? 'Test' : `${min}m`}
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-center items-center">
              <button
                onClick={togglePomo}
                className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg ${
                  isPomoRunning
                    ? 'bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-900 dark:text-rose-400'
                    : btnMain
                }`}
              >
                {isPomoRunning ? 'Pause' : 'Start Focus'}
              </button>

              {!isPomoRunning && pomoTime !== initialPomoTime && (
                <button
                  onClick={resetPomo}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-gray-400 hover:text-gray-600 shadow-sm border border-gray-200 dark:border-slate-600 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          // Stopwatch UI
          <div className="text-center animate-fade-in w-full">
            <div className="mb-6 flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isStopwatchRunning
                    ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600'
                }`}
              >
                {isStopwatchRunning ? 'Tracking' : 'Ready'}
              </span>
            </div>

            <div
              className={`text-7xl sm:text-8xl font-black mb-8 font-mono tracking-tighter transition-colors ${textMain}`}
            >
              {formatTime(stopwatchTime)}
            </div>

            <div className="flex gap-3 justify-center items-center">
              <button
                onClick={toggleStopwatch}
                className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg ${
                  isStopwatchRunning
                    ? 'bg-white border-2 border-indigo-100 text-indigo-500 hover:bg-indigo-50 dark:bg-slate-800 dark:border-indigo-900 dark:text-indigo-400'
                    : btnMain
                }`}
              >
                {isStopwatchRunning ? 'Pause' : 'Start'}
              </button>

              {!isStopwatchRunning && stopwatchTime > 0 && (
                <>
                  <button
                    onClick={handleStopwatchSave}
                    disabled={isSaving}
                    className="px-6 py-4 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={resetStopwatch}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-gray-400 hover:text-gray-600 shadow-sm border border-gray-200 dark:border-slate-600 transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                      />
                    </svg>
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
