import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { roomsApi } from '../api/rooms';
import { Loader2, UserPlus, Clock, MessageSquare, UserX } from 'lucide-react';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      try {
        setLoading(true);
        const data = await usersApi.getUserProfile(username);
        setProfile(data);
      } catch (err: any) {
        // A 404 here intentionally means "doesn't exist OR blocked you"
        setError(err.message || 'User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleFriendAction = async () => {
    if (!profile || !username) return;
    setActionLoading(true);
    
    try {
      if (profile.friend_request_status === 'none') {
        await friendsApi.sendRequest(username);
        setProfile({ ...profile, friend_request_status: 'pending_sent' });
      } else if (profile.friend_request_status === 'pending_sent') {
        await friendsApi.withdrawRequest(username);
        setProfile({ ...profile, friend_request_status: 'none' });
      } else if (profile.friend_request_status === 'pending_received') {
        await friendsApi.acceptRequest(username);
        setProfile({ ...profile, friend_request_status: 'friends', friend_count: profile.friend_count + 1 });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!username) return;
    setActionLoading(true);
    try {
      const room = await roomsApi.createRoom(username);
      
      // 🛠️ CHANGED: Navigate to the integrated HomePage instead of the standalone ChatRoom.
      // Passes the room ID via both query parameter and state so the desktop split-view can open it instantly.
      navigate(`/home?room=${room.room_id}`, { state: { activeRoomId: room.room_id } });
      
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-[var(--text-muted)] gap-4">
        <UserX className="w-16 h-16 opacity-20" />
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-sm">This account doesn't exist or is unavailable.</p>
        <button onClick={() => navigate(-1)} className="text-[#3B82F6] hover:underline mt-2">Go Back</button>
      </div>
    );
  }

  // Dynamic button rendering based on exact API statuses
  const renderActionButton = () => {
    if (profile.friend_request_status === 'friends') {
      return (
        <button 
          onClick={handleMessage}
          disabled={actionLoading}
          className="w-full py-3 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
          Message
        </button>
      );
    }
    
    if (profile.friend_request_status === 'pending_received') {
      return (
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={handleFriendAction}
            disabled={actionLoading}
            className="py-3 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept Request'}
          </button>
          <button 
            onClick={async () => {
              setActionLoading(true);
              await friendsApi.rejectRequest(username!);
              setProfile({ ...profile, friend_request_status: 'none' });
              setActionLoading(false);
            }}
            disabled={actionLoading}
            className="py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      );
    }

    const isPendingSent = profile.friend_request_status === 'pending_sent';
    
    return (
      <button 
        onClick={handleFriendAction}
        disabled={actionLoading}
        className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50
          ${isPendingSent 
            ? 'bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10' 
            : 'bg-[#3B82F6] text-white hover:bg-blue-600'
          }`}
      >
        {actionLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPendingSent ? (
          <>
            <Clock className="w-5 h-5" /> Cancel Request
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" /> Add Friend
          </>
        )}
      </button>
    );
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 md:p-6 pb-20">
      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
        
        <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 w-full relative">
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--card)] bg-[var(--border-color)] overflow-hidden flex items-center justify-center absolute -top-12 shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-[var(--text-muted)]">{profile.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          
          <div className="pt-16 pb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--text-main)] leading-tight">{profile.name}</h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">@{profile.username}</p>
            
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="text-[var(--text-muted)]">
                <strong className="text-[var(--text-main)] mr-1">{profile.friend_count || 0}</strong> 
                Friends
              </div>
              <div className="w-1 h-1 rounded-full bg-[var(--border-color)]"></div>
              <div className="text-[var(--text-muted)]">
                Joined {new Date(profile.doj).getFullYear()}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-6 text-[var(--text-main)] text-sm leading-relaxed max-w-sm mx-auto bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] flex justify-center">
            {renderActionButton()}
          </div>
          
        </div>
      </div>
    </div>
  );
}