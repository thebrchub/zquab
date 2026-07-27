import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { Loader2, MessageSquare, Bell } from 'lucide-react';

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

export default function HomePage() {
  const navigate = useNavigate();
  
  // --- Strongly Typed State ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch both active rooms and pending requests concurrently
        const [roomsData, requestsData] = await Promise.all([
          roomsApi.getRooms(),
          roomsApi.getRequests()
        ]);

        setRooms(roomsData.rooms || []);
        setUsersMap(roomsData.users || {});
        setRequests(requestsData || []); 
      } catch (err: any) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-500/10 rounded-xl max-w-md mx-auto mt-10">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-6 space-y-8 pb-20">
      
      {/* Pending Message Requests Section */}
      {requests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Bell className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="font-bold text-lg text-[var(--text-main)]">Message Requests</h2>
            <span className="bg-[#3B82F6] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            {requests.map((req) => (
              <div 
                key={req.room_id} 
                onClick={() => navigate(`/chat/${req.room_id}`)}
                className="p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--background)] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
                    {req.sender_avatar ? (
                      <img src={req.sender_avatar} alt={req.sender_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                        {req.sender_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-main)]">{req.sender_name}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate max-w-[200px]">{req.last_message_preview}</p>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {new Date(req.last_message_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Chats Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2">
          <MessageSquare className="w-5 h-5 text-[var(--text-main)]" />
          <h2 className="font-bold text-lg text-[var(--text-main)]">Active Chats</h2>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl p-8 text-center text-[var(--text-muted)]">
            <p>No active chats yet. Search for friends to start messaging!</p>
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            {rooms.map((room) => {
              // Extract the partner's user info from the usersMap
              const partnerId = room.member_ids.find(id => usersMap[id]);
              const partner = partnerId ? usersMap[partnerId] : null;

              return (
                <div 
                  key={room.room_id} 
                  onClick={() => navigate(`/chat/${room.room_id}`)}
                  className="p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--background)] transition-colors flex items-center gap-4 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt={partner?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                          {partner?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    {partner?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--card)] rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-[var(--text-main)] truncate">{partner?.name || 'Unknown User'}</h3>
                      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 ml-2">
                        {new Date(room.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm text-[var(--text-muted)] truncate">{room.last_message_preview}</p>
                      {room.unread_count > 0 && (
                        <span className="bg-[#3B82F6] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
    </div>
  );
}