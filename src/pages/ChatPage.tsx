import { useState, useEffect, useRef, useMemo } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConnectionCard from '../components/chat/ConnectionCard';
import TypingIndicator from '../components/chat/TypingIndicator';
import { Loader2, UserPlus, MoreVertical, LogOut, Image, Check, X, HeartHandshake, ImageMinus, UserX, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatClient, type ChatMessage } from '../utils/chatClient';
import { useAuth } from '../context/AuthContext';

type Status = 'idle' | 'searching' | 'connected' | 'disconnected';

// 🛠️ 1. ADDED isUploading to the UI Message Type
type UIMessage = ChatMessage & { isSystem?: boolean; isUploading?: boolean };

const compressImageToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      const MAX_SIZE = 1200;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not supported');
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const webpFile = new File([blob], newName, { type: 'image/webp' });
            resolve(webpFile);
          } else {
            reject('Blob creation failed');
          }
        },
        'image/webp',
        0.8 
      );
    };
    img.onerror = () => reject('Image load failed');
  });
};

export default function ChatPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null); 
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [userCountry, setUserCountry] = useState<{ name: string; code: string } | null>(null);
  const [partnerCountry, setPartnerCountry] = useState<{ name: string; code: string } | null>(null);
  const [incomingPhotoRequest, setIncomingPhotoRequest] = useState(false);
  const [photoRequestBusy, setPhotoRequestBusy] = useState(false);
  const [partnerUsername, setPartnerUsername] = useState<string | undefined>(undefined);
  const [partnerGender, setPartnerGender] = useState<string | undefined>(undefined);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingStateRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoRequestTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV;
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 🛠️ THE FIX: Strictly lock the global body scroll while on the Chat Page
  // This prevents the mobile keyboard from pushing the header behind the navbar
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none'; // Prevents mobile pull-to-refresh bounce
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  const handleMockConnect = (type: 'guest' | 'registered') => {
    setStatus('searching');
    setTimeout(() => {
      setStatus('connected');
      setPartnerCountry({ name: 'United States', code: 'US' });
      setPartnerUsername(type === 'registered' ? 'shadow_ninja' : undefined);
      setPartnerGender(type === 'registered' ? 'Male' : undefined);
      setFriendRequestSent(false);
    }, 1500);
  };

  const handleMockReceiveMessage = () => {
    if (status !== 'connected') return;
    setIsPartnerTyping(true);
    setTimeout(() => {
      setIsPartnerTyping(false);
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, text: 'Hey! This is a mock message from the frontend.', isOwn: false }]);
    }, 1500);
  };

  useEffect(() => {
    const hasAcceptedRules = sessionStorage.getItem('zquab_rules_accepted');
    if (!hasAcceptedRules) {
      setShowRulesModal(true);
    }
  }, []);

  const handleAcceptRules = () => {
    if (!rulesAgreed) return;
    sessionStorage.setItem('zquab_rules_accepted', 'true');
    setShowRulesModal(false);
  };

  const clearPhotoRequestTimeout = () => {
    if (photoRequestTimeoutRef.current !== null) {
      window.clearTimeout(photoRequestTimeoutRef.current);
      photoRequestTimeoutRef.current = null;
    }
  };

  const chatClient = useMemo(() => {
    if (isDev) return null; 
    
    return new ChatClient({
      onStatusChange: setStatus,
      onIncomingMessage: (message) => setMessages((prev) => [...prev, message]),
      onSystemMessage: (text) => {
        console.log('[Chat System]:', text);
        setMessages((prev) => [...prev, { id: `sys-${Date.now()}-${Math.random()}`, text, isSystem: true, isOwn: false }]);
      },
      onMatchFound: (_roomId, _partnerId, partnerLocation, partnerUsername) => {
        setPartnerUsername(partnerUsername);
        if (!partnerLocation) {
          setPartnerCountry({ name: 'Unknown location', code: '' });
          return;
        }
        const normalized = partnerLocation.trim().replace(/^"|"$/g, '');
        if (/^[A-Za-z]{2}$/.test(normalized)) {
          setPartnerCountry({ name: normalized.toUpperCase(), code: normalized.toUpperCase() });
        } else {
          setPartnerCountry({ name: normalized, code: '' });
        }
      },
      onFriendAccepted: (dmRoomId) => {
        setFriendRequestSent(false);
        navigate(`/chat/${dmRoomId}`);
      },
      onLocationDetected: (country) => setUserCountry(country),
      onPartnerTyping: (isTyping) => setIsPartnerTyping(isTyping),
      onDisconnected: () => {
        setStatus('disconnected');
        setIsPartnerTyping(false); 
      },
      onSocketOpen: () => console.log('WebSocket Connected'),
      onSocketClose: () => console.log('WebSocket Closed'),
      onError: (error) => console.error('WebSocket Error:', error),
      onPhotoRequest: () => {
        setIncomingPhotoRequest(true);
        setMessages((prev) => [...prev, { id: `sys-pr-${Date.now()}`, text: 'Stranger wants to see a photo of you.', isSystem: true, isOwn: false }]);
      },
      onPhotoResponse: (_roomId, _from, accepted) => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages((prev) => [...prev, { id: `sys-prr-${Date.now()}`, text: accepted ? 'Stranger accepted — waiting for the photo...' : 'Stranger declined your photo request.', isSystem: true, isOwn: false }]);
      },
      onPhotoReady: (_roomId, _from, url) => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages((prev) => [...prev, { id: `msg-photo-${Date.now()}`, text: '', isOwn: false, imageUrl: url }]);
      },
    });
  }, [isDev]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (statusRef.current === 'connected') {
        e.preventDefault();
        e.returnValue = ''; 
      } else {
        chatClient?.leaveQueueSilently(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chatClient?.leaveQueueSilently();
      chatClient?.shutdown();
      clearPhotoRequestTimeout();
    };
  }, [chatClient]); 

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (status !== 'connected') return;
      const target = (e.target as HTMLElement).closest('a');
      if (target) {
        if (target.target === '_blank') return; 
        e.preventDefault();
        e.stopPropagation(); 
        const href = target.getAttribute('href');
        if (href) {
          setPendingRoute(href);
          setShowLeaveConfirm(true); 
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [status]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, status, isPartnerTyping]);

  const handleStartChat = () => {
    if (isDev) {
      handleMockConnect('guest');
      return;
    }
    setStatus('searching');
    chatClient?.start().catch((error) => console.error(error));
  };

  const handleSend = (text: string) => {
    if (status !== 'connected') return;
    
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    isTypingStateRef.current = false;
    chatClient?.sendTypingEnd();

    const newId = `msg-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id: newId, text, isOwn: true }]);

    if (!isDev) {
      chatClient?.sendChatMessage(text);
    }
  };

  const handleTyping = () => {
    if (status !== 'connected' || isDev) return; 
    
    if (!isTypingStateRef.current) {
      isTypingStateRef.current = true;
      chatClient?.sendTypingStart();
    }
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = window.setTimeout(() => {
      isTypingStateRef.current = false;
      chatClient?.sendTypingEnd();
    }, 2000); 
  };

  const handleNext = () => {
    if (isDev) {
      setMessages([]);
      handleMockConnect(Math.random() > 0.5 ? 'guest' : 'registered');
      setShowMobileMenu(false); 
      return;
    }
    chatClient?.nextStranger().catch(() => {});
    setMessages([]);
    setShowMobileMenu(false);
    setIncomingPhotoRequest(false);
    setPhotoRequestBusy(false);
    setIsPartnerTyping(false);
    clearPhotoRequestTimeout();
  };

  const handleRequestPhoto = () => {
    if (user?.is_guest) {
      setShowLoginPrompt(true);
      return;
    }
    if (isDev) {
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, text: 'Mock: Photo request sent.', isOwn: false, isSystem: true }]);
      return;
    }
    setPhotoRequestBusy(true);
    chatClient?.requestPhoto()
      .then(() => {
        clearPhotoRequestTimeout();
        photoRequestTimeoutRef.current = window.setTimeout(() => {
          photoRequestTimeoutRef.current = null;
          setPhotoRequestBusy(false);
          setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, text: "Stranger didn't respond.", isSystem: true, isOwn: false }]);
        }, 30_000);
      })
      .catch(() => setPhotoRequestBusy(false));
  };

  const handleDeclinePhotoRequest = () => {
    setIncomingPhotoRequest(false);
    chatClient?.declinePhotoRequest().catch(() => {});
  };

  const handleAcceptPhotoRequest = () => {
    setIncomingPhotoRequest(false);
    photoFileInputRef.current?.click();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (!file) return;

    const tempId = `msg-upload-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);

    setMessages((prev) => [
      ...prev, 
      { id: tempId, text: '', isOwn: true, imageUrl: localPreviewUrl, isUploading: true }
    ]);

    try {
      const webpFile = await compressImageToWebP(file);
      if (!isDev) await chatClient?.sharePhoto(webpFile);
      setMessages((prev) => prev.map(msg => 
        msg.id === tempId ? { ...msg, isUploading: false } : msg
      ));
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      setMessages((prev) => [
        ...prev, 
        { id: `sys-err-${Date.now()}`, text: 'Failed to upload photo.', isSystem: true, isOwn: false }
      ]);
    }
  };

  const handleAddFriend = () => {
    if (!user || user.is_guest) {
      setShowLoginPrompt(true); 
      return;
    }
    if (isDev) {
      setFriendRequestSent(true);
      return;
    }
    setFriendRequestSent(true);
    chatClient?.addCurrentPartnerAsFriend().catch((error) => {
      console.error(error);
      setFriendRequestSent(false);
    });
  };

  const handleLeaveConfirm = () => {
    if (pendingRoute) {
      navigate(pendingRoute);
    } else {
      navigate('/');
    }
  };

  return (
    
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:gap-6 p-0 md:p-6 overflow-hidden h-[calc(100dvh-64px)] md:h-[calc(100dvh-82px)] relative">
      
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingImage(null)}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={viewingImage}
              alt="Fullscreen view"
              onClick={(e) => e.stopPropagation()} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isDev && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mr-2">Dev</span>
          <button onClick={() => handleMockConnect('guest')} className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Guest</button>
          <button onClick={() => handleMockConnect('registered')} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">User</button>
          <button onClick={handleMockReceiveMessage} disabled={status !== 'connected'} className="text-xs bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50">Msg</button>
        </div>
      )}

      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[340px] bg-[var(--background)] z-[101] shadow-2xl flex flex-col border-l border-[var(--border-color)]" 
            >
              <div className="p-4 flex justify-between items-center border-b border-[var(--border-color)]">
                <h3 className="font-bold text-[var(--text-main)]">Dashboard</h3>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-[var(--card)] rounded-full border border-[var(--border-color)] text-[var(--text-main)] active:scale-95 transition-transform">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-8">
                <ConnectionCard 
                  status={status} 
                  onNext={handleNext} 
                  userCountry={userCountry} 
                  partnerCountry={partnerCountry} 
                  partnerUsername={partnerUsername}
                  partnerGender={partnerGender}
                  onAddFriend={handleAddFriend}
                  friendRequestStatus={friendRequestSent ? 'sent' : 'none'}
                  onLeaveConfirm={() => setShowLeaveConfirm(true)} 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[102] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-inset ring-red-500/20">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Leave Chat?</h3>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                Are you sure you want to leave? This chat will be gone forever and cannot be recovered.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleLeaveConfirm} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">
                  Yes, Leave Chat
                </button>
                <button onClick={() => { setShowLeaveConfirm(false); setPendingRoute(null); }} className="w-full py-4 bg-[var(--background)] hover:bg-[var(--border-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRulesModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-lg border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]">
              <h3 className="text-3xl font-bold text-[var(--text-main)] mb-2 text-center tracking-tight">Community Rules</h3>
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar mt-4">
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <HeartHandshake className="w-5 h-5 text-[#3B82F6] flex-shrink-0" />
                  <p className="text-sm text-[var(--text-muted)]">No bullying, racism, harassment, or abusive language.</p>
                </div>
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <ImageMinus className="w-5 h-5 text-[#3B82F6] flex-shrink-0" />
                  <p className="text-sm text-[var(--text-muted)]">You cannot send photos directly. The stranger must request it first.</p>
                </div>
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <UserX className="w-5 h-5 text-[#3B82F6] flex-shrink-0" />
                  <p className="text-sm text-[var(--text-muted)]">Do not share sensitive personal details or contact information.</p>
                </div>
              </div>
              <label onClick={() => setRulesAgreed(!rulesAgreed)} className="flex items-center gap-3 cursor-pointer mb-6 group">
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${rulesAgreed ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-[var(--text-muted)]'}`}>
                  {rulesAgreed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-[var(--text-muted)] select-none">I agree to the Community Rules.</span>
              </label>
              <button onClick={handleAcceptRules} disabled={!rulesAgreed} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold disabled:opacity-50">I Understand & Agree</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-[#3B82F6] flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Create an Account</h3>
              <p className="text-[var(--text-muted)] mb-8 text-sm">You are browsing as a guest. Create an account to add friends and save connections.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/auth')} className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold">Log In / Sign Up</button>
                <button onClick={() => setShowLoginPrompt(false)} className="w-full py-4 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold">Maybe Later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col bg-[var(--background)] md:bg-[var(--card)] md:rounded-2xl md:border md:border-[var(--border-color)] overflow-hidden relative">
        <div className="p-3 md:p-4 border-b border-[var(--border-color)] bg-[var(--card)]/80 backdrop-blur-md flex-shrink-0 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-[var(--text-main)]">Anonymous Chat</h2>
          </div>
          <div className="md:hidden flex items-center gap-2">
            {status === 'idle' && <><div className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> <span className="text-sm font-semibold text-zinc-400">Waiting</span></>}
            {status === 'searching' && <><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" /> <span className="text-sm font-semibold text-[#3B82F6]">Searching</span></>}
            {status === 'connected' && <><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> <span className="text-sm font-semibold text-green-500">Connected</span></>}
          </div>
          <div className="flex md:hidden items-center gap-1.5">
            {status !== 'idle' && (
              <button onClick={handleNext} className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Next
              </button>
            )}
            <button onClick={() => setShowMobileMenu(true)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]/30 min-h-0 relative">
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={handleStartChat} className="bg-[#3B82F6] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">Start Chatting</button>
            </div>
          )}
          {status === 'searching' && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
              <p className="font-medium animate-pulse">Looking for someone interesting...</p>
            </div>
          )}
          
          {status !== 'idle' && messages.map(msg => (
            msg.isSystem 
              ? <div key={msg.id} className="text-center text-xs tracking-wide uppercase text-[var(--text-muted)] font-bold my-6">{msg.text}</div>
              : <MessageBubble 
                  key={msg.id} 
                  message={msg.text} 
                  isOwn={msg.isOwn} 
                  imageUrl={msg.imageUrl} 
                  isUploading={msg.isUploading}
                  onImageClick={msg.imageUrl && !msg.isUploading ? () => setViewingImage(msg.imageUrl!) : undefined}
                />
          ))}
          
          {isPartnerTyping && <TypingIndicator />}
        </div>

        <input ref={photoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFileSelected} />

        <AnimatePresence>
          {incomingPhotoRequest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-xl border border-[var(--border-color)] shadow-xl p-4 z-30"
            >
              <p className="text-sm font-medium text-[var(--text-main)] mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-[#3B82F6]" /> Stranger wants to see a photo of you.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDeclinePhotoRequest} className="flex items-center justify-center gap-2 glass hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-[var(--text-muted)] py-2.5 rounded-xl font-medium transition-all">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button onClick={handleAcceptPhotoRequest} className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white py-2.5 rounded-xl font-medium transition-all">
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-shrink-0 z-20 w-full">
          <ChatInput onSend={handleSend} disabled={status !== 'connected'} onRequestPhoto={handleRequestPhoto} photoRequestDisabled={photoRequestBusy || status === 'idle'} onTyping={handleTyping} />
        </div>
      </div>

      <div className="hidden md:block w-80 h-full flex-shrink-0">
        <ConnectionCard 
          status={status} 
          onNext={handleNext} 
          userCountry={userCountry} 
          partnerCountry={partnerCountry} 
          partnerUsername={partnerUsername}
          partnerGender={partnerGender}
          onAddFriend={handleAddFriend}
          friendRequestStatus={friendRequestSent ? 'sent' : 'none'}
          onLeaveConfirm={() => setShowLeaveConfirm(true)} 
        />
      </div>
    </div>
  );
}