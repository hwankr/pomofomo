'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface FriendRequestListProps {
  session: Session;
  refreshTrigger: number;
  onUpdate: () => void;
}

interface FriendRequest {
  id: string;
  sender_email: string;
  created_at: string;
}

export default function FriendRequestList({ session, refreshTrigger, onUpdate }: FriendRequestListProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [session, refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, sender_email, created_at')
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
      if (error) throw error;
      onUpdate();
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      onUpdate();
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  if (loading) return <div className="text-gray-500">Loading requests...</div>;

  if (requests.length === 0) {
    return <div className="text-gray-500">No pending friend requests.</div>;
  }

  return (
    <ul className="space-y-4">
      {requests.map((req) => (
        <li key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="mb-2 sm:mb-0">
            <p className="font-medium text-gray-900 dark:text-white">{req.sender_email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(req.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleAccept(req.id)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(req.id)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
