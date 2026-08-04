import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { friendsApi } from '../api/friends';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import PaginationLoader from '../components/PaginationLoader';
import { 
  Loader2, Camera, Save, User, AtSign, AlignLeft, 
  Users, MessageSquare, Edit2, X, MapPin, Calendar, Activity,
  LogOut, UserPlus, ShieldBan, Search, Check, Share2, CheckCircle2 // 🛠️ NEW: Added Share2 and CheckCircle2
} from 'lucide-react';

const GENDER_OPTIONS = ['Any', 'Male', 'Female', 'Other'];
type Tab = 'friends' | 'requests' | 'search' | 'blocked';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout: logoutUser } = useAuth(); 
  
  // --------------------------------------------------------
  // 1. PROFILE STATE
  // --------------------------------------------------------
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false); // 🛠️ NEW: State for share link

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Any');
  const [age, setAge] = useState(''); 
  const [country, setCountry] = useState(''); 
  const [hasExistingUsername, setHasExistingUsername] = useState(false);

  // --------------------------------------------------------
  // 2. NETWORK (FRIENDS) STATE
  // --------------------------------------------------------
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const LIMIT = 15;

  // --------------------------------------------------------
  // 3. EFFECTS & DATA FETCHING
  // --------------------------------------------------------
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (authUser?.is_guest) {
        setProfileLoading(false);
        return;
      }
      try {
        const data = await usersApi.getMe();
        setProfile(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setGender(data.gender || 'Any');
        setAge(data.age || '');
        setCountry(data.country || '');
        if (data.username) setHasExistingUsername(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const fetchNetworkData = async (reset = false) => {
    try {
      if (reset) {
        setNetworkLoading(true);
        setOffset(0);
        setHasMore(true);
      }
      
      const currentOffset = reset ? 0 : offset;
      let results: any[] = [];

      if (activeTab === 'friends') {
        results = await friendsApi.getFriends(LIMIT, currentOffset);
      } else if (activeTab === 'requests') {
        results = await friendsApi.getRequests('received', LIMIT, currentOffset);
      } else if (activeTab === 'blocked') {
        results = await friendsApi.getBlockedUsers(LIMIT, currentOffset);
      } else if (activeTab === 'search' && searchQuery.trim()) {
        results = await usersApi.searchUsers(searchQuery);
        setHasMore(false); 
      }

      setNetworkData(prev => reset ? results : [...prev, ...results]);
      if (results.length < LIMIT && activeTab !== 'search') setHasMore(false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'search' || searchQuery) {
      fetchNetworkData(true);
    } else {
      setNetworkData([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) fetchNetworkData(true);
      else setNetworkData([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --------------------------------------------------------
  // 4. HANDLERS
  // --------------------------------------------------------
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: any = { bio, gender, country };
      if (!hasExistingUsername && username) payload.username = username;
      
      const updated = await usersApi.updateMePartial(payload);
      setProfile({ ...updated, age, country }); 
      setCountry(country);
      if (updated.username) setHasExistingUsername(true);
      
      setIsEditing(false); 
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/';
    }
  };

  const handleNetworkAction = async (action: () => Promise<void>, targetUsername: string) => {
    try {
      await action();
      setNetworkData(prev => prev.filter(u => u.username !== targetUsername));
    } catch (error) {
      alert('Action failed. Please try again.');
    }
  };

  // 🛠️ NEW: Share Profile Handler
  const handleShareProfile = () => {
    if (!authUser?.username) return;
    const profileUrl = `${window.location.origin}/user/${authUser.username}`;
    const shareText = `Hey! Connect with me on zQuab 🚀\n\n${profileUrl}`;
    
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --------------------------------------------------------
  // 5. RENDER
  // --------------------------------------------------------

  if (profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  // GUEST STATE
  if (authUser?.is_guest) {
    return (
      <div className="max-w-4xl mx-auto w-full p-6 pb-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center border border-[var(--border-color)] mb-4 shadow-sm">
          <User className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Guest Account</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md">
          You are browsing anonymously. To set up a profile, add friends, and save your chats, please create a full account.
        </p>
        <button onClick={() => navigate('/auth')} className="px-8 py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg">
          Log In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 pb-24">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
        
        {/* --- LEFT COLUMN: STICKY PROFILE SIDEBAR --- */}
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          
          {isEditing ? (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-sm animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-[var(--background)] rounded-full hover:bg-[var(--border-color)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {error && <div className="p-3 bg-red-500/10 text-red-500 font-medium rounded-xl text-sm mb-4">{error}</div>}

              {/* Stacked inputs for sidebar format */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2"><AtSign className="w-4 h-4 text-[#3B82F6]" /> Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} disabled={hasExistingUsername} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] disabled:opacity-50" placeholder="choose_a_username" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)]">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6]">
                    {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)]">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6]" placeholder="e.g. 21" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)]">Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6]">
                    <option value="">Select country</option>
                    <option value="India">🇮🇳 India</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Global">🌍 Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2"><AlignLeft className="w-4 h-4 text-[#3B82F6]" /> Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] resize-none custom-scrollbar" placeholder="Tell everyone a bit about yourself..." />
                </div>

                <button onClick={handleSave} disabled={saving || (!hasExistingUsername && !username.trim())} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative">
              
              {/* Stacked Avatar for Sidebar */}
              <div className="relative group mb-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--background)] border-4 border-[var(--border-color)] overflow-hidden flex items-center justify-center shadow-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 sm:w-14 sm:h-14 text-[var(--text-muted)]" />
                  )}
                </div>
                <button onClick={() => setIsEditing(true)} className="absolute bottom-0 right-0 w-9 h-9 bg-[var(--card)] border-2 border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-main)] hover:text-[#3B82F6] transition-colors shadow-sm">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] leading-tight">{profile?.name || username || 'New User'}</h1>
              <p className="text-[var(--text-muted)] font-medium mt-1 mb-5">@{username}</p>

              {/* Badges wrapped nicely */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {country && <span className="px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs font-bold flex items-center gap-1.5 text-[var(--text-main)]"><MapPin className="w-3.5 h-3.5" /> {country}</span>}
                {gender !== 'Any' && <span className="px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs font-bold flex items-center gap-1.5 text-[var(--text-main)]"><Activity className="w-3.5 h-3.5" /> {gender}</span>}
                {age && <span className="px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-full text-xs font-bold flex items-center gap-1.5 text-[var(--text-main)]"><Calendar className="w-3.5 h-3.5" /> {age}</span>}
              </div>

              {/* Bio Block */}
              <p className="text-sm text-[var(--text-main)] w-full leading-relaxed whitespace-pre-wrap bg-[var(--background)]/50 p-4 rounded-xl border border-[var(--border-color)] mb-6 text-left">
                {bio || <span className="text-[var(--text-muted)] italic">No bio added yet. Click edit to introduce yourself!</span>}
              </p>

              {/* 🛠️ UPDATED: Desktop Actions (Added Share Button) */}
              <div className="w-full flex flex-wrap gap-2">
                <button 
                  onClick={handleShareProfile} 
                  className="flex-1 min-w-[30%] py-3 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl text-sm font-bold text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex-1 min-w-[30%] py-3 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] hover:border-[#3B82F6] transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex-1 min-w-[30%] py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>


        {/* --- RIGHT COLUMN: NETWORK HUB --- */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6">
          
          {/* Stranger Chat Banner */}
          <div className="bg-gradient-to-r from-[#3B82F6] to-indigo-600 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md gap-4">
            <div>
              <h3 className="text-white text-lg font-bold flex items-center gap-2 mb-1"><MessageSquare className="w-5 h-5" /> Stranger Chat</h3>
              <p className="text-blue-100 text-sm">Connect with someone new in the global network instantly.</p>
            </div>
            <button onClick={() => navigate('/chat')} className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow hover:scale-105 active:scale-95 transition-transform whitespace-nowrap">
              Start Chat
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-4 sm:p-6 shadow-sm min-h-[500px] flex flex-col">
            {/* Network Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-4 pb-2 flex-shrink-0 border-b border-[var(--border-color)]">
              {[
                { id: 'friends', icon: Users, label: 'My Friends' },
                { id: 'requests', icon: UserPlus, label: 'Requests' },
                { id: 'search', icon: Search, label: 'Find Friends' },
                { id: 'blocked', icon: ShieldBan, label: 'Blocked' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-bold text-sm transition-colors whitespace-nowrap relative ${
                    activeTab === tab.id 
                      ? 'text-[#3B82F6]' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--background)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {/* Active Tab Indicator Line */}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3B82F6] rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            {activeTab === 'search' && (
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search global zQuab network by username..."
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* User List Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {networkLoading && networkData.length === 0 ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>
              ) : networkData.length === 0 ? (
                <div className="text-center py-16 px-4 text-[var(--text-muted)] bg-[var(--background)] border border-[var(--border-color)] rounded-2xl border-dashed">
                  <p className="font-medium text-lg mb-1">
                    {activeTab === 'friends' ? "You haven't added any friends yet." : 
                     activeTab === 'requests' ? "No pending friend requests." : 
                     activeTab === 'blocked' ? "You haven't blocked anyone." : 
                     "Type a username above to search."}
                  </p>
                  <p className="text-sm">
                    {activeTab === 'friends' ? "Head over to the 'Find Friends' tab to grow your network!" : ""}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {networkData.map((user) => (
                    <UserCard
                      key={user.id || user.request_id}
                      user={{
                        ...user,
                        subtitle: activeTab === 'friends' ? `Friends since ${new Date(user.friends_since).getFullYear()}` : 
                                  activeTab === 'blocked' ? 'Blocked' : undefined
                      }}
                      onClick={() => navigate(`/user/${user.username}`)}
                      actionButton={
                        activeTab === 'requests' ? (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.acceptRequest(user.username), user.username); }} className="p-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.rejectRequest(user.username), user.username); }} className="p-2 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : activeTab === 'blocked' ? (
                          <button onClick={(e) => { e.stopPropagation(); handleNetworkAction(() => friendsApi.unblockUser(user.username), user.username); }} className="px-4 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm font-bold hover:bg-[var(--border-color)] transition-colors">
                            Unblock
                          </button>
                        ) : null
                      }
                    />
                  ))}
                </div>
              )}
              <PaginationLoader onLoadMore={() => fetchNetworkData()} hasMore={hasMore} isLoading={networkLoading} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}