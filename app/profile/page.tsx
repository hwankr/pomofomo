'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ContributionGraph from '@/components/profile/ContributionGraph';
import StudyReport from '@/components/StudyReport';
import { useStudyStats } from '@/hooks/useStudyStats';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const { fetchStats, heatmapData, totalFocusTime, loading } = useStudyStats();

  useEffect(() => {
    const getUserAndStats = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        // Fetch stats to populate heatmap and total time
        // We use 'year' mode to ensure we get a broad range if needed,
        // though the hook fetches allSessions regardless.
        fetchStats('year', new Date());
      }
    };
    getUserAndStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <section>
          <ProfileHeader user={user} totalFocusTime={totalFocusTime} />
        </section>

        {/* Contribution Graph Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span>공부 기록</span>
            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                최근 365일
            </span>
          </h2>
          {loading && heatmapData.length === 0 ? (
               <div className="h-32 flex items-center justify-center text-gray-400 text-sm">잔디 심는 중...</div>
          ) : (
               <ContributionGraph data={heatmapData} />
          )}
        </section>

        {/* Detailed Report Section */}
        <section>
           <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 px-2">상세 리포트</h2>
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
             <StudyReport />
           </div>
        </section>

      </div>
    </div>
  );
}
