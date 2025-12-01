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
    <ul className="space-y-4">
      {friends.map((friend) => (
        <li key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{friend.friend_email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Added {new Date(friend.created_at).toLocaleDateString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
