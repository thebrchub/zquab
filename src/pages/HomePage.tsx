import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 🛠️ Added useLocation
import { roomsApi } from '../api/rooms';
import { friendsApi } from '../api/friends'; 
import { useWebSocket } from '../context/WebSocketContext'; // 🛠️ Added useWebSocket
import { Loader2, MessageSquare, Bell, Search, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ChatRoom from './ChatRoom'; 

interface User {
  name: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface Room {
  room_id: string;
  member_ids: string[];
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

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
  const location = useLocation(); // 🛠️ Needed to parse URL parameters
  const { user } = useAuth(); 
  const { sendMessage, isConnected } = useWebSocket(); // 🛠️ Grab the socket connection
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  
  const [selectedChat, setSelectedChat] = useState<{ roomId: string, name: string, avatar?: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [roomsData, requestsData] = await Promise.all([
          roomsApi.getRooms(),
          friendsApi.getRequests('received') 
        ]);

        setRooms(roomsData.rooms || []);
        setUsersMap(roomsData.users || {});
        setRequests(requestsData || []); 
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 🛠️ NEW: Check URL for ?room=xyz parameter so clicking "Message" on a profile auto-opens the chat
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomIdParam = params.get('room');

    if (roomIdParam && rooms.length > 0 && !selectedChat) {
      const room = rooms.find(r => r.room_id === roomIdParam);
      if (room) {
        const partnerId = room.member_ids.find(id => id !== (user as any)?.id);
        const partner = partnerId ? usersMap[partnerId] : null;
        
        // Auto-select on desktop
        if (window.innerWidth >= 768) {
          setSelectedChat({ roomId: room.room_id, name: partner?.name || 'Unknown', avatar: partner?.avatar_url });
        }

        // Optimistically clear the unread count locally
        setRooms(prev => prev.map(r => r.room_id === room.room_id ? { ...r, unread_count: 0 } : r));
        
        // Inform the backend that messages have been read
        if (isConnected) {
          sendMessage('read', {}, room.room_id);
        }
      }
    }
  }, [location.search, rooms, selectedChat, user, usersMap, isConnected, sendMessage]);

  const handleAcceptRequest = async (username: string) => {
    try {
      await friendsApi.acceptRequest(username);
      setRequests(prev => prev.filter(req => req.username !== username));
      const roomsData = await roomsApi.getRooms();
      setRooms(roomsData.rooms || []);
      setUsersMap(roomsData.users || {});
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

  // 🛠️ NEW: Centralized Room Click Handler
  const handleRoomClick = (room: Room, partnerName: string, partnerAvatar?: string) => {
    // 1. Optimistic UI: Erase unread badge instantly
    setRooms(prev => prev.map(r => r.room_id === room.room_id ? { ...r, unread_count: 0 } : r));

    // 2. Alert the Backend that the user has seen the chat
    if (isConnected) {
      sendMessage('read', {}, room.room_id);
    }

    // 3. Navigate or Expand
    if (window.innerWidth >= 768) {
      setSelectedChat({ roomId: room.room_id, name: partnerName, avatar: partnerAvatar });
      window.history.replaceState({}, '', `/home?room=${room.room_id}`); // Silently update URL
    } else {
      navigate(`/chat/${room.room_id}`, { state: { friendName: partnerName, friendAvatar: partnerAvatar }});
    }
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
    <div className="absolute inset-0 flex bg-[var(--background)] overflow-hidden">
      
      {/* 📱 / 💻 LEFT SIDEBAR (Inbox / Requests) */}
      <div className={`flex-col h-full bg-[var(--background)] border-r border-[var(--border-color)] transition-all duration-300 ${
        selectedChat ? 'hidden md:flex w-80 lg:w-96 flex-shrink-0' : 'flex w-full md:w-80 lg:w-96 flex-shrink-0'
      }`}>
        <header className="pt-safe pb-4 px-4 bg-[var(--card)] border-b border-[var(--border-color)] flex-shrink-0 z-20">
          <div className="flex items-center justify-between mt-4 mb-6">
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Messages</h1>
            <button className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-transform">
              <Search className="w-5 h-5" />
            </button>
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
            
            {/* 💬 CHATS TAB */}
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
                      const partnerId = room.member_ids.find(id => id !== (user as any)?.id);
                      const partner = partnerId ? usersMap[partnerId] : null;
                      const partnerName = partner?.name || 'Unknown User';
                      const isSelected = selectedChat?.roomId === room.room_id;

                      return (
                        <div 
                          key={room.room_id} 
                          onClick={() => handleRoomClick(room, partnerName, partner?.avatar_url)} // 🛠️ Uses the new robust click handler
                          className={`p-4 transition-colors flex items-center gap-4 cursor-pointer ${
                            isSelected ? 'bg-[var(--card)] border-l-4 border-[#3B82F6]' : 'bg-[var(--background)] hover:bg-[var(--card)]'
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
                              <p className={`text-sm truncate ${room.unread_count > 0 ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                                {room.last_message_preview || 'No messages yet'}
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

            {/* 🔔 FRIEND REQUESTS TAB */}
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

      {/* 💻 RIGHT SIDEBAR (Active Chat - Desktop Only) */}
      <div className={`flex-1 h-full bg-[var(--card)] hidden md:flex flex-col relative`}>
        {selectedChat ? (
          <ChatRoom 
            inlineRoomId={selectedChat.roomId} 
            inlineFriendName={selectedChat.name}
            inlineFriendAvatar={selectedChat.avatar}
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