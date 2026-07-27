import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Home, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  // Bring in Auth and Routing
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartChatting = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      navigate('/chat'); // <-- FIX: Route to anonymous chat, not the dashboard!
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16">
          
         {/* Left/Center: Logo */}
          <Link 
            to="/" 
            className={`flex items-center gap-2.5 transition-all duration-300 z-10 ${
              isChatPage 
                ? "absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0" 
                : "" 
            }`}
          >
            <img 
              src="/logo.png" 
              alt="zQuab Logo" 
              className="h-10 md:h-12 w-auto object-contain hover:opacity-80 transition-opacity" 
            />
            <span className="font-bold text-2xl tracking-tight text-[var(--text-main)]">
              zQuab
            </span>
          </Link>

          {/* Center spacer for desktop */}
          <div className="hidden md:flex flex-1" />

          {/* Right: Controls */}
          <div className="flex items-center gap-4 ml-auto z-10">
            <ThemeToggle />
            
            {isChatPage ? (
              // On Chat Page: Home Button
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 glass hover:bg-[var(--border-color)] text-[var(--text-main)] px-5 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            ) : (
              // On Other Pages: Start Chat Button connected to Backend
              <button
                onClick={handleStartChatting}
                disabled={loading}
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-5 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Start Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}