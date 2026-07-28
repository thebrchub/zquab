import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Loader2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GENDER_OPTIONS = ['Prefer not to say', 'Male', 'Female', 'Other'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [bio, setBio] = useState('');

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
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
    
    // TODO: Call PUT /api/v1/users/me with this data. 
    // const data = { username, name: username, age: parseInt(age), gender, bio };
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home'); 
    }, 1500);
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
          
          {/* Avatar Upload Placeholder */}
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

          {/* Username - With Permanent Warning */}
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

          {/* Age and Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Optional Age Block */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[var(--text-main)] ml-1">
                Age <span className="text-[var(--text-muted)] font-normal text-xs"></span>
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

            {/* Custom UI Gender Dropdown */}
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

                {/* Dropdown Menu */}
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

          {/* Bio - Moved down and expanded to a Textarea */}
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