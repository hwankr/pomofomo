'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

type Preset = {
  id: string;
  label: string;
  minutes: number;
};

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [pomoTime, setPomoTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomos, setAutoStartPomos] = useState(false);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [volume, setVolume] = useState(50);

  // ✨ 디폴트 프리셋 변경 (작업1, 2, 3)
  const [presets, setPresets] = useState<Preset[]>([
    { id: '1', label: '작업1', minutes: 25 },
    { id: '2', label: '작업2', minutes: 50 },
    { id: '3', label: '작업3', minutes: 90 },
  ]);

  useEffect(() => {
    const loadSettings = async () => {
      if (isOpen) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let loadedSettings = null;

        if (user) {
          const { data } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .single();
          if (data) loadedSettings = data.settings;
        }

        if (!loadedSettings) {
          const localSaved = localStorage.getItem('pomofomo_settings');
          if (localSaved) loadedSettings = JSON.parse(localSaved);
        }

        if (loadedSettings) {
          setPomoTime(loadedSettings.pomoTime ?? 25);
          setShortBreak(loadedSettings.shortBreak ?? 5);
          setLongBreak(loadedSettings.longBreak ?? 15);
          setAutoStartBreaks(loadedSettings.autoStartBreaks ?? false);
          setAutoStartPomos(loadedSettings.autoStartPomos ?? false);
          setLongBreakInterval(loadedSettings.longBreakInterval ?? 4);
          setVolume(loadedSettings.volume ?? 50);
          if (loadedSettings.presets && loadedSettings.presets.length > 0) {
            setPresets(loadedSettings.presets);
          }
        }
      }
    };
    loadSettings();
  }, [isOpen]);

  const handleSave = async () => {
    const newSettings = {
      pomoTime,
      shortBreak,
      longBreak,
      autoStartBreaks,
      autoStartPomos,
      longBreakInterval,
      volume,
      presets,
    };

    localStorage.setItem('pomofomo_settings', JSON.stringify(newSettings));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        settings: newSettings,
      });
    }

    toast.success('설정이 저장되었습니다!');
    onSave();
    onClose();
  };

  const addPreset = () => {
    // ✨ 3개 제한 기능 추가
    if (presets.length >= 3) {
      toast.error('프리셋은 최대 3개까지만 설정 가능합니다.');
      return;
    }
    setPresets([
      ...presets,
      { id: Date.now().toString(), label: '새 작업', minutes: 25 },
    ]);
  };

  const removePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  const updatePreset = (
    id: string,
    field: 'label' | 'minutes',
    value: string | number
  ) => {
    setPresets(
      presets.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  if (!isOpen) return null;

  const labelStyle =
    'text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block';
  const inputStyle =
    'w-full bg-gray-100 text-gray-700 p-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm';
  const toggleBase =
    'w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer';
  const toggleDot =
    'absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-gray-500 font-bold tracking-widest text-sm flex items-center gap-2">
            ⚙️ SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
          <section>
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-gray-400 text-xs font-bold flex items-center gap-2">
                🔥 바로가기 버튼 설정 (최대 3개)
              </h3>
              {/* 3개 이상이면 추가 버튼 숨김/비활성화 */}
              {presets.length < 3 && (
                <button
                  onClick={addPreset}
                  className="text-xs bg-rose-100 text-rose-500 px-2 py-1 rounded hover:bg-rose-200 transition-colors font-bold"
                >
                  + 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {presets.map((preset) => (
                <div key={preset.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={preset.label}
                    onChange={(e) =>
                      updatePreset(preset.id, 'label', e.target.value)
                    }
                    className={`${inputStyle} flex-grow`}
                    placeholder="이름"
                  />
                  <input
                    type="number"
                    value={preset.minutes}
                    onChange={(e) =>
                      updatePreset(preset.id, 'minutes', Number(e.target.value))
                    }
                    className={`${inputStyle} w-20 text-center`}
                    placeholder="분"
                  />
                  <button
                    onClick={() => removePreset(preset.id)}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </section>
          <hr className="border-gray-100" />
          <section>
            <h3 className="text-gray-400 text-xs font-bold mb-3">
              🕒 기본 시간 설정 (분)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 mb-1 block">
                  집중
                </span>
                <input
                  type="number"
                  value={pomoTime}
                  onChange={(e) => setPomoTime(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 mb-1 block">
                  짧은 휴식
                </span>
                <input
                  type="number"
                  value={shortBreak}
                  onChange={(e) => setShortBreak(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 mb-1 block">
                  긴 휴식
                </span>
                <input
                  type="number"
                  value={longBreak}
                  onChange={(e) => setLongBreak(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
            </div>
          </section>
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">
                휴식 자동 시작
              </span>
              <button
                onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                className={`${toggleBase} ${
                  autoStartBreaks ? 'bg-rose-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`${toggleDot} ${
                    autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">
                뽀모도로 자동 시작
              </span>
              <button
                onClick={() => setAutoStartPomos(!autoStartPomos)}
                className={`${toggleBase} ${
                  autoStartPomos ? 'bg-rose-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`${toggleDot} ${
                    autoStartPomos ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600 text-sm font-medium">
                긴 휴식 간격 (사이클)
              </span>
              <input
                type="number"
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                className="w-16 bg-gray-100 text-gray-700 p-1 rounded text-center font-bold focus:outline-none"
              />
            </div>
          </section>
          <hr className="border-gray-100" />
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-gray-400 text-xs font-bold">🔊 알림 볼륨</h3>
              <span className="text-gray-400 text-xs font-mono">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </section>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors shadow-lg text-sm"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
