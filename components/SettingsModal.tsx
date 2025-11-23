'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // 저장이 완료되면 부모에게 알림
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
}: SettingsModalProps) {
  // 기본 설정값
  const [pomoTime, setPomoTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomos, setAutoStartPomos] = useState(false);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [volume, setVolume] = useState(50);

  // 모달 열릴 때 저장된 값 불러오기
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('pomofomo_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPomoTime(parsed.pomoTime || 25);
        setShortBreak(parsed.shortBreak || 5);
        setLongBreak(parsed.longBreak || 15);
        setAutoStartBreaks(parsed.autoStartBreaks || false);
        setAutoStartPomos(parsed.autoStartPomos || false);
        setLongBreakInterval(parsed.longBreakInterval || 4);
        setVolume(parsed.volume || 50);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    const settings = {
      pomoTime,
      shortBreak,
      longBreak,
      autoStartBreaks,
      autoStartPomos,
      longBreakInterval,
      volume,
    };
    localStorage.setItem('pomofomo_settings', JSON.stringify(settings));
    toast.success('설정이 저장되었습니다!');
    onSave(); // 타이머에게 "설정 바뀌었으니 새로고침해!" 라고 알림
    onClose();
  };

  if (!isOpen) return null;

  // 공통 스타일
  const labelStyle = 'text-gray-400 text-sm font-bold uppercase tracking-wider';
  const inputStyle =
    'w-full bg-gray-100 text-gray-700 p-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all';
  const toggleBase =
    'w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer';
  const toggleDot =
    'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-gray-400 font-bold tracking-widest text-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38c-.551-.318-1.26-.117-1.527.461a20.845 20.845 0 01-1.44 4.282m3.102-.069a18.03 18.03 0 01.59 4.59c0 1.586-.205 3.124-.59 4.59m0-9.18a23.848 23.848 0 01-8.835-2.535"
              />
            </svg>
            SETTING
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 스크롤 영역 */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* 1. 시간 설정 */}
          <section>
            <h3 className="text-gray-400 text-xs font-bold mb-4 flex items-center gap-2">
              🕒 TIMER
            </h3>
            <div className="mb-3">
              <label className={labelStyle}>Time (minutes)</label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-400 mb-1 block">
                  Pomodoro
                </span>
                <input
                  type="number"
                  value={pomoTime}
                  onChange={(e) => setPomoTime(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
              <div>
                <span className="text-xs text-gray-400 mb-1 block">
                  Short Break
                </span>
                <input
                  type="number"
                  value={shortBreak}
                  onChange={(e) => setShortBreak(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>
              <div>
                <span className="text-xs text-gray-400 mb-1 block">
                  Long Break
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

          {/* 2. 토글 옵션 */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Auto Start Breaks</span>
              <button
                onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                className={`${toggleBase} ${
                  autoStartBreaks ? 'bg-green-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`${toggleDot} ${
                    autoStartBreaks ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">
                Auto Start Pomodoros
              </span>
              <button
                onClick={() => setAutoStartPomos(!autoStartPomos)}
                className={`${toggleBase} ${
                  autoStartPomos ? 'bg-green-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`${toggleDot} ${
                    autoStartPomos ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600 font-bold">
                Long Break Interval
              </span>
              <input
                type="number"
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(Number(e.target.value))}
                className="w-20 bg-gray-100 text-gray-700 p-2 rounded-lg text-center font-bold focus:outline-none"
              />
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 3. 소리 설정 */}
          <section>
            <h3 className="text-gray-400 text-xs font-bold mb-4 flex items-center gap-2">
              🔊 SOUND
            </h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-bold">Alarm Volume</span>
              <span className="text-gray-400 font-mono">{volume}</span>
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

        {/* 하단 저장 버튼 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors shadow-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
