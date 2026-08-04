import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { roomsApi } from '../api/rooms';
import { useAuth } from '../context/AuthContext';
// 🛠️ UPDATED: Added Activity and User icons for the new badges
import { Loader2, UserPlus, Clock, MessageSquare, UserX, LogIn, Users, MapPin, Calendar, Activity, User } from 'lucide-react';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛠️ NEW: The Self-Redirect Logic
  useEffect(() => {
    // If the logged-in user tries to look at their own public profile, bounce them to their private dashboard!
    if (user && user.username === username) {
      navigate('/profile', { replace: true });
    }
  }, [user, username, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      try {
        setLoading(true);
        setError(null);
        
        const [profileData, friendsData] = await Promise.all([
          usersApi.getUserProfile(username),
          usersApi.getUserFriends(username).catch(() => []) 
        ]);
        
        setProfile(profileData);
        setFriendsList(friendsData);
      } catch (err: any) {
        setError(err.message || 'User not found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
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
      navigate(`/home?room=${room.room_id}`, { state: { activeRoomId: room.room_id } });
    } catch (err: any) {
      const message = err?.message || 'Failed to start conversation';
      alert(message.includes('friends') ? 'You can only message friends. Send a friend request first.' : message);
    } finally {
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
        <button onClick={() => navigate(-1)} className="text-[#3B82F6] hover:underline mt-2 font-bold">Go Back</button>
      </div>
    );
  }

  const renderActionButton = () => {
    if (!user || user.is_guest || profile.friend_request_status === undefined) {
      return (
        <button
          onClick={() => navigate('/auth')}
          className="w-full sm:w-auto px-8 py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" /> Log in to connect
        </button>
      );
    }

    if (profile.friend_request_status === 'friends') {
      return (
        <button 
          onClick={handleMessage}
          disabled={actionLoading}
          className="w-full sm:w-auto px-8 py-3 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
        >
          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
          Message
        </button>
      );
    }
    
    if (profile.friend_request_status === 'pending_received') {
      return (
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleFriendAction}
            disabled={actionLoading}
            className="flex-1 sm:flex-none px-8 py-3 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
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
            className="flex-1 sm:flex-none px-8 py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors disabled:opacity-50"
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
        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50
          ${isPendingSent 
            ? 'bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30' 
            : 'bg-[#3B82F6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
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
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 pb-24">
      
      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm mb-8">
        
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 w-full relative"></div>
        
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6 relative z-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--card)] bg-[var(--border-color)] overflow-hidden flex items-center justify-center shadow-xl">
              {profile.avatar_url ? (
                // 🛠️ UPDATED: Added scale-110 so zAvatars fit flawlessly!
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover scale-110" />
              ) : (
                <span className="text-5xl font-black text-[var(--text-muted)]">{profile.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex-shrink-0 w-full sm:w-auto">
              {renderActionButton()}
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] leading-tight tracking-tight">{profile.name}</h1>
            <p className="text-base text-[var(--text-muted)] font-medium mb-4">@{profile.username}</p>
            
            {/* 🛠️ UPDATED: Complete Badges Area */}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium mb-6">
              
              {/* Friends Count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                <Users className="w-4 h-4 text-[#3B82F6]" />
                <strong>{profile.friend_count || 0}</strong> <span className="text-[var(--text-muted)]">Friends</span>
              </div>
              
              {/* Join Date */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                <Calendar className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-[var(--text-muted)]">Joined {new Date(profile.doj).getFullYear()}</span>
              </div>
              
              {/* Location */}
              {profile.country && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                  <MapPin className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[var(--text-muted)]">{profile.country}</span>
                </div>
              )}

              {/* Gender */}
              {profile.gender && profile.gender !== 'Any' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[var(--text-muted)]">{profile.gender}</span>
                </div>
              )}

              {/* Age */}
              {profile.age && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]">
                  <User className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[var(--text-muted)]">{profile.age} Yrs</span>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-[var(--text-main)] text-base leading-relaxed bg-[var(--background)]/50 p-5 rounded-2xl border border-[var(--border-color)]">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- PUBLIC FRIENDS GRID --- */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">Friends</h2>
          <span className="text-sm font-bold text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border-color)] px-2 py-0.5 rounded-full">
            {profile.friend_count || 0}
          </span>
        </div>

        {friendsList.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] border-dashed">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">No friends to show</h3>
            <p className="text-[var(--text-muted)] text-sm">
              {profile.name} hasn't added any friends to their network yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {friendsList.map((friend) => (
              <Link 
                key={friend.username}
                to={`/user/${friend.username}`}
                className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center text-center hover:border-[#3B82F6] transition-all hover:shadow-md group"
              >
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-[var(--background)] border border-[var(--border-color)] overflow-hidden group-hover:scale-105 transition-transform">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.name} className="w-full h-full object-cover scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xl text-[var(--text-muted)]">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {friend.is_online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[var(--card)] rounded-full animate-pulse"></div>
                  )}
                </div>
                <h3 className="font-bold text-[var(--text-main)] text-sm w-full truncate">{friend.name}</h3>
                <p className="text-[11px] text-[var(--text-muted)] w-full truncate">@{friend.username}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}