import { Session } from '@supabase/supabase-js';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AddFriend from './AddFriend';
import FriendRequestList from './FriendRequestList';
import FriendList from './FriendList';
import TimerStatus from '../TimerStatus';

interface FriendsDashboardProps {
  session: Session | null;
}

export default function FriendsDashboard({ session }: FriendsDashboardProps) {
  // Shared state refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Timer</span>
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
          <h1 className="text-xl font-bold tracking-tight">Friends</h1>
          <div className="hidden sm:block">
            <TimerStatus />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {session?.user?.email || 'Guest'}
          </div>
          {session ? (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Log out
            </button>
          ) : (
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin,
                },
              })}
              className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {!session ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <p className="text-gray-500">Please sign in to manage friends.</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column: Add Friend & Requests */}
              <div className="contents lg:flex lg:flex-col lg:col-span-4 lg:space-y-6">
                <div className="order-1 space-y-6">
                  <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">친구 추가</h2>
                    <AddFriend session={session} onFriendAdded={refreshData} />
                  </section>

                  <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">받은 요청</h2>
                    <FriendRequestList session={session} refreshTrigger={refreshTrigger} onUpdate={refreshData} />
                  </section>
                </div>
              </div>

              {/* Right Column: My Friends */}
              <div className="contents lg:flex lg:flex-col lg:col-span-8 lg:space-y-6">
                <div className="order-2 h-full">
                  <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">친구 목록</h2>
                    <FriendList session={session} refreshTrigger={refreshTrigger} />
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
