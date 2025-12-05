import { Session } from '@supabase/supabase-js';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AddFriend from './AddFriend';
import FriendRequestList from './FriendRequestList';
import FriendList from './FriendList';
import Navbar from '../Navbar';
import { useTheme } from '../ThemeProvider';

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

  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <Navbar
        session={session}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        onOpenLogin={() => supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        })}
      />

      <main className="max-w-6xl mx-auto">
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
