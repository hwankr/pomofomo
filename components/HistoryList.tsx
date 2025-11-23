'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type StudySession = {
  id: number;
  mode: string;
  duration: number;
  created_at: string;
};

export default function HistoryList() {
  const [history, setHistory] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5); // 5개만 보여줘서 깔끔하게

      if (error) throw error;
      if (data) setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mt-4">
      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent Activity
        </h3>
        <button
          onClick={fetchHistory}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Loading...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No records yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      item.mode === 'pomo'
                        ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/30'
                        : 'bg-indigo-100 text-indigo-500 dark:bg-indigo-900/30'
                    }`}
                  >
                    {item.mode === 'pomo' ? '🍅' : '⏱️'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                      {item.mode === 'pomo' ? 'Pomodoro' : 'Stopwatch'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-gray-800 dark:text-white">
                  {formatDuration(item.duration)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
