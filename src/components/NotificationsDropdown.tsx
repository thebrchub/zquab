import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { friendsApi } from '../api/friends';
import ThemeToggle from './ThemeToggle';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  friendRequests: any[];
  setFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingRequests: boolean;
  isFullUser: boolean | null;
}

export default function NotificationsDropdown({
  isOpen,
  onClose,
  friendRequests,
  setFriendRequests,
  isLoadingRequests,
  isFullUser
}: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleAcceptRequest = async (e: React.MouseEvent, username: string) => {
    // 🛠️ THE FIX: Prevent this click from triggering the parent row's navigation!
    e.preventDefault();
    e.stopPropagation(); 
    try {
      await friendsApi.acceptRequest(username);
      setFriendRequests((prev) => prev.filter(req => req.username !== username));
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, username: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    try {
      await friendsApi.rejectRequest(username);
      setFriendRequests((prev) => prev.filter(req => req.username !== username));
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRowClick = () => {
    onClose();
    // 🛠️ THE FIX: Do absolutely nothing if the user is in a stranger chat
    if (location.pathname === '/chat') return;
    
    // 🛠️ THE FIX: Navigate to the unified inbox instead of a direct user route
    navigate('/home');
  };

  return (
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
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
          </div>
        ) : friendRequests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-[var(--text-muted)]">No new requests</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {friendRequests.map((req) => (
              <div 
                key={req.request_id || req.username}
                onClick={handleRowClick}
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
  );
}