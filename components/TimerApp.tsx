"use client";

import { useState, useRef, useEffect } from "react";

// 시간을 "00:00:00" 형태로 예쁘게 바꿔주는 도우미 함수
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  // 숫자가 10보다 작으면 앞에 0을 붙임 (예: 9 -> 09)
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function TimerApp() {
  const [mode, setMode] = useState<"pomo" | "stopwatch">("pomo");
  
  // --- 스톱워치 관련 변수들 ---
  const [stopwatchTime, setStopwatchTime] = useState(0); // 흐른 시간 (초)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false); // 작동 중인가?
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null); // 타이머 ID 저장소

  // 스톱워치 시작/정지 버튼을 눌렀을 때
  const toggleStopwatch = () => {
    if (isStopwatchRunning) {
      // 멈추기
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      setIsStopwatchRunning(false);
    } else {
      // 시작하기 (1초마다 1씩 증가)
      setIsStopwatchRunning(true);
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // 스톱워치 리셋 버튼
  const resetStopwatch = () => {
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  // 화면이 꺼지거나 모드가 바뀔 때 타이머 정리 (청소)
  useEffect(() => {
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* 상단 탭 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setMode("pomo")}
          className={`flex-1 py-4 text-lg font-medium transition-colors ${
            mode === "pomo" ? "bg-gray-700 text-red-400" : "bg-gray-800 text-gray-500 hover:bg-gray-750"
          }`}
        >
          뽀모도로
        </button>
        <button
          onClick={() => setMode("stopwatch")}
          className={`flex-1 py-4 text-lg font-medium transition-colors ${
            mode === "stopwatch" ? "bg-gray-700 text-blue-400" : "bg-gray-800 text-gray-500 hover:bg-gray-750"
          }`}
        >
          스톱워치
        </button>
      </div>

      {/* 메인 화면 */}
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
        {mode === "pomo" ? (
          <div className="text-center animate-fade-in">
            <div className="text-6xl font-bold text-red-400 mb-8 font-mono">
              25:00
            </div>
            <p className="text-gray-400">집중할 시간입니다! (기능 준비중)</p>
          </div>
        ) : (
          <div className="text-center animate-fade-in w-full">
            {/* 스톱워치 시간 표시 */}
            <div className="text-6xl font-bold text-blue-400 mb-8 font-mono tabular-nums">
              {formatTime(stopwatchTime)}
            </div>
            
            {/* 버튼들 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={toggleStopwatch}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                  isStopwatchRunning
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50" // 정지 상태 디자인
                    : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30"   // 시작 상태 디자인
                }`}
              >
                {isStopwatchRunning ? "일시정지" : "공부 시작"}
              </button>
              
              {/* 리셋 버튼은 시간이 0보다 클 때만 보여줍니다 */}
              {stopwatchTime > 0 && (
                <button
                  onClick={resetStopwatch}
                  className="px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}