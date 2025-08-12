import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LastSeenMap = Record<string, string | null>;

export const usePresence = (friendIds: string[]) => {
  const { user } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<LastSeenMap>({});

  // Load last seen for friends
  const loadLastSeen = async () => {
    if (!user || friendIds.length === 0) return;
    const { data } = await (supabase as any)
      .from('user_presence')
      .select('user_id, last_seen_at')
      .in('user_id', friendIds);
    const map: LastSeenMap = {};
    (data as any[])?.forEach((row: any) => {
      map[row.user_id] = row.last_seen_at;
    });
    setLastSeen((prev) => ({ ...prev, ...map }));
  };

  // Upsert own last seen periodically
  const touchLastSeen = async () => {
    if (!user) return;
    await (supabase as any)
      .from('user_presence')
      .upsert({ user_id: user.id, last_seen_at: new Date().toISOString() });
  };

  useEffect(() => {
    if (!user) return;

    // Presence channel with userId as key
    const channel = supabase.channel('online-presence', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id: string }>>;
        const ids = new Set<string>();
        Object.values(state).forEach((arr) => arr.forEach((p) => p.user_id && ids.add(p.user_id)));
        setOnlineIds(ids);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id: string }>>;
        const ids = new Set<string>();
        Object.values(state).forEach((arr) => arr.forEach((p) => p.user_id && ids.add(p.user_id)));
        setOnlineIds(ids);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id: string }>>;
        const ids = new Set<string>();
        Object.values(state).forEach((arr) => arr.forEach((p) => p.user_id && ids.add(p.user_id)));
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        // Touch on subscribe
        await touchLastSeen();
      });

    // Heartbeats
    const presenceInterval = setInterval(() => {
      channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      touchLastSeen();
    }, 60_000);

    const onVis = () => touchLastSeen();
    const onUnload = () => touchLastSeen();
    window.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onUnload);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    loadLastSeen();
  }, [friendIds.join(',')]);

  const isOnline = (id: string) => onlineIds.has(id);
  const onlineSet = useMemo(() => onlineIds, [onlineIds]);

  return {
    onlineIds: onlineSet,
    isOnline,
    lastSeen,
    refreshLastSeen: loadLastSeen,
  };
};
