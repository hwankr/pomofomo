'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LeaderboardItem from '@/components/LeaderboardItem';
import { Lock, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Mock data for blurred background
const MOCK_ITEMS = Array.from({ length: 15 }, (_, i) => ({
  rank: i + 1,
  nickname: `User ${i + 1}`,
  total_duration: 36000 - i * 1000,
  user_id: `mock-${i}`
}));

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  useEffect(() => {
    checkParticipation();
  }, []);

  useEffect(() => {
    if (participating) {
      fetchLeaderboard();
    }
  }, [participating, selectedYear, selectedMonth]);

  const checkParticipation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_leaderboard_participant')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setParticipating(profile?.is_leaderboard_participant || false);
    } catch (error) {
      console.error('Error checking participation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Use the RPC function we defined
      const { data, error } = await supabase
        .rpc('get_monthly_leaderboard', {
          target_year: selectedYear,
          target_month: selectedMonth
        });

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleJoin = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ is_leaderboard_participant: true })
        .eq('id', currentUser.id);

      if (error) throw error;

      setParticipating(true);
    } catch (error) {
      console.error('Error joining leaderboard:', error);
      alert("Failed to join leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 pb-24">
      <div className="flex flex-col items-center mb-8 space-y-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Monthly Rankings
        </h1>
        
        <div className="flex items-center gap-4 bg-muted p-1 rounded-lg">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-background/80 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-medium min-w-[100px] text-center">
            {selectedYear}. {selectedMonth.toString().padStart(2, '0')}
          </span>
          
          <button 
            onClick={handleNextMonth}
            disabled={
              selectedYear === currentDate.getFullYear() && 
              selectedMonth === currentDate.getMonth() + 1
            }
            className="p-2 hover:bg-background/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[500px] border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden rounded-xl shadow-sm">
        {!participating ? (
          // Wrapped in a relative container to position overlay correctly
          <div className="relative p-6">
            {/* Blurred Background Content */}
            <div className="filter blur-md opacity-50 select-none pointer-events-none">
              {MOCK_ITEMS.map((item) => (
                <LeaderboardItem
                  key={item.rank}
                  rank={item.rank}
                  nickname={item.nickname}
                  totalDuration={item.total_duration}
                />
              ))}
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20 z-10 p-6 text-center">
              <div className="bg-card p-8 rounded-xl shadow-2xl border border-border max-w-sm w-full space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Join to View Rankings</h3>
                  <p className="text-muted-foreground text-sm">
                    Compete with other users and track your progress. 
                    Your study time will be visible to other participants.
                  </p>
                </div>
                
                {currentUser ? (
                  <button 
                    onClick={handleJoin} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? "Joining..." : "Participate Now"}
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    className="w-full block bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg transition-colors text-center"
                  >
                    Login to Participate
                  </Link>
                )}
                
                <p className="text-xs text-muted-foreground mt-4">
                  * Only your nickname and study time will be shown.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Actual Leaderboard Content
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">Loading...</div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No participants yet this month. Be the first!
              </div>
            ) : (
              leaderboardData.map((item) => (
                <LeaderboardItem
                  key={item.user_id}
                  rank={item.rank}
                  nickname={item.nickname}
                  totalDuration={item.total_duration}
                  isCurrentUser={currentUser?.id === item.user_id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
