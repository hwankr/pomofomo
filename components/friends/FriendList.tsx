'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface FriendListProps {
  session: Session;
  refreshTrigger: number;
}

interface Friendship {
  id: string;
  friend_email: string;
  created_at: string;
}

export default function FriendList({ session, refreshTrigger }: FriendListProps) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, [session, refreshTrigger]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, friend_email, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading friends...</div>;

  if (friends.length === 0) {
    return <div className="text-gray-500">No friends yet. Add some!</div>;
  }

  return (
    <ul className="space-y-3">
      {friends.map((friend) => (
        <li key={friend.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              {friend.friend_email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{friend.friend_email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Added {new Date(friend.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
