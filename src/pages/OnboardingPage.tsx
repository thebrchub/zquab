import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // 🛠️ FIX: Imported native router navigation
import { AlertCircle, Loader2, ChevronDown, Check, MapPin, Lock, User, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext'; 
import { ALL_COUNTRIES } from '../constants/countries'; 

import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Other'];

export default function OnboardingPage() {
  const { refreshSession } = useAuth(); 
  const navigate = useNavigate(); // 🛠️ FIX: Use SPA navigation instead of hard reloads
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [bio, setBio] = useState('');
  
  const [country, setCountry] = useState('Detecting...'); 
  const [isCountryLocked, setIsCountryLocked] = useState(false); 

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [zAvatarRequested, setZAvatarRequested] = useState(false);
  const [avatarVariant, setAvatarVariant] = useState(0);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const avatarPreview = useMemo(() => {
    if (!username || gender === 'Prefer not to say' || !zAvatarRequested) return null;
    return createAvatar(lorelei, {
      seed: `${username}-${avatarVariant}`,
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"]
    }).toDataUri();
  }, [username, gender, zAvatarRequested, avatarVariant]);

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('idle');
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);
    setSubmitError(null);

    const debounceTimer = setTimeout(async () => {
      try {
        await usersApi.checkUsername(username);
        setUsernameStatus('available');
      } catch (error: any) {
        setUsernameStatus('taken');
        setUsernameError('This username is already taken.');
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [username]);

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country) {
          setCountry(data.country);
          setIsCountryLocked(true); 
        } else {
          setCountry('');
          setIsCountryLocked(false); 
        }
      } catch (err) {
        console.warn("IP Geolocation failed, falling back to manual selection.", err);
        setCountry('');
        setIsCountryLocked(false);
      }
    };
    fetchCountry();
  }, []);

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
    setSubmitError(null); 
    setIsLoading(true);
    
    try {
      const payload: any = {
        username: username,
        name: username, 
      };

      if (zAvatarRequested && gender !== 'Prefer not to say') {
        payload.avatar_url = createAvatar(lorelei, {
          seed: `${username}-${avatarVariant}`,
          size: 128,
          backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"]
        }).toDataUri();
      }

      if (bio.trim()) payload.bio = bio.trim();
      if (age.trim()) payload.age = age.trim();
      if (country && country !== 'Detecting...') payload.country = country;
      
      payload.gender = gender === 'Prefer not to say' ? 'Any' : gender;

      // 1. Send the save request to the backend
      await usersApi.updateMePartial(payload);
      
      // 🛠️ FIX: Force Javascript to WAIT for the fresh data to return from the database before moving on
      await refreshSession(); 
      
      sessionStorage.setItem('zquab_show_welcome', 'true');
      
      // 🛠️ FIX: Navigate smoothly without destroying the newly fetched React state
      navigate('/chat'); 

    } catch (error: any) {
      console.error(error);
      setIsLoading(false); // Only turn off loading if it fails!
      if (error.response?.status === 409) {
        setSubmitError("That username is already taken, or your profile is already permanently set up.");
        setUsernameStatus('taken');
      } else {
        setSubmitError(error.response?.data?.error || "Failed to save profile. Please try again.");
      }
    }
  };
  
  return (
    <>
      {/* 🛠️ PREMIUM UX: The immersive loading animation you requested! */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[var(--background)]/80 backdrop-blur-md flex flex-col items-center justify-center px-4 text-center"
          >
            <div className="w-20 h-20 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 border border-blue-500/20 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/20 to-transparent blur-md"></div>
               <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin relative z-10" />
            </div>
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-black text-[var(--text-main)] tracking-tight"
            >
              Forging your identity...
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[var(--text-muted)] mt-3 font-medium"
            >
              Securing your anonymous profile and connecting to the network.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

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
            <AnimatePresence>
              {submitError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-red-500 leading-tight">{submitError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--background)] border-2 border-[var(--border-color)] flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Generated zAvatar" className="w-full h-full object-cover scale-110" />
                ) : (
                  <User className="w-12 h-12 text-[var(--text-muted)]" />
                )}
              </div>

              <div className="mt-4 h-10 flex items-center justify-center">
                {gender === 'Prefer not to say' ? (
                  <span className="text-xs font-bold text-[var(--text-muted)]">Select gender to create zAvatar</span>
                ) : !zAvatarRequested ? (
                  <button 
                    type="button" 
                    onClick={() => { setZAvatarRequested(true); setAvatarVariant(0); }}
                    disabled={!username || usernameStatus === 'taken'}
                    className="px-5 py-2.5 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-full text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Generate zAvatar
                  </button>
                ) : (
                  <div className="flex items-center gap-6">
                    <button 
                      type="button" 
                      onClick={() => setAvatarVariant(v => v + 1)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-600 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reroll
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setZAvatarRequested(false); setAvatarVariant(0); }}
                      className="text-xs font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
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
                  className={`w-full pl-10 pr-12 py-3.5 bg-[var(--background)] border ${
                    usernameStatus === 'taken' ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    usernameStatus === 'available' ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 
                    'border-[var(--border-color)] focus:ring-[#3B82F6]'
                  } rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all`}
                  required
                  maxLength={30}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
                  {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                  {usernameStatus === 'taken' && <X className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              
              <div className="h-4 mt-1.5 ml-1">
                {usernameError ? (
                  <p className="text-xs font-bold text-red-500 animate-in slide-in-from-top-1">{usernameError}</p>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-orange-500 leading-tight">
                      Choose carefully. Your username is permanent.
                    </p>
                  </div>
                )}
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

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[var(--text-main)] ml-1 flex justify-between">
                Country {isCountryLocked && <span className="text-xs font-normal text-[#3B82F6] flex items-center gap-1"><Check className="w-3 h-3"/> Auto-detected</span>}
              </label>
              
              {isCountryLocked ? (
                <div className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-color)] rounded-xl flex items-center justify-between opacity-80 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-[var(--text-main)] font-semibold">{country}</span>
                  </div>
                  <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              ) : (
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
              disabled={isLoading || !username || usernameStatus === 'checking' || usernameStatus === 'taken'}
              className="w-full py-4 mt-2 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
              Complete Setup
            </button>
          </motion.form>
        </div>
      </div>
    </>
  );
}