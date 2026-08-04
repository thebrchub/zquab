import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Loader2, ChevronDown, Check, MapPin, Lock } from 'lucide-react'; // 🛠️ Added Lock icon
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client'; 
import { useAuth } from '../context/AuthContext'; 
import { ALL_COUNTRIES } from '../constants/countries';

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Other'];

// 🛠️ The complete, lightweight static list of all countries (No heavy npm libraries needed!)


export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [bio, setBio] = useState('');
  
  const [country, setCountry] = useState('Detecting...'); 
  const [isCountryLocked, setIsCountryLocked] = useState(false); // 🛠️ NEW: Controls if country is changeable

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🛠️ Fetch Country on mount
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country) {
          setCountry(data.country);
          setIsCountryLocked(true); // Lock it down!
        } else {
          setCountry('');
          setIsCountryLocked(false); // Let them choose manually
        }
      } catch (err) {
        console.warn("IP Geolocation failed, falling back to manual selection.", err);
        setCountry('');
        setIsCountryLocked(false);
      }
    };
    fetchCountry();
  }, []);

  // Handle clicking outside for Gender dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload: any = {
        username: username,
        name: username, 
      };

      if (bio.trim()) payload.bio = bio.trim();
      if (age.trim()) payload.age = age.trim();
      
      if (country && country !== 'Detecting...') {
        payload.country = country;
      }

      payload.gender = gender === 'Prefer not to say' ? 'Any' : gender;

      await apiClient.patch('/users/me', payload);
      await refreshSession();
      navigate('/home'); 

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
        alert("That username is either already taken, or your profile is already permanently set up! Try refreshing the page.");
      } else {
        alert(error.response?.data?.error || "Failed to save profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-[100dvh] bg-[var(--background)] py-10 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-lg z-10">
        
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-[var(--text-main)] tracking-tight"
          >
            Create your identity
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-muted)] mt-2"
          >
            Set up your profile to start connecting.
          </motion.p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2rem] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-[var(--background)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center overflow-hidden group-hover:border-[#3B82F6] transition-colors">
                <Camera className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[#3B82F6] transition-colors" />
              </div>
              <div className="absolute bottom-0 right-0 bg-[#3B82F6] p-2 rounded-full border-2 border-[var(--card)] shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] mt-3">Upload Profile Picture</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[var(--text-main)] ml-1 flex justify-between items-end">
              Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-[var(--text-muted)] font-bold">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="shadow_ninja"
                className="w-full pl-10 pr-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                required
                maxLength={30}
              />
            </div>
            <div className="flex items-start gap-1.5 mt-1.5 ml-1">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-orange-500 leading-tight">
                Choose carefully. Your username is permanent and cannot be changed later.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[var(--text-main)] ml-1">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 21"
                min="13"
                max="120"
                className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
              />
            </div>

            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-sm font-bold text-[var(--text-main)] ml-1">Gender</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3.5 bg-[var(--background)] border rounded-xl text-left flex items-center justify-between transition-all focus:outline-none ${
                    isDropdownOpen ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20' : 'border-[var(--border-color)]'
                  }`}
                >
                  <span className="text-[var(--text-main)]">{gender}</span>
                  <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-full mt-2 bg-[var(--card)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden py-1"
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setGender(option);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-[var(--text-main)] hover:bg-[var(--background)] transition-colors flex items-center justify-between"
                        >
                          {option}
                          {gender === option && <Check className="w-4 h-4 text-[#3B82F6]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 🛠️ UPDATED: Country Section (Read-Only Lock OR Native Fallback Dropdown) */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[var(--text-main)] ml-1 flex justify-between">
              Country {isCountryLocked && <span className="text-xs font-normal text-[#3B82F6] flex items-center gap-1"><Check className="w-3 h-3"/> Auto-detected</span>}
            </label>
            
            {isCountryLocked ? (
              // 🔒 The API Succeeded: Show an unchangeable locked UI
              <div className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl flex items-center justify-between opacity-80 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[var(--text-main)] font-semibold">{country}</span>
                </div>
                <Lock className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ) : (
              // ⚠️ The API Failed: Show Native Select so users can type "I" to jump to India
              <select 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25em 1.25em'
                }}
              >
                <option value="" disabled>Select country</option>
                {ALL_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline ml-1">
              <label className="text-sm font-bold text-[var(--text-main)]">Bio</label>
              <span className="text-xs text-[var(--text-muted)]">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short intro about yourself..."
              rows={4}
              className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all resize-none custom-scrollbar"
              maxLength={160}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full py-4 mt-2 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Complete Setup'
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}