import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Home, Loader2, LogIn, MessageSquare, User, BookOpen, Info, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  // 🛠️ THE FIX: Grab isLoading from AuthContext to prevent the flash
  // We alias it to 'isAuthLoading' to not conflict with the local 'isConnecting' state
  const { user, loginAsGuest, isLoading: isAuthLoading } = useAuth();
  
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false); // Renamed from 'loading'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isFullUser = user && !user.is_guest;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleStartChatting = async () => {
    if (user) {
      navigate('/chat');
      setIsMobileMenuOpen(false);
      return;
    }

    setIsConnecting(true);
    try {
      await loginAsGuest();
      navigate('/chat');
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 relative">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Left: Logo & Text */}
          <Link 
            to="/" 
            className={`flex items-center gap-3 z-10 ${
              isChatPage ? "absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0" : "" 
            }`}
          >
            <img 
              src="/logo.png" 
              alt="zQuab Logo Icon" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform" 
            />
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-[var(--text-main)]">
              zQuab
            </span>
          </Link>

          {/* Right: Controls & Routing */}
          <div className="flex items-center gap-2 sm:gap-6 ml-auto z-10">
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 mr-4">
              <Link to="/about" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                <Info className="w-5 h-5" /> About
              </Link>
              <Link to="/blog" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                <BookOpen className="w-5 h-5" /> Blog
              </Link>

              <div className="h-8 w-px bg-[var(--border-color)] mx-1"></div>

              {/* 🛠️ Prevent Login flash: Show a skeleton loader if auth is still resolving */}
              {isAuthLoading ? (
                <div className="w-24 h-8 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
              ) : isFullUser ? (
                <>
                  <Link to="/home" className="flex items-center gap-2.5 text-base text-[var(--text-main)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2.5 text-base text-[var(--text-main)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                    <User className="w-5 h-5" /> Profile
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="flex items-center gap-2.5 text-base text-[var(--text-main)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                  <LogIn className="w-5 h-5" /> Log in
                </Link>
              )}
            </div>

            <ThemeToggle />

            {/* Primary CTA Button */}
            {isChatPage ? (
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 glass hover:bg-[var(--border-color)] text-[var(--text-main)] px-5 py-2.5 rounded-full font-bold transition-all duration-200 active:scale-95 text-base"
              >
                <Home className="w-5 h-5" /> Home
              </Link>
            ) : isAuthLoading ? (
              // 🛠️ Skeleton loader for the Start Chat button to prevent layout shifts
              <div className="hidden md:block w-32 h-11 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
            ) : (
              !isFullUser && (
                <button
                  onClick={handleStartChatting}
                  disabled={isConnecting}
                  className="hidden md:flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-7 py-3 rounded-full font-bold transition-all duration-200 active:scale-95 disabled:opacity-70 shadow-lg shadow-blue-500/20 text-base whitespace-nowrap"
                >
                  {isConnecting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Start Chat
                </button>
              )
            )}

            {/* Mobile-Only Icons */}
            <div className="md:hidden flex items-center gap-2">
              {/* 🛠️ Skeleton loader for mobile user icon */}
              {isAuthLoading ? (
                <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
              ) : (
                <Link to={isFullUser ? "/home" : "/auth"} className="p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95">
                  {isFullUser ? <MessageSquare className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </Link>
              )}
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-[var(--card)] border-b border-[var(--border-color)] shadow-xl flex flex-col p-4 gap-2 z-40">
          <Link to="/about" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
            <Info className="w-6 h-6 text-[var(--text-muted)]" /> About
          </Link>
          <Link to="/blog" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
            <BookOpen className="w-6 h-6 text-[var(--text-muted)]" /> Blog
          </Link>
          
          {/* 🛠️ Handle Mobile Dropdown links based on auth loading state */}
          {isAuthLoading ? (
             <div className="w-full h-14 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-xl my-2"></div>
          ) : isFullUser && (
            <Link to="/profile" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
              <User className="w-6 h-6 text-[var(--text-muted)]" /> Profile
            </Link>
          )}

          {!isAuthLoading && !isFullUser && !isChatPage && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={handleStartChatting}
                disabled={isConnecting}
                className="w-full flex justify-center items-center gap-2 bg-[#3B82F6] active:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-blue-500/20 text-lg"
              >
                {isConnecting && <Loader2 className="w-6 h-6 animate-spin" />}
                Start Chat
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}