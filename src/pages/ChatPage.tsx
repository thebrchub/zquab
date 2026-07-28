import { useState, useEffect, useRef, useMemo } from 'react';
import ReactCountryFlag from 'react-country-flag';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConnectionCard from '../components/chat/ConnectionCard';
import { Loader2, UserPlus, MoreVertical, LogOut, Image, Check, X, HeartHandshake, ImageMinus, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatClient, type ChatMessage } from '../utils/chatClient';
import { useAuth } from '../context/AuthContext';

type Status = 'idle' | 'searching' | 'connected' | 'disconnected';
type SystemMessage = { id: string; text: string };

// 🛠️ UTILITY: Compress and convert ANY image to .webp
const compressImageToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Maximum dimensions to prevent massive uploads
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
      
      // Export as webp at 80% quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Give it a new name with the .webp extension
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  
  const [userCountry, setUserCountry] = useState<{ name: string; code: string } | null>(null);
  const [partnerCountry, setPartnerCountry] = useState<{ name: string; code: string } | null>(null);
  const [incomingPhotoRequest, setIncomingPhotoRequest] = useState(false);
  const [photoRequestBusy, setPhotoRequestBusy] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoRequestTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

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
    return new ChatClient({
      onStatusChange: setStatus,
      onIncomingMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onSystemMessage: (text) => {
        setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text }]);
      },
      onMatchFound: (_roomId, _partnerId, partnerLocation) => {
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
      onLocationDetected: (country) => {
        setUserCountry(country);
      },
      onDisconnected: () => {
        setStatus('disconnected');
      },
      onSocketOpen: () => {
        setSystemMessages((prev) => [...prev, { id: 'sys-open', text: 'Connected to the chat server.' }]);
      },
      onSocketClose: () => {
        setSystemMessages((prev) => [...prev, { id: 'sys-close', text: 'Socket closed. Reconnecting...' }]);
      },
      onError: (error) => {
        setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: `Error: ${error}` }]);
      },
      onPhotoRequest: () => {
        setIncomingPhotoRequest(true);
        setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: 'Stranger wants to see a photo of you.' }]);
      },
      onPhotoResponse: (_roomId, _from, accepted) => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setSystemMessages((prev) => [...prev, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: accepted ? 'Stranger accepted — waiting for the photo...' : 'Stranger declined your photo request.',
        }]);
      },
      onPhotoReady: (_roomId, _from, url, _expiresAt) => {
        clearPhotoRequestTimeout();
        setPhotoRequestBusy(false);
        setMessages((prev) => [...prev, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: '',
          isOwn: false,
          imageUrl: url,
        }]);
      },
    });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      chatClient.leaveQueueSilently(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chatClient.leaveQueueSilently();
      chatClient.shutdown();
      clearPhotoRequestTimeout();
    };
  }, [chatClient]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, status, systemMessages]);

  const handleStartChat = () => {
    setStatus('searching');
    chatClient.start().catch((error) => {
      setSystemMessages((prev) => [...prev, { id: 'sys-error', text: 'Unable to start chat client.' }]);
      console.error(error);
    });
  };

  const handleSend = (text: string) => {
    if (status !== 'connected') return;
    const temporaryId = chatClient.sendChatMessage(text);
    if (temporaryId) {
      setMessages((prev) => [...prev, { id: temporaryId, text, isOwn: true }]);
    }
  };

  const handleNext = () => {
    chatClient.nextStranger().catch((error) => {
      setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: `Unable to find next stranger: ${error}` }]);
    });
    setMessages([]);
    setShowMobileMenu(false);
    setIncomingPhotoRequest(false);
    setPhotoRequestBusy(false);
    clearPhotoRequestTimeout();
  };

  const PHOTO_REQUEST_TIMEOUT_MS = 30_000;

  const handleRequestPhoto = () => {
    if (user?.is_guest) {
      alert("You need to create a full account to request and send photos!");
      return;
    }
    setPhotoRequestBusy(true);
    chatClient.requestPhoto()
      .then(() => {
        clearPhotoRequestTimeout();
        photoRequestTimeoutRef.current = window.setTimeout(() => {
          photoRequestTimeoutRef.current = null;
          setPhotoRequestBusy(false);
          setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: "Stranger didn't respond to your photo request." }]);
        }, PHOTO_REQUEST_TIMEOUT_MS);
      })
      .catch((error) => {
        setPhotoRequestBusy(false);
        setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: `Unable to request a photo: ${error}` }]);
      });
  };

  const handleDeclinePhotoRequest = () => {
    setIncomingPhotoRequest(false);
    chatClient.declinePhotoRequest().catch(() => {});
  };

  const handleAcceptPhotoRequest = () => {
    setIncomingPhotoRequest(false);
    photoFileInputRef.current?.click();
  };

  // 🛠️ UPDATED: Now converts raw images to WebP before sharing
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input
    if (!file) return;

    try {
      // Show loading system message
      setSystemMessages((prev) => [...prev, { id: `sys-compressing-${Date.now()}`, text: 'Optimizing photo...' }]);
      
      // Convert to WebP
      const webpFile = await compressImageToWebP(file);
      
      // Send the compressed WebP to the backend
      await chatClient.sharePhoto(webpFile);
      
      // Render preview on UI
      const previewUrl = URL.createObjectURL(webpFile);
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: '',
        isOwn: true,
        imageUrl: previewUrl,
      }]);
    } catch (error) {
      setSystemMessages((prev) => [...prev, { id: `${Date.now()}`, text: `Failed to process/send photo: ${error}` }]);
    }
  };

  const handleLeaveConfirm = () => {
    navigate('/');
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row md:gap-6 p-0 md:p-6 min-h-0 overflow-hidden">
      
      {/* Rules & Safety Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-lg border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2 text-center tracking-tight">Community Rules</h3>
              <p className="text-[var(--text-muted)] text-center text-sm mb-6">Please read and accept before connecting.</p>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <HeartHandshake className="w-5 h-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[var(--text-main)] text-sm mb-1">Treat Strangers with Respect</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">No bullying, racism, harassment, or abusive language. We have a zero-tolerance policy for abuse.</p>
                  </div>
                </div>
                
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <ImageMinus className="w-5 h-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[var(--text-main)] text-sm mb-1">Strict Photo Policy</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">You cannot send photos directly. You can only request them. To send a photo, the stranger must request it from you first.</p>
                  </div>
                </div>
                
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)] flex gap-4 items-start">
                  <UserX className="w-5 h-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[var(--text-main)] text-sm mb-1">Protect Your Privacy</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">Do not share sensitive personal details, social media handles, or contact information with strangers.</p>
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <label 
                onClick={() => setRulesAgreed(!rulesAgreed)} 
                className="flex items-center gap-3 cursor-pointer mb-6 p-2 rounded-lg hover:bg-[var(--border-color)]/50 transition-colors group"
              >
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${rulesAgreed ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-[var(--text-muted)] bg-[var(--background)] group-hover:border-[#3B82F6]'}`}>
                  {rulesAgreed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-[var(--text-muted)] leading-tight select-none">
                  I agree to the Community Rules and promise to treat others with respect.
                </span>
              </label>

              <button 
                onClick={handleAcceptRules}
                disabled={!rulesAgreed}
                className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold transition-all flex-shrink-0 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:bg-blue-600 disabled:hover:bg-[#3B82F6] active:scale-95 disabled:active:scale-100"
              >
                I Understand & Agree
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col bg-[var(--background)] md:bg-[var(--card)] rounded-none md:rounded-2xl border-0 md:border md:border-[var(--border-color)] overflow-hidden min-h-0 relative">
        
        {/* Leave Chat Warning Modal */}
        <AnimatePresence>
          {showLeaveConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[var(--card)] p-6 md:p-8 rounded-[2rem] w-full max-w-sm border border-[var(--border-color)] shadow-2xl text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-inset ring-red-500/20">
                  <LogOut className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">Leave Chat?</h3>
                <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                  Are you sure you want to leave? This chat will be gone forever and cannot be recovered.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLeaveConfirm}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                  >
                    Yes, Leave Chat
                  </button>
                  <button 
                    onClick={() => setShowLeaveConfirm(false)}
                    className="w-full py-4 bg-[var(--background)] hover:bg-[var(--border-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Header */}
        <div className="p-3 md:p-4 border-b border-[var(--border-color)] bg-[var(--card)]/80 backdrop-blur-md flex-shrink-0 flex justify-between items-center z-20">
          
          <div className="hidden md:flex items-center gap-3">
            <h2 className="font-bold text-lg text-[var(--text-main)]">Anonymous Chat</h2>
            <div className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--background)]/60 px-3 py-1 text-sm text-[var(--text-muted)]">
              {userCountry?.code ? (
                <>
                  <ReactCountryFlag countryCode={userCountry.code} svg className="text-lg leading-none" />
                  <span className="font-medium text-[var(--text-main)]">{userCountry.name}</span>
                </>
              ) : (
                <span>{userCountry?.name || 'Detecting location...'}</span>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            {status === 'idle' && <><div className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> <span className="text-sm font-semibold text-zinc-400">Waiting</span></>}
            {status === 'searching' && <><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" /> <span className="text-sm font-semibold text-[#3B82F6]">Searching</span></>}
            {status === 'connected' && <><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" /> <span className="text-sm font-semibold text-green-500">Connected</span></>}
            {status === 'disconnected' && <><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-sm font-semibold text-red-500">Disconnected</span></>}
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--background)]/70 px-2.5 py-1 text-xs text-[var(--text-muted)]">
              {userCountry?.code ? (
                <>
                  <ReactCountryFlag countryCode={userCountry.code} svg className="text-sm leading-none" />
                  <span className="font-medium text-[var(--text-main)]">{userCountry.name}</span>
                </>
              ) : (
                <span>{userCountry?.name || 'Detecting location...'}</span>
              )}
            </div>
            
            {status !== 'idle' && (
              <button 
                onClick={handleNext}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Next
              </button>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] rounded-xl border border-[var(--border-color)] shadow-xl overflow-hidden py-1 z-50 origin-top-right"
                  >
                    <button 
                      onClick={() => { setShowMobileMenu(false); setShowLeaveConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Leave Chat
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Messages / Status Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-[var(--background)]/30 min-h-0 relative"
          onClick={() => setShowMobileMenu(false)}
        >
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleStartChat}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
              >
                Start Chatting
              </button>
            </div>
          )}

          {status === 'searching' && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
              <p className="font-medium animate-pulse">Looking for someone interesting...</p>
            </div>
          )}

          {status !== 'idle' && messages.map(msg => (
            msg.isSystem ? (
              <div key={msg.id} className="text-center text-xs tracking-wide uppercase text-[var(--text-muted)] font-bold my-6">
                {msg.text}
              </div>
            ) : (
              <MessageBubble key={msg.id} message={msg.text} isOwn={msg.isOwn} imageUrl={msg.imageUrl} />
            )
          ))}
        </div>

        <input
          ref={photoFileInputRef}
          type="file"
          accept="image/jpeg,image/webp,image/avif,image/png,image/heic"
          className="hidden"
          onChange={handlePhotoFileSelected}
        />

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
                <button
                  onClick={handleDeclinePhotoRequest}
                  className="flex items-center justify-center gap-2 glass hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-[var(--text-muted)] py-2.5 rounded-xl font-medium transition-all"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
                <button
                  onClick={handleAcceptPhotoRequest}
                  className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white py-2.5 rounded-xl font-medium transition-all"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-shrink-0 z-20 w-full" onClick={() => setShowMobileMenu(false)}>
          <ChatInput
            onSend={handleSend}
            disabled={status !== 'connected'}
            onRequestPhoto={handleRequestPhoto}
            photoRequestDisabled={photoRequestBusy || status === 'idle'}
          />
        </div>
      </div>

      {/* Right Sidebar (Desktop Only) */}
      <div className="hidden md:block w-80 h-full flex-shrink-0">
        <ConnectionCard status={status} onNext={handleNext} userCountry={userCountry} partnerCountry={partnerCountry} />
      </div>
      
    </div>
  );
}