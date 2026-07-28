import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { Loader2, MessageSquare, Bell, Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TypeScript Interfaces ---
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

interface Request {
  room_id: string;
  sender_name: string;
  sender_avatar?: string;
  last_message_preview: string;
  last_message_at: string;
}

type Tab = 'chats' | 'requests';

export default function HomePage() {
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('chats');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [roomsData, requestsData] = await Promise.all([
          roomsApi.getRooms(),
          roomsApi.getRequests()
        ]);

        setRooms(roomsData.rooms || []);
        setUsersMap(roomsData.users || {});
        setRequests(requestsData || []); 
      } catch (err: any) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper to format timestamps nicely (e.g., "10:30 AM" or "Yesterday")
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
        <p className="text-[var(--text-muted)] font-medium animate-pulse">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--background)] overflow-hidden">
      
      {/* Sticky Header */}
      <header className="pt-safe pb-4 px-4 bg-[var(--card)] border-b border-[var(--border-color)] flex-shrink-0 z-20">
        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Messages</h1>
          <button className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-transform">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Mobile-Friendly Tabs */}
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

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar relative">
        <AnimatePresence mode="wait">
          
          {/* ACTIVE CHATS TAB */}
          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="pb-24" // padding for mobile navigation bars
            >
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
                  <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-6 shadow-lg border border-[var(--border-color)]">
                    <UserPlus className="w-10 h-10 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No active chats</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                    You haven't started any conversations yet. Connect with a stranger or search for friends to get started.
                  </p>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="bg-[#3B82F6] hover:bg-blue-600 active:scale-95 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Find a Stranger
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {rooms.map((room) => {
                    const partnerId = room.member_ids.find(id => usersMap[id]);
                    const partner = partnerId ? usersMap[partnerId] : null;

                    return (
                      <div 
                        key={room.room_id} 
                        onClick={() => navigate(`/chat/${room.room_id}`)}
                        className="p-4 bg-[var(--background)] hover:bg-[var(--card)] active:bg-[var(--card)] transition-colors flex items-center gap-4 cursor-pointer"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full bg-[var(--border-color)] overflow-hidden">
                            {partner?.avatar_url ? (
                              <img src={partner.avatar_url} alt={partner?.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-xl text-[var(--text-muted)]">
                                {partner?.name?.charAt(0)?.toUpperCase() || '?'}
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
                              {partner?.name || 'Unknown User'}
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

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="pb-24"
            >
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
                  <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-6 shadow-lg border border-[var(--border-color)] opacity-50">
                    <Bell className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No new requests</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    When someone you aren't friends with tries to message you, it will appear here safely.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {requests.map((req) => (
                    <div 
                      key={req.room_id} 
                      onClick={() => navigate(`/chat/${req.room_id}`)}
                      className="p-4 bg-[var(--background)] hover:bg-[var(--card)] active:bg-[var(--card)] transition-colors flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0 shadow-sm border border-white/5">
                        {req.sender_avatar ? (
                          <img src={req.sender_avatar} alt={req.sender_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-xl text-[var(--text-muted)]">
                            {req.sender_name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-[var(--text-main)] text-base truncate pr-2">
                            {req.sender_name}
                          </h3>
                          <span className="text-xs font-medium text-[#3B82F6] flex-shrink-0 bg-[#3B82F6]/10 px-2 py-0.5 rounded-md">
                            New
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate font-medium">
                          {req.last_message_preview}
                        </p>
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
  );
}