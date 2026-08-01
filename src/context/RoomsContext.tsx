import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { roomsApi } from '../api/rooms';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

export interface RoomUser {
  username: string;
  name: string;
  avatar_url?: string;
  last_seen_at?: string;
  is_private?: boolean;
  is_online?: boolean;
}

export interface Room {
  room_id: string;
  name: string | null;
  type: string;
  group_avatar?: string;
  created_by?: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  member_count?: number;
  member_ids: string[];
}

interface RoomsContextType {
  rooms: Room[];
  usersMap: Record<string, RoomUser>;
  totalUnread: number;
  loading: boolean;
  refreshRooms: () => Promise<void>;
  // Tell the provider which room is currently open on screen, so live
  // chat_message events don't bump its badge (it's already being read),
  // and so it gets marked read the moment it's opened / tab regains focus.
  setActiveRoomId: (roomId: string | null) => void;
}

const RoomsContext = createContext<RoomsContextType | null>(null);

// Single source of truth for the rooms list + aggregate unread count, shared
// by Navbar and HomePage (and anything else that needs it) instead of each
// maintaining its own independent copy that can drift out of sync.
export function RoomsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { lastMessage, sendMessage, isConnected } = useWebSocket();
  const isFullUser = Boolean(user && !user.is_guest);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, RoomUser>>({});
  const [loading, setLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const roomsRef = useRef(rooms);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  const refreshRooms = useCallback(async () => {
    try {
      const data = await roomsApi.getRooms();
      setRooms(data.rooms || []);
      setUsersMap(prev => ({ ...prev, ...(data.users || {}) }));
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  }, []);

  useEffect(() => {
    if (!isFullUser) {
      setRooms([]);
      setUsersMap({});
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await refreshRooms();
      setLoading(false);
    })();
  }, [isFullUser, refreshRooms]);

  // Live resync via WebSocket data only — no REST call. A new chat_message
  // patches the matching room's preview/timestamp/unread_count in place and
  // re-sorts by recency. Skips incrementing unread_count for the room
  // that's currently open (activeRoomId) since that one's already visible.
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'chat_message') return;

    const msgRoomId = lastMessage.room_id || lastMessage.roomId;
    if (!msgRoomId) return;

    const myId = (user as any)?.user_id || (user as any)?.id;
    const msgSender = lastMessage.sender_id || lastMessage.from;
    const isOwn = Boolean(msgSender && myId && msgSender === myId);
    const isOpenRoom = activeRoomId === msgRoomId;
    const parsedTs = Number(lastMessage.ts);
    const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();

    setRooms(prevRooms => {
      const idx = prevRooms.findIndex(r => r.room_id === msgRoomId);
      if (idx === -1) return prevRooms; // unknown room — next full load will pick it up

      const updatedRoom = {
        ...prevRooms[idx],
        last_message_preview: lastMessage.payload?.text ?? prevRooms[idx].last_message_preview,
        last_message_at: new Date(tsMs).toISOString(),
        unread_count: (!isOwn && !isOpenRoom) ? prevRooms[idx].unread_count + 1 : prevRooms[idx].unread_count,
      };

      const rest = prevRooms.filter((_, i) => i !== idx);
      return [updatedRoom, ...rest];
    });
  }, [lastMessage, user, activeRoomId]);

  // Presence is otherwise a one-time snapshot from the last /rooms fetch —
  // patch usersMap live from the same WS events the backend already
  // broadcasts, instead of leaving "online"/"offline" frozen at fetch time.
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type !== 'presence_online' && lastMessage.type !== 'presence_offline') return;

    const presenceUserId = lastMessage.from || lastMessage.sender_id;
    if (!presenceUserId) return;

    setUsersMap(prev => {
      if (!prev[presenceUserId]) return prev;
      return {
        ...prev,
        [presenceUserId]: { ...prev[presenceUserId], is_online: lastMessage.type === 'presence_online' },
      };
    });
  }, [lastMessage]);

  // Sends the read receipt + zeroes the local badge, but only while the tab
  // is actually visible — a backgrounded tab can still receive this room's
  // WS traffic and re-run this, which would mark messages read that the
  // user never actually saw.
  const markRoomRead = useCallback((roomId: string) => {
    if (!isConnected || document.visibilityState !== 'visible') return;
    const idx = roomsRef.current.findIndex(r => r.room_id === roomId);
    if (idx === -1 || roomsRef.current[idx].unread_count === 0) return;

    sendMessage('read', undefined, roomId);
    setRooms(prev => {
      const i = prev.findIndex(r => r.room_id === roomId);
      if (i === -1) return prev;
      const updated = [...prev];
      updated[i] = { ...updated[i], unread_count: 0 };
      return updated;
    });
  }, [isConnected, sendMessage]);

  // Mark the active room read as soon as it's opened, and catch up on
  // whatever accumulated while the tab was backgrounded once it's visible
  // again — instead of leaving it stuck unread until reselected.
  useEffect(() => {
    if (!activeRoomId) return;
    markRoomRead(activeRoomId);
  }, [activeRoomId, markRoomRead]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && activeRoomId) markRoomRead(activeRoomId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeRoomId, markRoomRead]);

  const totalUnread = useMemo(() => rooms.reduce((acc, r) => acc + (r.unread_count || 0), 0), [rooms]);

  const value = useMemo(
    () => ({ rooms, usersMap, totalUnread, loading, refreshRooms, setActiveRoomId }),
    [rooms, usersMap, totalUnread, loading, refreshRooms]
  );

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export const useRooms = () => {
  const context = useContext(RoomsContext);
  if (!context) throw new Error('useRooms must be used within a RoomsProvider');
  return context;
};
