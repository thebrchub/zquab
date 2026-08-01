import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserMinus, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '../../api/friends'; // Ensure this path is correct

interface Props {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendAvatar: string | null;
  friendUsername?: string;
}

export default function ChatDetailsSidebar({ isOpen, onClose, friendName, friendAvatar, friendUsername }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRemoveFriend = async () => {
    if (!friendUsername) {
      alert("Error: Friend username is missing.");
      return;
    }
    
    setLoading(true);
    try {
      // 🛠️ Assuming your backend has a removeFriend endpoint. Update the method name if it differs!
      await friendsApi.removeFriend(friendUsername); 
      
      // Successfully removed! Close the chat and go back to inbox
      navigate('/home');
      window.location.reload(); // Quick refresh to update the inbox lists
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to remove friend.');
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Overlay (Mobile primarily) */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute top-0 right-0 h-full w-full sm:w-80 bg-[var(--card)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <h3 className="font-bold text-[var(--text-main)]">Details</h3>
                <button 
                  onClick={onClose} 
                  className="p-2 bg-[var(--background)] rounded-full hover:bg-[var(--border-color)] transition-colors text-[var(--text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Summary */}
              <div className="flex flex-col items-center p-6 border-b border-[var(--border-color)]">
                <div className="w-24 h-24 rounded-full border-4 border-[var(--background)] bg-[var(--border-color)] overflow-hidden flex items-center justify-center shadow-lg mb-4">
                  {friendAvatar ? (
                    <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-[var(--text-muted)]" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-[var(--text-main)] truncate w-full text-center">{friendName}</h2>
                {friendUsername && <p className="text-sm text-[var(--text-muted)] mt-1">@{friendUsername}</p>}
              </div>

              {/* Actions Area */}
              <div className="p-4 mt-auto">
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-colors active:scale-95"
                >
                  <UserMinus className="w-5 h-5" />
                  Remove Friend
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-inset ring-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Remove Friend?</h3>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed text-sm">
                Are you sure you want to remove <strong>{friendName}</strong> from your friends list? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleRemoveFriend}
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Remove'}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--background)] hover:bg-[var(--border-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}