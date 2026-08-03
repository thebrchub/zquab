import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Loader2, LogIn, MessageSquare, User, BookOpen, Info, Menu, X, Search, Bell, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomsContext';
import { friendsApi } from '../api/friends'; 

export default function Navbar() {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const isHomePage = location.pathname === '/home';
  
  const isStaticPage = isChatPage || isHomePage;
  
  const { user, loginAsGuest, isLoading: isAuthLoading } = useAuth();
  
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🛠️ THE FIX: Aliased `loading` to `isLoadingRequests` to solve both TS errors!
  const { totalUnread, friendRequests, setFriendRequests, loading: isLoadingRequests } = useRooms();
  
  const isFullUser = user && !user.is_guest;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isStaticPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        setIsNotificationsOpen(false); 
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isStaticPage]);

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

  const handleAcceptRequest = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation(); 
    try {
      await friendsApi.acceptRequest(username);
      setFriendRequests(prev => prev.filter(req => req.username !== username));
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation(); 
    try {
      await friendsApi.rejectRequest(username);
      setFriendRequests(prev => prev.filter(req => req.username !== username));
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  return (
    <nav
      style={{ borderBottomColor: 'var(--border-color)' }}
      className={`sticky top-0 z-50 glass border-b transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 relative">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          <Link to="/" className="flex items-center gap-3 z-10">
            <img 
              src="/logo.png" 
              alt="zQuab Logo Icon" 
              className="h-8 sm:h-10 md:h-14 w-auto object-contain hover:scale-105 transition-transform" 
            />
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-[var(--text-main)]">
              zQuab
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto z-10">
            
            <div className="hidden md:flex items-center gap-8 mr-4">
              <Link to="/about" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                <Info className="w-5 h-5" /> About
              </Link>
              <Link to="/blog" className="flex items-center gap-2.5 text-base text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                <BookOpen className="w-5 h-5" /> Blog
              </Link>

              <div className="h-8 w-px bg-[var(--border-color)] mx-1"></div>

              {isAuthLoading ? (
                <div className="w-24 h-8 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
              ) : isFullUser ? (
                <>
                  <Link to="/home" className="flex items-center gap-2.5 text-base text-[var(--text-main)] hover:text-[#3B82F6] font-bold transition-colors py-2">
                    <div className="relative">
                      <MessageSquare className="w-5 h-5" />
                      {totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--background)]">
                          {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                      )}
                    </div>
                    Inbox
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

            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/search" className="p-2 sm:p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95" aria-label="Search">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`relative p-2 sm:p-2.5 rounded-full transition-colors active:scale-95 ${
                    isNotificationsOpen ? 'bg-[var(--border-color)] text-[var(--text-main)]' : 'text-[var(--text-main)] hover:bg-[var(--border-color)]'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {isFullUser && friendRequests.length > 0 && (
                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-[var(--background)] rounded-full"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  
                  <div className="fixed top-[72px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-80 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
                    <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--background)]">
                      <h3 className="font-bold text-[var(--text-main)] text-sm uppercase tracking-wider">Notifications</h3>
                      {isFullUser && friendRequests.length > 0 && (
                        <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {friendRequests.length} New
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {!isFullUser ? (
                        <div className="p-8 text-center">
                          <p className="text-sm font-medium text-[var(--text-muted)]">Log in to view notifications</p>
                        </div>
                      ) : isLoadingRequests ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" /></div>
                      ) : friendRequests.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-sm font-medium text-[var(--text-muted)]">No new requests</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border-color)]">
                          {friendRequests.map((req) => (
                            <div 
                              key={req.request_id}
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                navigate(`/user/${req.username}`);
                              }}
                              className="p-4 hover:bg-[var(--background)] transition-colors cursor-pointer flex flex-col gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
                                  {req.avatar_url ? (
                                    <img src={req.avatar_url} alt={req.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                                      {req.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[var(--text-main)] leading-tight">
                                    <span className="font-bold truncate block">{req.name}</span>
                                    <span className="text-[var(--text-muted)]">sent you a friend request.</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-13">
                                <button 
                                  onClick={(e) => handleAcceptRequest(e, req.username)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#3B82F6] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept
                                </button>
                                <button 
                                  onClick={(e) => handleRejectRequest(e, req.username)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-xs font-bold hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" /> Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[var(--background)] border-t border-[var(--border-color)] flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isAuthLoading ? (
              <div className="hidden md:block w-32 h-11 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
            ) : (
              <button
                onClick={handleStartChatting}
                disabled={isConnecting}
                className="hidden md:flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-7 py-3 rounded-full font-bold transition-all duration-200 active:scale-95 disabled:opacity-70 shadow-lg shadow-blue-500/20 text-base whitespace-nowrap"
              >
                {isConnecting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isFullUser ? 'Stranger Chat' : 'Start Chat'}
              </button>
            )}

            <div className="md:hidden flex items-center gap-1 sm:gap-2">
              {isAuthLoading ? (
                <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-full"></div>
              ) : (
                <Link to={isFullUser ? "/home" : "/auth"} className="relative p-2.5 text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-full transition-colors active:scale-95">
                  {isFullUser ? (
                    <>
                      <MessageSquare className="w-6 h-6" />
                      {totalUnread > 0 && (
                        <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-[var(--background)] rounded-full"></span>
                      )}
                    </>
                  ) : <User className="w-6 h-6" />}
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

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-[var(--card)] border-b border-[var(--border-color)] shadow-xl flex flex-col p-4 gap-2 z-40">
          <Link to="/about" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
            <Info className="w-6 h-6 text-[var(--text-muted)]" /> About
          </Link>
          <Link to="/blog" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
            <BookOpen className="w-6 h-6 text-[var(--text-muted)]" /> Blog
          </Link>
          
          {isAuthLoading ? (
             <div className="w-full h-14 bg-[var(--background)] border border-[var(--border-color)] animate-pulse rounded-xl my-2"></div>
          ) : isFullUser && (
            <Link to="/profile" className="flex items-center gap-3 p-4 text-[var(--text-main)] font-bold text-lg rounded-xl hover:bg-[var(--background)] transition-colors">
              <User className="w-6 h-6 text-[var(--text-muted)]" /> Profile
            </Link>
          )}

          {!isAuthLoading && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={handleStartChatting}
                disabled={isConnecting}
                className="w-full flex justify-center items-center gap-2 bg-[#3B82F6] active:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-blue-500/20 text-lg"
              >
                {isConnecting && <Loader2 className="w-6 h-6 animate-spin" />}
                {isFullUser ? 'Stranger Chat' : 'Start Chat'}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}