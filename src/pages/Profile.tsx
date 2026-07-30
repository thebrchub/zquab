import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, Camera, Save, User, AtSign, AlignLeft, 
  Users, MessageSquare, Edit2, X, MapPin, Calendar, Activity,
  Globe, Shield
} from 'lucide-react';

const GENDER_OPTIONS = ['Any', 'Male', 'Female', 'Other'];

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); 
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Any');
  const [age, setAge] = useState(''); 
  const [country, setCountry] = useState('India'); 
  const [hasExistingUsername, setHasExistingUsername] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authUser?.is_guest) {
        setLoading(false);
        return;
      }

      try {
        const data = await usersApi.getMe();
        setProfile(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setGender(data.gender || 'Any');
        if (data.username) setHasExistingUsername(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = { bio, gender };
      if (!hasExistingUsername && username) {
        payload.username = username;
      }
      
      const updated = await usersApi.updateMePartial(payload);
      setProfile({ ...updated, age, country }); 
      if (updated.username) setHasExistingUsername(true);
      
      setSuccess(true);
      setIsEditing(false); 
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (authUser?.is_guest) {
    return (
      <div className="max-w-4xl mx-auto w-full p-6 pb-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center border border-[var(--border-color)] mb-4 shadow-sm">
          <User className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Guest Account</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md">
          You are currently browsing anonymously. To set up a profile, add friends, and save your chats, please create a full account.
        </p>
        <button 
          onClick={() => navigate('/auth')} 
          className="px-8 py-3 bg-[#3B82F6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
        >
          Log In / Register
        </button>
      </div>
    );
  }

  return (
    // 🛠️ UX FIX: Expanded the max-width to 7xl so it breathes better on desktop
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 xl:p-12 pb-20">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Your Profile</h1>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-full hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all active:scale-95 shadow-sm"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        
        {/* LEFT COLUMN: Profile Display or Edit Form (Takes up 2/3 of space) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-10 shadow-sm">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-[var(--border-color)] pb-8 mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-[var(--background)] border-4 border-[var(--border-color)] overflow-hidden flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-[var(--text-muted)]" />
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left mt-2 sm:mt-0 flex-1">
                <h2 className="text-3xl font-black text-[var(--text-main)]">{profile?.name || username || 'New User'}</h2>
                <p className="text-lg text-[var(--text-muted)] font-medium mt-1">@{username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                   <span className="px-4 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full text-sm font-bold flex items-center gap-2">
                     <MapPin className="w-4 h-4" /> 🇮🇳 India
                   </span>
                </div>
              </div>
            </div>

            {error && <div className="p-4 bg-red-500/10 text-red-500 font-medium rounded-xl text-sm mb-6">{error}</div>}
            {success && <div className="p-4 bg-green-500/10 text-green-500 font-medium rounded-xl text-sm mb-6">Profile updated successfully!</div>}

            {/* VIEW MODE */}
            {!isEditing ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">About Me</h3>
                  <p className="text-[var(--text-main)] text-lg leading-relaxed whitespace-pre-wrap bg-[var(--background)] p-6 rounded-2xl border border-[var(--border-color)] min-h-[120px]">
                    {bio || <span className="text-[var(--text-muted)] italic">No bio added yet.</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[var(--background)] p-5 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Activity className="w-5 h-5" /> <span className="text-sm font-bold">Gender</span>
                    </div>
                    <p className="text-[var(--text-main)] font-semibold text-lg">{gender}</p>
                  </div>
                  <div className="bg-[var(--background)] p-5 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Calendar className="w-5 h-5" /> <span className="text-sm font-bold">Age</span>
                    </div>
                    <p className="text-[var(--text-main)] font-semibold text-lg">{age || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-[#3B82F6]" /> Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={hasExistingUsername}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="choose_a_username"
                  />
                  {hasExistingUsername && (
                    <p className="text-xs font-medium text-[var(--text-muted)] ml-1">Usernames are permanent and cannot be changed.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text-main)]">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all appearance-none"
                    >
                      {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text-main)]">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all"
                      placeholder="e.g. 21"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)]">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all appearance-none"
                  >
                    <option value="India">🇮🇳 India</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Global">🌍 Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-[#3B82F6]" /> Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-[var(--text-main)] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all resize-none custom-scrollbar"
                    placeholder="Tell everyone a bit about yourself..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                    }}
                    className="flex-1 py-4 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:bg-[var(--border-color)] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <X className="w-5 h-5" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || (!hasExistingUsername && !username.trim())}
                    className="flex-1 py-4 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Action Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 🛠️ UX FIX: Prominent Stranger Chat Feature Card */}
          <div className="bg-gradient-to-br from-[#3B82F6] to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
              <MessageSquare className="w-40 h-40" />
            </div>
            
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 backdrop-blur-md uppercase tracking-wider">
                🔥 Popular
              </span>
              <h3 className="text-2xl font-black mb-2">Stranger Chat</h3>
              <p className="text-blue-100 text-sm mb-8 leading-relaxed max-w-[220px]">
                Connect anonymously with someone new right now. No profile required.
              </p>
              
              <button
                onClick={() => navigate('/chat')}
                className="w-full py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Start Chatting
              </button>
            </div>
          </div>

          {/* Secondary Action: Friends Hub */}
          <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Your Network</h3>
            <button
              onClick={() => navigate('/friends')}
              className="w-full flex items-center justify-between px-5 py-4 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-bold hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#3B82F6] transition-colors" />
                Manage Friends
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* 🛠️ UX/SEO FIX: Blog-style article section completely outside the constraints */}
      <article className="mt-20 max-w-4xl mx-auto border-t border-[var(--border-color)] pt-16">
        <header className="mb-10 text-center lg:text-left">
          <h2 className="text-3xl font-black text-[var(--text-main)] mb-4">Welcome to the zQuab Community</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">
            Discover a secure space designed for meaningful interactions. Whether you want to build a lasting network or just have a spontaneous conversation, you are in control.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="space-y-4">
            <div className="w-12 h-12 bg-[#3B82F6]/10 text-[#3B82F6] rounded-2xl flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Make Connections</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Search for users, send friend requests, and build your personal network. Once connected, you can chat anytime, anywhere, and pick up right where you left off.
            </p>
          </section>

          <section className="space-y-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Anonymous Discovery</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Use our Stranger Chat feature to meet new people completely anonymously. You decide if and when you want to reveal your profile or add them as a friend.
            </p>
          </section>

          <section className="space-y-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Stay Secure</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Your safety is paramount. Do not accept friend requests from people you aren't comfortable with. You have complete control to block or report users at any time.
            </p>
          </section>
        </div>
      </article>

    </div>
  );
}