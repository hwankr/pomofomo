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
} from 'date-fns';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const [loading, setLoading] = useState(true);

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
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });

    const { data: weeklySessions } = await supabase
      .from('study_sessions')
      .select('duration, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('duration')
      .eq('user_id', user.id);

    const totalSeconds =
      allSessions?.reduce((acc, curr) => acc + curr.duration, 0) || 0;
    setTotalFocusTime(totalSeconds);

    const todaySeconds =
      weeklySessions
        ?.filter((s) => isSameDay(new Date(s.created_at), today))
        .reduce((acc, curr) => acc + curr.duration, 0) || 0;
    setTodayFocusTime(todaySeconds);

    const days = eachDayOfInterval({ start, end });
    const chartData = days.map((day) => {
      const daySeconds =
        weeklySessions
          ?.filter((s) => isSameDay(new Date(s.created_at), day))
          .reduce((acc, curr) => acc + curr.duration, 0) || 0;

      return {
        name: format(day, 'EEE'),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
      {/* ✨ 모달 디자인 수정 ✨
        bg-white (라이트모드 배경) / dark:bg-slate-800 (다크모드 배경)
        text-gray-900 (라이트모드 글씨) / dark:text-white (다크모드 글씨)
      */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400 p-2 rounded-xl">
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Weekly Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
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
            <div className="h-60 flex items-center justify-center text-gray-400 animate-pulse">
              Analyzing data...
            </div>
          ) : (
            <>
              {/* 1. 요약 카드 섹션 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-600">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                    Total Hours
                  </div>
                  <div className="text-3xl font-mono font-bold text-gray-800 dark:text-white">
                    {Math.floor(totalFocusTime / 3600)}
                    <span className="text-lg text-gray-400 ml-1">h</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    누적 집중 시간
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-600">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                    Today
                  </div>
                  <div className="text-3xl font-mono font-bold text-rose-500 dark:text-rose-400">
                    {formatDuration(todayFocusTime)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    오늘 집중 시간
                  </div>
                </div>
              </div>

              {/* 2. 그래프 섹션 */}
              <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-600">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-6 flex items-center gap-2">
                  📅 이번 주 통계
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af" // 회색 (라이트/다크 모두 잘 보임)
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          borderColor: '#374151',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
                            // 값이 있으면 빨간색, 없으면 연한 회색(라이트) or 진한 회색(다크)
                            className={
                              entry.hours > 0
                                ? 'fill-rose-400 dark:fill-rose-500'
                                : 'fill-gray-200 dark:fill-slate-600'
                            }
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
