import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { roomsApi } from '../api/rooms';
import { friendsApi } from '../api/friends'; // 🛠️ ADDED: To fetch friend requests globally
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
  
  // 🛠️ NEW: Exposing Friend Requests globally
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  
  refreshRooms: () => Promise<void>;
  setActiveRoomId: (roomId: string | null) => void;
  bumpOwnMessage: (roomId: string, preview: string) => void;
}

const RoomsContext = createContext<RoomsContextType | null>(null);

export const LAST_ROOM_STORAGE_KEY = 'zquab_last_active_room';

export function RoomsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { lastMessage, sendMessage, isConnected } = useWebSocket();
  const isFullUser = Boolean(user && !user.is_guest);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, RoomUser>>({});
  const [loading, setLoading] = useState(true);
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null);
  
  // 🛠️ NEW: Global State for Friend Requests
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  const setActiveRoomId = useCallback((roomId: string | null) => {
    setActiveRoomIdState(roomId);
    if (roomId) sessionStorage.setItem(LAST_ROOM_STORAGE_KEY, roomId);
  }, []);

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

  // 🛠️ NEW: Function to fetch friend requests
  const refreshFriendRequests = useCallback(async () => {
    try {
      const data = await friendsApi.getRequests('received', 10, 0);
      setFriendRequests(data || []);
    } catch (err) {
      console.error('Failed to refresh friend requests:', err);
    }
  }, []);

  // Fetch everything on initial load
  useEffect(() => {
    if (!isFullUser) {
      setRooms([]);
      setUsersMap({});
      setFriendRequests([]); // Clear requests on logout
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await Promise.all([refreshRooms(), refreshFriendRequests()]);
      setLoading(false);
    })();
  }, [isFullUser, refreshRooms, refreshFriendRequests]);

  // 🛠️ NEW: WebSocket Listener for Friend Requests
  // The API Guide specifically says: "treat the WS event as the source of truth for 'refetch this list now'"
  useEffect(() => {
    if (!lastMessage) return;
    
    if (['friend_request', 'friend_accepted', 'friend_request_withdrawn'].includes(lastMessage.type)) {
      refreshFriendRequests();
    }
  }, [lastMessage, refreshFriendRequests]);

  // Live resync for chat messages
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
      if (idx === -1) return prevRooms; 

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

  // Presence updates
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

  // Read receipts
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'read') return;

    const msgRoomId = lastMessage.room_id || lastMessage.roomId;
    if (!msgRoomId) return;

    const myId = (user as any)?.user_id || (user as any)?.id;
    const readerId = lastMessage.sender_id || lastMessage.from;
    if (!readerId || !myId || readerId !== myId) return; 

    setRooms(prev => {
      const idx = prev.findIndex(r => r.room_id === msgRoomId);
      if (idx === -1 || prev[idx].unread_count === 0) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], unread_count: 0 };
      return updated;
    });
  }, [lastMessage, user]);

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

  const bumpOwnMessage = useCallback((roomId: string, preview: string) => {
    setRooms(prevRooms => {
      const idx = prevRooms.findIndex(r => r.room_id === roomId);
      if (idx === -1) return prevRooms;
      const updatedRoom = {
        ...prevRooms[idx],
        last_message_preview: preview,
        last_message_at: new Date().toISOString(),
      };
      const rest = prevRooms.filter((_, i) => i !== idx);
      return [updatedRoom, ...rest];
    });
  }, []);

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
    () => ({ rooms, usersMap, totalUnread, loading, friendRequests, setFriendRequests, refreshRooms, setActiveRoomId, bumpOwnMessage }),
    [rooms, usersMap, totalUnread, loading, friendRequests, setFriendRequests, refreshRooms, setActiveRoomId, bumpOwnMessage]
  );

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export const useRooms = () => {
  const context = useContext(RoomsContext);
  if (!context) throw new Error('useRooms must be used within a RoomsProvider');
  return context;
};