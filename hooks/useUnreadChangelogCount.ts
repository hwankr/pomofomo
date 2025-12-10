import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'fomopomo_changelog_last_viewed';

export function useUnreadChangelogCount() {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    try {
      // 1. Get latest changelog
      const { data: latestChangelog, error } = await supabase
        .from('changelogs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !latestChangelog) {
        setHasUnread(false);
        return;
      }

      // 2. Get last viewed time from localStorage
      const lastViewed = localStorage.getItem(STORAGE_KEY);
      
      if (!lastViewed) {
        // Never viewed -> has unread
        setHasUnread(true);
        return;
      }

      // 3. Compare
      const latestTime = new Date(latestChangelog.created_at).getTime();
      const lastViewedTime = new Date(lastViewed).getTime();
      
      setHasUnread(latestTime > lastViewedTime);
    } catch (e) {
      console.error('Error checking unread changelog:', e);
      setHasUnread(false);
    }
  }, []);

  const markAsRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setHasUnread(false);
  }, []);

  useEffect(() => {
    checkUnread();

    // Subscribe to new changelogs
    const channel = supabase
      .channel('changelog-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'changelogs' },
        () => {
          setHasUnread(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkUnread]);

  return { hasUnread, markAsRead };
}
