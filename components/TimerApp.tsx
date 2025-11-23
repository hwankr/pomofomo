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

type Preset = {
  id: string;
  label: string;
  minutes: number;
};

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
  const isRunningRef = useRef(false);

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
    presets: [
      { id: '1', label: '작업1', minutes: 25 },
      { id: '2', label: '작업2', minutes: 50 },
      { id: '3', label: '작업3', minutes: 90 },
    ] as Preset[],
  });

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem('pomofomo_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          presets:
            parsed.presets && parsed.presets.length > 0
              ? parsed.presets
              : prev.presets,
        }));

        if (!isRunningRef.current) {
          if (timerMode === 'focus') setTimeLeft(parsed.pomoTime * 60);
          else if (timerMode === 'shortBreak')
            setTimeLeft(parsed.shortBreak * 60);
          else if (timerMode === 'longBreak')
            setTimeLeft(parsed.longBreak * 60);
        }
      }
      setIsLoaded(true);
    };
    load();
  }, [settingsUpdated]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const playAlarm = () => {
    try {
      const audio = new Audio('/alarm.mp3');
      audio.volume = settings.volume / 100;
      audio.play();
    } catch (error) {
      console.error(error);
    }
  };

  // ✨ [핵심 로직 수정] 시간 기록 함수
  // rawSeconds: 실제 흐른 초 (예: 110초)
  const saveRecord = async (recordMode: string, rawSeconds: number) => {
    // 1. 분 단위 계산 (내림 처리) -> 110초면 1분
    const minutes = Math.floor(rawSeconds / 60);

    // 2. 1분 미만이면 저장 안 함 (0분)
    if (minutes < 1) {
      // 너무 짧으면 로그만 남기고 종료 (사용자에게 알림은 안 띄움, 귀찮으니까)
      console.log('1분 미만이라 기록되지 않음');
      return;
    }

    // 3. 저장할 시간은 다시 초 단위로 환산 (DB가 초 단위니까)
    // 1분 -> 60초 저장 (50초는 버림)
    const durationToSave = minutes * 60;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);
    const toastId = toast.loading('기록 저장 중...', {
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
        duration: durationToSave, // ✨ 버림 처리된 시간 저장
        user_id: user.id,
      });
      if (error) throw error;
      // 몇 분 저장됐는지 알려주면 더 좋음
      toast.success(`${minutes}분 기록 저장 완료!`, { id: toastId });
    } catch (e) {
      toast.error('저장 실패', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ✨ [추가됨] 뽀모도로 중도 포기 시, 한 만큼 저장하는 함수
  const savePartialProgress = () => {
    // 전체 시간 - 남은 시간 = 공부한 시간
    const fullTime =
      timerMode === 'focus'
        ? settings.pomoTime * 60
        : timerMode === 'shortBreak'
        ? settings.shortBreak * 60
        : settings.longBreak * 60;

    const elapsed = fullTime - timeLeft;

    // 공부한 시간이 있고, 완료된 상태(0초)가 아니라면 저장 시도
    if (elapsed > 0 && timeLeft > 0) {
      const type = timerMode === 'focus' ? 'pomo' : 'break';
      // 여기서 saveRecord를 호출하면 "1분 미만 버림" 로직이 자동 적용됨
      saveRecord(type, elapsed);
    }
  };

  // 🍅 타이머 완료 로직
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

      // 완료 시에는 전체 시간 저장
      saveRecord(timerMode === 'focus' ? 'pomo' : 'break', duration * 60);

      if (timerMode === 'focus') {
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);

        if (newCycle % settings.longBreakInterval === 0) {
          setTimerMode('longBreak');
          setTimeLeft(settings.longBreak * 60);
          toast('🎉 긴 휴식 시간입니다!', { icon: '☕' });
          if (settings.autoStartBreaks)
            setTimeout(() => setIsRunning(true), 1000);
        } else {
          setTimerMode('shortBreak');
          setTimeLeft(settings.shortBreak * 60);
          toast('잠시 휴식하세요.', { icon: '☕' });
          if (settings.autoStartBreaks)
            setTimeout(() => setIsRunning(true), 1000);
        }
      } else {
        setTimerMode('focus');
        setTimeLeft(settings.pomoTime * 60);
        toast('다시 집중할 시간입니다!', { icon: '🔥' });
        if (settings.autoStartPomos) setTimeout(() => setIsRunning(true), 1000);
      }
    }
  }, [timeLeft, isRunning, timerMode, settings, cycleCount]);

  const toggleTimer = () => {
    if (isStopwatchRunning) {
      toast.error('스톱워치가 작동 중입니다.\n먼저 정지해주세요.', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return;
    }

    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
    } else {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
  };

  const changeTimerMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    // 모드 변경 시에도 하던 거 저장 (예: 집중하다가 휴식 누름)
    savePartialProgress();

    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
    }
    setTimerMode(mode);
    if (mode === 'focus') setTimeLeft(settings.pomoTime * 60);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
    else setTimeLeft(settings.longBreak * 60);
  };

  const handlePresetClick = (minutes: number) => {
    if (isRunning) {
      toast.error('타이머가 작동 중입니다.\n먼저 정지해주세요.', {
        icon: '🚫',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return;
    }

    // 프리셋 눌러서 시간 바뀔 때도 기존 시간 저장할지?
    // 보통 멈춰있는 상태에서 바꾸는 거라 저장은 생략하거나, 필요하면 savePartialProgress() 추가
    // 여기선 멈춰있을 때만 동작하므로 패스.

    setTimerMode('focus');
    setTimeLeft(minutes * 60);
    setSettings((prev) => ({ ...prev, pomoTime: minutes }));

    toast.success(`${minutes === 0.1 ? '5초' : minutes + '분'}으로 설정됨`, {
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  const toggleStopwatch = () => {
    if (isRunning) {
      toast.error('뽀모도로 타이머가 작동 중입니다.\n먼저 정지해주세요.', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return;
    }

    if (isStopwatchRunning) {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      setIsStopwatchRunning(false);
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
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
  };

  // ✨ 수동 초기화 (중도 포기)
  const resetTimerManual = () => {
    // 초기화 버튼 누르면 지금까지 한 거 저장!
    savePartialProgress();

    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (timerMode === 'focus') setTimeLeft(settings.pomoTime * 60);
    else if (timerMode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
    else setTimeLeft(settings.longBreak * 60);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, []);

  const getThemeStyles = () => {
    if (tab === 'stopwatch') {
      return {
        bgLight: 'bg-indigo-50',
        bgDark: 'dark:bg-indigo-950/30',
        textMain: 'text-indigo-500 dark:text-indigo-400',
        btnMain: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200',
        modeBtnActive: 'bg-indigo-500 text-white border-indigo-500 shadow-sm',
      };
    }

    if (timerMode === 'shortBreak' || timerMode === 'longBreak') {
      return {
        bgLight: 'bg-emerald-50',
        bgDark: 'dark:bg-emerald-950/30',
        textMain: 'text-emerald-500 dark:text-emerald-400',
        btnMain: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
        modeBtnActive: 'bg-emerald-500 text-white border-emerald-500 shadow-sm',
      };
    }

    return {
      bgLight: 'bg-rose-50',
      bgDark: 'dark:bg-rose-950/30',
      textMain: 'text-rose-500 dark:text-rose-400',
      btnMain: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200',
      modeBtnActive: 'bg-rose-500 text-white border-rose-500 shadow-sm',
    };
  };

  const theme = getThemeStyles();

  const modeBtnBase =
    'px-5 py-2 rounded-full text-sm font-bold border-2 transition-all';
  const modeBtnInactive =
    'text-gray-400 border-transparent hover:bg-black/5 dark:hover:bg-white/5';

  const currentMaxTime =
    timerMode === 'focus'
      ? settings.pomoTime * 60
      : timerMode === 'shortBreak'
      ? settings.shortBreak * 60
      : settings.longBreak * 60;

  const showReset = timeLeft !== currentMaxTime;

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900/50 m-2 rounded-2xl">
        <button
          onClick={() => setTab('timer')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            tab === 'timer'
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          타이머
        </button>
        <button
          onClick={() => setTab('stopwatch')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            tab === 'stopwatch'
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          스톱워치
        </button>
      </div>

      <div
        className={`px-10 py-6 flex flex-col items-center justify-center min-h-[360px] transition-colors duration-500 ${theme.bgLight} ${theme.bgDark}`}
      >
        {!isLoaded ? (
          <div className="text-gray-400 animate-pulse">설정 불러오는 중...</div>
        ) : tab === 'timer' ? (
          <div className="text-center animate-fade-in w-full">
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => changeTimerMode('focus')}
                className={`${modeBtnBase} ${
                  timerMode === 'focus' ? theme.modeBtnActive : modeBtnInactive
                }`}
              >
                뽀모도로
              </button>
              <button
                onClick={() => changeTimerMode('shortBreak')}
                className={`${modeBtnBase} ${
                  timerMode === 'shortBreak'
                    ? theme.modeBtnActive
                    : modeBtnInactive
                }`}
              >
                짧은 휴식
              </button>
              <button
                onClick={() => changeTimerMode('longBreak')}
                className={`${modeBtnBase} ${
                  timerMode === 'longBreak'
                    ? theme.modeBtnActive
                    : modeBtnInactive
                }`}
              >
                긴 휴식
              </button>
            </div>

            <div
              className={`text-7xl sm:text-8xl font-bold mb-4 font-mono tracking-tighter transition-colors ${theme.textMain}`}
            >
              {formatTime(timeLeft)}
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {settings.presets &&
                settings.presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.minutes)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500 hover:text-rose-500 transition-all active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
            </div>

            {timerMode === 'focus' && (
              <div className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-6 opacity-90 tracking-wider">
                사이클 {cycleCount} / {settings.longBreakInterval}
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 shadow-lg ${theme.btnMain} dark:shadow-none w-40`}
              >
                {isRunning ? '일시정지' : '시작'}
              </button>

              {!isRunning && showReset && (
                <button
                  onClick={resetTimerManual}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-gray-400 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all animate-fade-in shadow-sm"
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
              )}
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in w-full">
            <div className="mb-6 text-sm font-bold text-indigo-400 uppercase tracking-widest">
              스톱워치
            </div>

            <div className="text-7xl sm:text-8xl font-bold mb-10 font-mono tracking-tighter text-indigo-500 dark:text-indigo-400">
              {formatTime(stopwatchTime)}
            </div>

            <div className="flex gap-4 justify-center items-center">
              <button
                onClick={toggleStopwatch}
                className="px-10 py-4 rounded-2xl font-bold text-lg text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 w-40"
              >
                {isStopwatchRunning ? '일시정지' : '시작'}
              </button>

              {!isStopwatchRunning && stopwatchTime > 0 && (
                <>
                  <button
                    onClick={handleStopwatchSave}
                    disabled={isSaving}
                    className="px-5 py-4 rounded-2xl font-bold text-white bg-gray-800 hover:bg-black transition-all shadow-sm"
                  >
                    저장
                  </button>
                  <button
                    onClick={resetStopwatch}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-700 text-gray-400 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all shadow-sm"
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
