'use client';

import { Session } from '@supabase/supabase-js';
import { useState } from 'react';
import AddFriend from './AddFriend';
import FriendRequestList from './FriendRequestList';
import FriendList from './FriendList';

interface FriendsDashboardProps {
  session: Session | null;
}

export default function FriendsDashboard({ session }: FriendsDashboardProps) {
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Please sign in to manage friends.</p>
      </div>
    );
  }

  // Shared state refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Friends</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Friend</h2>
              <AddFriend session={session} onFriendAdded={refreshData} />
            </section>

            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Friend Requests</h2>
              <FriendRequestList session={session} refreshTrigger={refreshTrigger} onUpdate={refreshData} />
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">My Friends</h2>
              <FriendList session={session} refreshTrigger={refreshTrigger} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
