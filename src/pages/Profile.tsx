import { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import { Loader2, Camera, Save, User, AtSign, AlignLeft } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [hasExistingUsername, setHasExistingUsername] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getMe();
        setProfile(data);
        setName(data.name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        // If the backend returns a username, it is permanently locked
        if (data.username) setHasExistingUsername(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = { name, bio };
      if (!hasExistingUsername && username) {
        payload.username = username;
      }
      
      const updated = await usersApi.updateMePartial(payload);
      setProfile(updated);
      if (updated.username) setHasExistingUsername(true);
      setSuccess(true);
      
      // Hide success message after 3 seconds
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

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-6 pb-20">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">Your Profile</h1>

      <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-[var(--border-color)] overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Tap to change avatar</p>
        </div>

        {/* Form Section */}
        <div className="space-y-5">
          {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">Profile updated successfully!</div>}

          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#3B82F6]" /> Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="How should people call you?"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-[#3B82F6]" /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={hasExistingUsername}
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="choose_a_username"
            />
            {hasExistingUsername && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">Usernames cannot be changed once set.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-[#3B82F6]" /> Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors resize-none"
              placeholder="Tell everyone a bit about yourself..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-3.5 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Profile
          </button>
        </div>

      </div>
    </div>
  );
}