'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  subDays,
} from 'date-fns';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [totalFocusTime, setTotalFocusTime] = useState(0); // 총 누적 시간
  const [todayFocusTime, setTodayFocusTime] = useState(0); // 오늘 시간
  const [loading, setLoading] = useState(true);

  // 초(Seconds)를 "00h 00m" 형태로 변환
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const fetchReportData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    // 이번 주 월요일 ~ 일요일 구하기
    const start = startOfWeek(today, { weekStartsOn: 1 }); // 월요일 시작
    const end = endOfWeek(today, { weekStartsOn: 1 });

    // 1. 이번 주 데이터 가져오기
    const { data: weeklySessions } = await supabase
      .from('study_sessions')
      .select('duration, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // 2. 전체 누적 데이터 가져오기 (총 시간용)
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('duration')
      .eq('user_id', user.id);

    // --- 데이터 가공 ---

    // A. 총 누적 시간 계산
    const totalSeconds =
      allSessions?.reduce((acc, curr) => acc + curr.duration, 0) || 0;
    setTotalFocusTime(totalSeconds);

    // B. 오늘 시간 계산
    const todaySeconds =
      weeklySessions
        ?.filter((s) => isSameDay(new Date(s.created_at), today))
        .reduce((acc, curr) => acc + curr.duration, 0) || 0;
    setTodayFocusTime(todaySeconds);

    // C. 그래프용 데이터 만들기 (월~일 빈 통 채우기)
    const days = eachDayOfInterval({ start, end });
    const chartData = days.map((day) => {
      // 해당 날짜의 기록 다 더하기
      const daySeconds =
        weeklySessions
          ?.filter((s) => isSameDay(new Date(s.created_at), day))
          .reduce((acc, curr) => acc + curr.duration, 0) || 0;

      // 그래프에는 '시간(Hour)' 단위로 표시 (소수점 1자리)
      return {
        name: format(day, 'EEE'), // Mon, Tue...
        hours: parseFloat((daySeconds / 3600).toFixed(1)),
        fullDate: format(day, 'yyyy-MM-dd'),
      };
    });

    setWeeklyData(chartData);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      {/* 모달 박스 */}
      <div className="bg-gray-900 border border-gray-700 text-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-400 p-2 rounded-lg">
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
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </span>
            <h2 className="text-xl font-bold">학습 리포트</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="h-60 flex items-center justify-center text-gray-500 animate-pulse">
              데이터 분석 중...
            </div>
          ) : (
            <>
              {/* 1. 요약 카드 섹션 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                    Total Hours
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">
                    {Math.floor(totalFocusTime / 3600)}
                    <span className="text-lg text-gray-500 ml-1">h</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    총 누적 집중 시간
                  </div>
                </div>
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                    Today
                  </div>
                  <div className="text-3xl font-mono font-bold text-red-400">
                    {formatDuration(todayFocusTime)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    오늘 집중 시간
                  </div>
                </div>
              </div>

              {/* 2. 그래프 섹션 */}
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-sm font-bold text-gray-300 mb-6 flex items-center gap-2">
                  📅 이번 주 학습 통계{' '}
                  <span className="text-xs font-normal text-gray-500">
                    (단위: 시간)
                  </span>
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          borderColor: '#374151',
                          color: '#fff',
                        }}
                        formatter={(value: number) => [
                          `${value} 시간`,
                          '집중 시간',
                        ]}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {weeklyData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.hours > 0 ? '#f87171' : '#374151'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
