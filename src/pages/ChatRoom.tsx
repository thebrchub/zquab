import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import { LAST_ROOM_STORAGE_KEY, useRooms } from '../context/RoomsContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical, User, X } from 'lucide-react';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatDetailsSidebar from '../components/chat/ChatDetailsSidebar';

export default function ChatRoom({ 
  inlineRoomId, 
  inlineFriendName, 
  inlineFriendAvatar,
  inlineFriendUsername,
  inlineIsOnline
}: { 
  inlineRoomId?: string, 
  inlineFriendName?: string, 
  inlineFriendAvatar?: string,
  inlineFriendUsername?: string,
  inlineIsOnline?: boolean
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const routerParams = useParams<{ roomId: string }>();
  const roomId = inlineRoomId || routerParams.roomId;
  
  const friendName = inlineFriendName || location.state?.friendName || 'Chat Room';
  const friendAvatar = inlineFriendAvatar || location.state?.friendAvatar || null;
  const friendUsername = inlineFriendUsername || location.state?.friendUsername || ''; 
  const isOnline = inlineIsOnline ?? location.state?.isOnline ?? false;
  
  const isDevMode = location.pathname === '/dev/chat';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();
  const { bumpOwnMessage } = useRooms();

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [showSidebar, setShowSidebar] = useState(false); 

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<number | null>(null);
  const myTypingTimeoutRef = useRef<number | null>(null);
  const isMyTypingStateRef = useRef(false);

  const sentMessageIdsRef = useRef<Set<string>>(new Set());

  // Keeps the IntersectionObserver's callback reading fresh data without
  // needing `messages` in that effect's own dependency array.
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const handleImageClick = useCallback((url: string) => setViewingImage(url), []);

  // 🛠️ FETCH HISTORY & MERGE OPTIMISTIC MESSAGES
  useEffect(() => {
    if (isDevMode) {
      setMessages([
        { id: '1', content: 'Hey there!', created_at: new Date(Date.now() - 3600000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '2', content: 'Hi! How are you doing?', created_at: new Date(Date.now() - 3500000).toISOString(), isOwn: true, status: 'read' },
      ]);
      setLoading(false);
      return;
    }

    if (!roomId) return;
    
    const fetchHistory = async () => {
      try {
        const history = await roomsApi.getMessages(roomId);
        const myId = (user as any)?.user_id || (user as any)?.id;

        const formattedHistory = history.map((msg: any) => {
          const msgSender = msg.sender_id; // 🛠️ Strictly using sender_id as per backend docs
          return {
            id: msg.id,
            content: msg.content || msg.text || '',
            created_at: msg.created_at || msg.ts || new Date().toISOString(),
            isOwn: Boolean(msgSender && myId && msgSender === myId),
            status: msg.status || 'delivered', // backend computes read/delivered/sent per message
            imageUrl: msg.image_url || msg.imageUrl
          };
        });

        // 🛠️ SESSION RECONCILIATION: Grab optimistic messages that haven't hit DB yet.
        // NOTE: can't match by id here — history ids are server BIGSERIAL
        // integers, optimistic ids are client-generated UUIDs; they can
        // never be equal. Match by sender+content+time-proximity instead.
        const storedOpts = JSON.parse(sessionStorage.getItem(`opts_${roomId}`) || '[]');

        const pendingOpts = storedOpts.filter((opt: any) => {
          const age = Date.now() - new Date(opt.created_at).getTime();
          if (age >= 10000) return false;
          const optTime = new Date(opt.created_at).getTime();
          const alreadyLanded = formattedHistory.some((m: any) =>
            m.isOwn &&
            m.content === opt.content &&
            Math.abs(new Date(m.created_at).getTime() - optTime) < 15000
          );
          return !alreadyLanded;
        });
        
        sessionStorage.setItem(`opts_${roomId}`, JSON.stringify(pendingOpts));

        setMessages([...formattedHistory.reverse(), ...pendingOpts]);
        if (history.length < 50) setHasMore(false);
        
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      } catch (err: any) {
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    
    if (isConnected) {
      sendMessage('join_room', undefined, roomId);
    }

    // No leave_room here: register() already auto-joins every active room for
    // the whole connection lifetime (loadUserRooms), so this cleanup used to
    // actively unsubscribe you from the room's live broadcasts the moment you
    // switched to another conversation (or on any reconnect blip) — meaning
    // new messages in that room went undelivered until you reopened it.
  }, [roomId, isConnected, isDevMode, user]);

  // 🛠️ WEBSOCKET MESSAGE HANDLER
  useEffect(() => {
    if (isDevMode || !lastMessage) return;

    // send_confirm carries no room_id (it's a direct ack to the sender), so
    // it must be handled before the room-id match check below, and its real
    // wire type is 'send_confirm' — not the old 'message_sent_confirm' name.
    if (lastMessage.type === 'send_confirm') {
      return;
    }

    if (!roomId) return;

    if (lastMessage.room_id === roomId || lastMessage.roomId === roomId) {
      if (lastMessage.type === 'chat_message' || lastMessage.type === 'delivered') {
        if (lastMessage.id && sentMessageIdsRef.current.has(lastMessage.id)) {
          sentMessageIdsRef.current.delete(lastMessage.id);
          return;
        }

        const parsedTs = Number(lastMessage.ts);
        const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();
        const myId = (user as any)?.user_id || (user as any)?.id;
        const msgSender = lastMessage.sender_id || lastMessage.from; // Fallback to from for live socket if needed
        const isOwn = Boolean(msgSender && myId && msgSender === myId);
        
        const newMsg = {
          id: lastMessage.id,
          content: lastMessage.payload?.text || '', 
          created_at: new Date(tsMs).toISOString(),
          isOwn,
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setIsPartnerTyping(false);
        
        // 🛠️ FIXED: Send exact 'read' event as requested by backend if the message isn't ours
        if (!isOwn && isConnected) {
          sendMessage('read', undefined, roomId);
        }

        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }
      else if (lastMessage.type === 'typing_start' || lastMessage.type === 'typing_status') {
        setIsPartnerTyping(true);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);

        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        partnerTypingTimeoutRef.current = window.setTimeout(() => setIsPartnerTyping(false), 4000);
      } 
      else if (lastMessage.type === 'typing_end') {
        setIsPartnerTyping(false);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      }
      else if (lastMessage.type === 'read') {
        // Broadcast to the whole room (including the reader themselves) —
        // only upgrade statuses when the read came from the OTHER person,
        // otherwise this is just an echo of our own read receipt.
        const myId = (user as any)?.user_id || (user as any)?.id;
        const readerId = lastMessage.sender_id || lastMessage.from;
        if (readerId && myId && readerId !== myId) {
          // No specific message_id is sent — 'read' is a watermark, so mark
          // every one of our own messages read. This is the only place any
          // message's status ever advances past its initial 'sent'/'delivered'.
          setMessages(prev => prev.map(m => (m.isOwn && m.status !== 'read') ? { ...m, status: 'read' } : m));
        }
      }
    }
  }, [lastMessage, roomId, isDevMode, user, isConnected, sendMessage]);

  useEffect(() => {
    if (isDevMode) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const currentMessages = messagesRef.current;
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && currentMessages.length > 0) {
          setLoadingMore(true);
          try {
            const oldestId = currentMessages[0].id;
            const olderMessages = await roomsApi.getMessages(roomId!, oldestId);
            if (olderMessages.length < 50) setHasMore(false);
            
            const myId = (user as any)?.user_id || (user as any)?.id;
            const formattedOlder = olderMessages.map((msg: any) => {
              const msgSender = msg.sender_id; 
              return {
                id: msg.id,
                content: msg.content || msg.text || '',
                created_at: msg.created_at || msg.ts || new Date().toISOString(),
                isOwn: Boolean(msgSender && myId && msgSender === myId),
                status: msg.status || 'delivered', // backend computes read/delivered/sent per message
                imageUrl: msg.image_url || msg.imageUrl
              };
            });

            setMessages(prev => [...formattedOlder.reverse(), ...prev]);
          } catch (err) {
            console.error('Failed to load older messages');
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (topObserverRef.current) observer.observe(topObserverRef.current);
    return () => {
      if (topObserverRef.current) observer.unobserve(topObserverRef.current);
    };
    // messages intentionally excluded — read via messagesRef instead, so this
    // observer isn't torn down/recreated on every single new message.
  }, [hasMore, loadingMore, loading, roomId, isDevMode, user]);

  const handleTyping = () => {
    if (isDevMode || !isConnected) return;
    
    if (!isMyTypingStateRef.current) {
      isMyTypingStateRef.current = true;
      sendMessage('typing_start', undefined, roomId);
    }

    if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
    
    myTypingTimeoutRef.current = window.setTimeout(() => {
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', undefined, roomId);
    }, 2000);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    if (!isDevMode && !isConnected) return;

    const localId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;

    if (!isDevMode) {
      sendMessage('chat_message', { text }, roomId, undefined, localId);
      sentMessageIdsRef.current.add(localId);

      if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', undefined, roomId);
    }
    
    const optimisticMsg = {
      id: localId,
      content: text,
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sent' as const
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
    // 🛠️ SESSION OPTIMISTIC SAVE: Instantly save to memory so it survives a 3-second refresh!
    const existingOpts = JSON.parse(sessionStorage.getItem(`opts_${roomId}`) || '[]');
    sessionStorage.setItem(`opts_${roomId}`, JSON.stringify([...existingOpts, optimisticMsg]));

    // The chat_message broadcast excludes the sending socket, so this tab's
    // own room list would otherwise never see this message move it to the top.
    if (roomId) bumpOwnMessage(roomId, text);
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleRequestAttachment = () => {
    photoFileInputRef.current?.click();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    const tempId = `msg-img-${Date.now()}`;
    
    const optimisticMsg = {
      id: tempId,
      content: '',
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sent',
      imageUrl: localPreviewUrl
    };

    setMessages((prev) => [...prev, optimisticMsg as any]);
    
    const existingOpts = JSON.parse(sessionStorage.getItem(`opts_${roomId}`) || '[]');
    sessionStorage.setItem(`opts_${roomId}`, JSON.stringify([...existingOpts, optimisticMsg]));

    if (roomId) bumpOwnMessage(roomId, '📷 Photo');

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--background)]">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate('/home')} className="px-6 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-main)] active:scale-95">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--background)] w-full h-[calc(100dvh-64px)] sm:h-[calc(100dvh-85px)] md:h-full overflow-hidden relative min-h-0 min-w-0">
      
      <ChatDetailsSidebar 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        friendName={friendName}
        friendAvatar={friendAvatar}
        friendUsername={friendUsername}
      />

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
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
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

      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] pt-safe gap-2 z-10 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => {
              // Explicit close — clear the resume-on-return memory so
              // navigating back to a bare /home shows the list, not this chat.
              sessionStorage.removeItem(LAST_ROOM_STORAGE_KEY);
              navigate('/home');
            }} 
            className="p-2 -ml-1 sm:-ml-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0 md:hidden"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {friendAvatar ? (
                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-sm sm:text-lg truncate">
                {isDevMode ? 'UI Testing Room' : friendName}
              </h2>
              {isOnline ? (
                <p className="text-xs text-green-500 font-medium">Online</p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] font-medium">Offline</p>
              )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSidebar(true)} 
          className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 pb-2 custom-scrollbar bg-[var(--background)] min-h-0 min-w-0 w-full flex flex-col"
      >
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-2 mb-2 flex-shrink-0">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {messages.length === 0 && !isPartnerTyping ? (
          <div className="text-center text-[var(--text-muted)] font-medium mt-8 sm:mt-10 bg-[var(--card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-xl mx-auto max-w-xs text-sm sm:text-base">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 min-w-0 w-full flex flex-col">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id || index}
                content={msg.content}
                isOwn={msg.isOwn}
                status={msg.status}
                time={msg.created_at}
                imageUrl={(msg as any).imageUrl}
                onImageClick={handleImageClick}
              />
            ))}
            
            {isPartnerTyping && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] pb-safe z-10 w-full min-w-0">
        <ChatInput 
          onSend={handleSend}
          disabled={!isDevMode && !isConnected}
          onTyping={handleTyping}
          onDirectImageClick={handleRequestAttachment}
        />
      </div>
      
    </div>
  );
}