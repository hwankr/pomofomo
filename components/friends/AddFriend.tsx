'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AddFriendProps {
  session: Session;
  onFriendAdded: () => void;
}

export default function AddFriend({ session, onFriendAdded }: AddFriendProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Get User ID by email
      const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
        email_input: email,
      });

      if (userError) throw userError;
      if (!userId) {
        setMessage({ type: 'error', text: 'User not found with this email.' });
        setLoading(false);
        return;
      }

      if (userId === session.user.id) {
        setMessage({ type: 'error', text: 'You cannot add yourself.' });
        setLoading(false);
        return;
      }

      // 2. Send Friend Request
      const { error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: session.user.id,
          receiver_id: userId,
          sender_email: session.user.email,
          receiver_email: email,
        });

      if (requestError) {
        if (requestError.code === '23505') { // Unique violation
          setMessage({ type: 'error', text: 'Friend request already sent or exists.' });
        } else {
          throw requestError;
        }
      } else {
        setMessage({ type: 'success', text: 'Friend request sent!' });
        setEmail('');
        onFriendAdded();
      }
    } catch (error: any) {
      console.error('Error adding friend:', error);
      setMessage({ type: 'error', text: 'Failed to send request. ' + (error.message || '') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddFriend} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Friend's Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Request'}
      </button>
    </form>
  );
}
