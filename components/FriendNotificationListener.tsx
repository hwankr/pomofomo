'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

type FriendProfile = {
    id: string;
    username: string;
    nickname?: string;
    status: 'online' | 'offline' | 'studying' | 'paused';
};

type Friendship = {
    friend_id: string;
    nickname: string | null;
    friend_email: string | null;
    is_notification_enabled: boolean;
};

export default function FriendNotificationListener() {
    const [userId, setUserId] = useState<string | null>(null);
    const friendsRef = useRef<Map<string, Friendship>>(new Map());
    const profilesRef = useRef<Map<string, FriendProfile>>(new Map());

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch initial friends list with notification settings
            const { data: friendships } = await supabase
                .from('friendships')
                .select('friend_id, nickname, friend_email, is_notification_enabled')
                .eq('user_id', user.id);

            if (friendships) {
                friendships.forEach((f: any) => {
                    friendsRef.current.set(f.friend_id, {
                        friend_id: f.friend_id,
                        nickname: f.nickname,
                        friend_email: f.friend_email,
                        is_notification_enabled: f.is_notification_enabled ?? true,
                    });
                });
            }

            // Fetch initial profiles of friends to know their names
            if (friendships && friendships.length > 0) {
                const friendIds = friendships.map((f: any) => f.friend_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, status')
                    .in('id', friendIds);

                if (profiles) {
                    profiles.forEach((p: any) => {
                        profilesRef.current.set(p.id, p);
                    });
                }
            }
        };

        init();

        // Subscribe to friendship changes (to update notification settings or add/remove friends)
        const friendshipChannel = supabase
            .channel('friend-notification-settings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friendships',
                    filter: userId ? `user_id=eq.${userId}` : undefined,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newFriend = payload.new as any;
                        friendsRef.current.set(newFriend.friend_id, {
                            friend_id: newFriend.friend_id,
                            nickname: newFriend.nickname,
                            friend_email: newFriend.friend_email,
                            is_notification_enabled: newFriend.is_notification_enabled ?? true,
                        });
                    } else if (payload.eventType === 'DELETE') {
                        // Just re-fetch friends on any change to be safe and simple.
                        init();
                    }
                }
            )
            .subscribe();

        // Subscribe to profile changes (status updates)
        const profileChannel = supabase
            .channel('friend-status-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    const newProfile = payload.new as FriendProfile;

                    // Check if this user is a friend
                    const friendConfig = friendsRef.current.get(newProfile.id);
                    if (!friendConfig) return;

                    // Check previous status from cache BEFORE updating it
                    const cachedProfile = profilesRef.current.get(newProfile.id);
                    const wasStudying = cachedProfile?.status === 'studying';

                    if (newProfile.status === 'studying' && friendConfig.is_notification_enabled) {
                        if (!wasStudying) {
                            const name = friendConfig.nickname || friendConfig.friend_email || newProfile.username || '친구';
                            toast(`${name} 님이 공부를 시작했습니다! 🔥`, {
                                icon: '✏️',
                                duration: 4000,
                                position: 'top-right',
                                style: {
                                    background: '#fff',
                                    color: '#333',
                                    border: '1px solid #e5e7eb',
                                },
                            });
                        }
                    }

                    // Now update cache
                    profilesRef.current.set(newProfile.id, newProfile);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(friendshipChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [userId]);

    return null;
}
