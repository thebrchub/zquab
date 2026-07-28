import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Home, Loader2, LogIn, MessageSquare, User, BookOpen, Info, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isFullUser = user && !user.is_guest;

  // Close mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleStartChatting = async () => {
    if (user) {
      navigate('/chat');
      setIsMobileMenuOpen(false);
      return;
    }

    setLoading(true);
    try {
      await loginAsGuest();
      navigate('/chat');
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // if (isAuthPage) return null; 

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
            {!isChatPage && (
              <div className="hidden md:flex items-center gap-8 mr-4">
                <Link to="/about" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                  <Info className="w-5 h-5" /> About
                </Link>
                <Link to="/blog" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                  <BookOpen className="w-5 h-5" /> Blog
                </Link>

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-[var(--border-color)] mx-1"></div>

                {isFullUser ? (
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
            )}

            <ThemeToggle />

            {/* Primary CTA Button (Desktop) */}
            {isChatPage ? (
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 glass hover:bg-[var(--border-color)] text-[var(--text-main)] px-5 py-2.5 rounded-full font-bold transition-all duration-200 active:scale-95 text-base"
              >
                <Home className="w-5 h-5" /> Home
              </Link>
            ) : (
              !isFullUser && (
                <button
                  onClick={handleStartChatting}
                  disabled={loading}
                  className="hidden md:flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-7 py-3 rounded-full font-bold transition-all duration-200 active:scale-95 disabled:opacity-70 shadow-lg shadow-blue-500/20 text-base whitespace-nowrap"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Start Chat
                </button>
              )
            )}

            {/* Mobile-Only Icons: Core Action + Hamburger */}
            {!isChatPage && (
              <div className="md:hidden flex items-center gap-2">
                <Link to={isFullUser ? "/home" : "/auth"} className="p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95">
                  {isFullUser ? <MessageSquare className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </Link>
                
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className="p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            )}
            
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
          
          {isFullUser && (
            <Link to="/profile" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
              <User className="w-6 h-6 text-[var(--text-muted)]" /> Profile
            </Link>
          )}

          {/* Massive Mobile CTA for Guests inside the menu */}
          {!isFullUser && !isChatPage && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={handleStartChatting}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-[#3B82F6] active:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-blue-500/20 text-lg"
              >
                {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                Start Chat
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}