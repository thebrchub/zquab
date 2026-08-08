import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { friendsApi } from '../api/friends'; 
import { useRooms, LAST_ROOM_STORAGE_KEY, type Room } from '../context/RoomsContext';
import { Loader2, MessageSquare, Bell, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ChatRoom from './ChatRoom'; 

// 🛠️ NEW: Added CDN URL detector to intercept raw image links in previews
const STORAGE_CDN_BASE_URL = import.meta.env.VITE_STORAGE_CDN_BASE_URL ?? 'https://lyglmrkcyybfqegeprlu.supabase.co/storage/v1/object/public/zquab-bucket/';

const getPreviewText = (preview?: string) => {
  if (!preview) return 'No messages yet';
  if (typeof preview === 'string' && preview.startsWith(STORAGE_CDN_BASE_URL)) {
    return '📷 Photo';
  }
  return preview;
};

interface FriendRequest {
  request_id: number;
  user_id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

type Tab = 'chats' | 'requests';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user } = useAuth(); 

  const { rooms, usersMap, loading, refreshRooms, setActiveRoomId } = useRooms();

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  
  const [selectedChat, setSelectedChat] = useState<{ roomId: string, name: string, username: string, avatar?: string, isOnline?: boolean } | null>(null);

  useEffect(() => {
    // 🛠️ FIX: Explicitly pass a higher limit (e.g., 50 or 100) to override the default limit of 10
    friendsApi.getRequests('received', 50)
      .then(setRequests)
      .catch(err => console.error('Failed to load friend requests:', err));
  }, []);

  // Tell the shared rooms context which room is currently open, so it can
  // skip bumping this room's badge on new messages and mark it read.
  useEffect(() => {
    setActiveRoomId(selectedChat?.roomId ?? null);
  }, [selectedChat?.roomId, setActiveRoomId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomIdParam = params.get('room');

    if (roomIdParam && rooms.length > 0) {
      const room = rooms.find(r => r.room_id === roomIdParam);
      const myId = (user as any)?.user_id || (user as any)?.id;
      const partnerId = room?.member_ids.find(id => id !== myId);
      const partner = partnerId ? usersMap[partnerId] : null;
      
      setSelectedChat({ 
        roomId: roomIdParam, 
        name: location.state?.friendName || partner?.name || 'Chat Room', 
        username: location.state?.friendUsername || partner?.username || '',
        avatar: location.state?.friendAvatar || partner?.avatar_url,
        // Prefer the live usersMap value (kept fresh by the presence effect
        // above) over location.state's one-time snapshot from click-time.
        isOnline: partner?.is_online ?? location.state?.isOnline
      });

    } else if (!roomIdParam) {
      setSelectedChat(null);
    }
  }, [location.search, location.state, rooms.length, user, usersMap]); 

  // Resume the last-open conversation when landing on a bare /home (e.g.
  // navigating away to another page and back to Inbox) instead of always
  // dropping to the empty "select a conversation" list. An explicit close
  // (ChatRoom's mobile back button) clears the stored key itself, so this
  // never resurrects a chat the user deliberately backed out of.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('room')) return; // an explicit room is already requested
    if (rooms.length === 0) return; // wait for rooms to load before deciding

    const lastRoomId = sessionStorage.getItem(LAST_ROOM_STORAGE_KEY);
    if (!lastRoomId) return;
    if (!rooms.some(r => r.room_id === lastRoomId)) return; // stale/deleted room

    navigate(`/home?room=${lastRoomId}`, { replace: true });
  }, [location.search, rooms, navigate]);

  const handleRoomClick = (room: Room, partnerName: string, partnerUsername: string, partnerAvatar?: string, partnerIsOnline?: boolean) => {
    navigate(`/home?room=${room.room_id}`, { 
      state: { friendName: partnerName, friendUsername: partnerUsername, friendAvatar: partnerAvatar, isOnline: partnerIsOnline } 
    });
  };

  const handleAcceptRequest = async (username: string) => {
    try {
      await friendsApi.acceptRequest(username);
      setRequests(prev => prev.filter(req => req.username !== username));
      await refreshRooms();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleRejectRequest = async (username: string) => {
    try {
      await friendsApi.rejectRequest(username);
      setRequests(prev => prev.filter(req => req.username !== username));
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100dvh-64px)] sm:h-[calc(100dvh-83px)] bg-[var(--background)] overflow-hidden relative">
      
      <div className={`flex-col h-full bg-[var(--background)] border-r border-[var(--border-color)] transition-all duration-300 ${
        selectedChat ? 'hidden md:flex w-80 lg:w-96 flex-shrink-0' : 'flex w-full md:w-80 lg:w-96 flex-shrink-0'
      }`}>
        <header className="pt-safe pb-4 px-4 bg-[var(--card)] border-b border-[var(--border-color)] flex-shrink-0 z-20">
          <div className="flex items-center justify-between mt-4 mb-6">
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Messages</h1>
          </div>

          <div className="flex p-1 bg-[var(--background)] rounded-xl border border-[var(--border-color)]">
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'chats' 
                  ? 'bg-[var(--card)] text-[var(--text-main)] shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                activeTab === 'requests' 
                  ? 'bg-[var(--card)] text-[var(--text-main)] shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Bell className="w-4 h-4" />
              Requests
              {requests.length > 0 && (
                <span className="bg-[#3B82F6] text-white text-[10px] px-1.5 py-0.5 rounded-full absolute top-1 right-2 lg:right-6">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar relative">
          <AnimatePresence mode="wait">
            
            {activeTab === 'chats' && (
              <motion.div key="chats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24 md:pb-4">
                {rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
                    <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-6 shadow-lg border border-[var(--border-color)]">
                      <UserPlus className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No active chats</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed mb-8 text-sm">
                      You haven't started any conversations yet. Connect with a stranger or search for friends.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {rooms.map((room) => {
                      const myId = (user as any)?.user_id || (user as any)?.id;
                      const partnerId = room.member_ids.find(id => id !== myId);
                      const partner = partnerId ? usersMap[partnerId] : null;
                      const partnerName = partner?.name || 'Unknown User';
                      const partnerUsername = partner?.username || '';
                      const isSelected = selectedChat?.roomId === room.room_id;

                      return (
                        <div 
                          key={room.room_id} 
                          onClick={() => handleRoomClick(room, partnerName, partnerUsername, partner?.avatar_url, partner?.is_online)}
                          className={`p-4 transition-colors flex items-center gap-4 cursor-pointer ${
                            isSelected ? 'bg-[var(--card)] border-l-4 border-l-[#3B82F6]' : 'bg-[var(--background)] hover:bg-[var(--card)]'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-[var(--border-color)] overflow-hidden">
                              {partner?.avatar_url ? (
                                <img src={partner.avatar_url} alt={partnerName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-xl text-[var(--text-muted)]">
                                  {partnerName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {partner?.is_online && (
                              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--background)] rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-bold text-[var(--text-main)] text-base truncate pr-2">
                                {partnerName}
                              </h3>
                              <span className="text-xs font-medium text-[var(--text-muted)] flex-shrink-0">
                                {formatTime(room.last_message_at)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              {/* 🛠️ THE FIX: Render formatted preview using getPreviewText */}
                              <p className={`text-sm truncate ${room.unread_count > 0 ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                                {getPreviewText(room.last_message_preview)}
                              </p>
                              {room.unread_count > 0 && (
                                <span className="bg-[#3B82F6] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full flex-shrink-0 shadow-sm">
                                  {room.unread_count > 99 ? '99+' : room.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24 md:pb-4">
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
                    <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-6 shadow-lg border border-[var(--border-color)] opacity-50">
                      <Bell className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No pending requests</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed text-sm">
                      When someone sends you a friend request, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {requests.map((req) => (
                      <div key={req.request_id} className="p-4 bg-[var(--background)] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
                            {req.avatar_url ? (
                              <img src={req.avatar_url} alt={req.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                                {req.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-[var(--text-main)] text-sm truncate">{req.name}</h3>
                            <p className="text-xs text-[var(--text-muted)] truncate">@{req.username}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button 
                            onClick={() => handleAcceptRequest(req.username)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.username)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      <div className={`flex-1 h-full bg-[var(--card)] ${selectedChat ? 'flex' : 'hidden md:flex'} flex-col relative`}>
        {selectedChat ? (
          <ChatRoom 
            inlineRoomId={selectedChat.roomId} 
            inlineFriendName={selectedChat.name}
            inlineFriendAvatar={selectedChat.avatar}
            inlineFriendUsername={selectedChat.username}
            inlineIsOnline={selectedChat.isOnline}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[var(--background)]">
             <div className="w-24 h-24 rounded-full bg-[var(--card)] border border-[var(--border-color)] flex items-center justify-center mb-6 shadow-xl">
               <MessageCircle className="w-10 h-10 text-[var(--text-muted)]" />
             </div>
             <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Your Messages</h2>
             <p className="text-[var(--text-muted)] font-medium">Select a conversation from the left to start chatting.</p>
          </div>
        )}
      </div>

    </div>
  );
}