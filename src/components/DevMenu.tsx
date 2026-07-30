import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ChevronDown, Rocket, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

export default function DevMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { user, devMockLogin, logout } = useAuth();

  if (import.meta.env.PROD) return null;

  const handleAuthToggle = () => {
    if (user) {
      logout(); 
    } else {
      devMockLogin(); 
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-56 flex flex-col gap-2 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Dev Menu</span>
          </div>
          
          <Link to="/dev/onboarding" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🎨 UI: Onboarding
          </Link>
          <Link to="/dev/auth" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🔐 UI: Auth
          </Link>
          <Link to="/dev/home" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            📥 UI: Inbox
          </Link>
          <Link to="/dev/chat" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            💬 UI: Chat Room
          </Link>
          {/* 🛠️ Added the Profile UI Link here */}
          <Link to="/dev/profile" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            👤 UI: Profile
          </Link>

          {/* Authentication UI Toggle */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={handleAuthToggle}
              className={`w-full flex items-center justify-center gap-2 text-sm font-bold p-2 rounded-lg transition-colors ${
                user 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {user ? (
                <>
                  <UserX className="w-4 h-4" /> Drop Mock Auth
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Mock Logged-In
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 transition-transform active:scale-95 border-2 border-purple-400/50"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bug className="w-6 h-6" />}
      </button>
    </div>
  );
}