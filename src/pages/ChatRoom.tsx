import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical, User } from 'lucide-react';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useAuth } from '../context/AuthContext';

export default function ChatRoom({ 
  inlineRoomId, 
  inlineFriendName, 
  inlineFriendAvatar 
}: { 
  inlineRoomId?: string, 
  inlineFriendName?: string, 
  inlineFriendAvatar?: string 
} = {}) {
  // const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 🛠️ Use inline props first (Desktop Split-Screen), fallback to router params (Mobile)
  const routerParams = useParams<{ roomId: string }>();
  const roomId = inlineRoomId || routerParams.roomId;
  
  const friendName = inlineFriendName || location.state?.friendName || 'Chat Room';
  const friendAvatar = inlineFriendAvatar || location.state?.friendAvatar || null;
  
  // 🛠️ Grab the friend's details passed from the Inbox!


  
  // DEV MODE CHECK
  const isDevMode = location.pathname === '/dev/chat';
  
  // State
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  
  // Refs for scrolling and WebSocket
  const scrollRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();

  // Typing State
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimeoutRef = useRef<number | null>(null);
  const myTypingTimeoutRef = useRef<number | null>(null);
  const isMyTypingStateRef = useRef(false);

  // IDs of messages this device has sent and already shown optimistically
  // — lets us recognize "this is just my own echo" (skip) vs. "this is the
  // same account messaging from a different device" (show, as own).
  const sentMessageIdsRef = useRef<Set<string>>(new Set());

  // 1. Initial Load of History
  useEffect(() => {
    if (isDevMode) {
      setMessages([
        { id: '1', content: 'Hey there!', created_at: new Date(Date.now() - 3600000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '2', content: 'Hi! How are you doing?', created_at: new Date(Date.now() - 3500000).toISOString(), isOwn: true, status: 'read' },
      ]);
      setLoading(false);
      
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
      return;
    }

    if (!roomId) return;
    
    const fetchHistory = async () => {
      try {
        const history = await roomsApi.getMessages(roomId);
        setMessages(history.reverse());
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
      sendMessage('join_room', {}, roomId);
    }

    return () => {
      if (isConnected) sendMessage('leave_room', {}, roomId);
    };
  }, [roomId, isConnected, isDevMode]);

  // 2. Listen for Live WebSocket Messages
  useEffect(() => {
    if (isDevMode || !lastMessage || !roomId) return;
    
    if (lastMessage.room_id === roomId || lastMessage.roomId === roomId) {
      // 'chat_message' is what the backend actually sends (go-starter-kit
      // chat.MsgChatMessage) — 'message_delivered'/'message_sent_confirm'
      // were never real wire types, kept only as harmless legacy fallbacks.
      if (lastMessage.type === 'chat_message' || lastMessage.type === 'message_delivered' || lastMessage.type === 'message_sent_confirm') {
        // The engine broadcasts a sent message to every room member,
        // including the sender's own connection (intentional — lets the
        // same account see its own messages on other logged-in devices
        // too). Only skip it if THIS device already showed it optimistically
        // (matched by id); otherwise show it, marked own via `from`.
        if (lastMessage.id && sentMessageIdsRef.current.has(lastMessage.id)) {
          sentMessageIdsRef.current.delete(lastMessage.id);
          return;
        }

        // envelope.ts is an int64 — protobufjs decodes it as a Long object,
        // not a plain number; new Date(Long) is an Invalid Date and
        // .toISOString() throws. Number(...) coerces Long via its
        // toString() correctly; fall back to now() if it's ever missing/NaN.
        const parsedTs = Number(lastMessage.ts);
        const tsMs = Number.isFinite(parsedTs) ? parsedTs : Date.now();
        const isOwn = Boolean(lastMessage.from && user?.user_id && lastMessage.from === user.user_id);
        const newMsg = {
          id: lastMessage.id,
          content: lastMessage.payload?.text || '', 
          created_at: new Date(tsMs).toISOString(),
          isOwn,
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setIsPartnerTyping(false);
        
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
    }
  }, [lastMessage, roomId, isDevMode]);

  // 3. Infinite Scroll
  useEffect(() => {
    if (isDevMode) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && messages.length > 0) {
          setLoadingMore(true);
          try {
            const oldestId = messages[0].id;
            const olderMessages = await roomsApi.getMessages(roomId!, oldestId);
            if (olderMessages.length < 50) setHasMore(false);
            setMessages(prev => [...olderMessages.reverse(), ...prev]);
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
  }, [hasMore, loadingMore, loading, messages, roomId, isDevMode]);

  const handleTyping = () => {
    if (isDevMode || !isConnected) return;
    
    if (!isMyTypingStateRef.current) {
      isMyTypingStateRef.current = true;
      sendMessage('typing_start', {}, roomId);
    }

    if (myTypingTimeoutRef.current) window.clearTimeout(myTypingTimeoutRef.current);
    
    myTypingTimeoutRef.current = window.setTimeout(() => {
      isMyTypingStateRef.current = false;
      sendMessage('typing_end', {}, roomId);
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
      sendMessage('typing_end', {}, roomId);
    }
    
    const optimisticMsg = {
      id: localId,
      content: text,
      created_at: new Date().toISOString(),
      isOwn: true,
      status: 'sent' as const
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
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
  <div className="flex-1 flex flex-col bg-[var(--background)] w-full h-full overflow-hidden relative">
      
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] pt-safe gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-1 sm:-ml-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* 🛠️ Friend Avatar Display */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {friendAvatar ? (
                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              {/* 🛠️ Dynamic Friend Name - Truncated on mobile */}
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-sm sm:text-lg truncate">
                {isDevMode ? 'UI Testing Room' : friendName}
              </h2>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors flex-shrink-0">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 pb-2 custom-scrollbar bg-[var(--background)]"
      >
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-2 mb-2">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {messages.length === 0 && !isPartnerTyping ? (
          <div className="text-center text-[var(--text-muted)] font-medium mt-8 sm:mt-10 bg-[var(--card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-xl mx-auto max-w-xs text-sm sm:text-base">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id || index}
                content={msg.content}
                isOwn={msg.isOwn}
                status={msg.status}
                time={msg.created_at}
              />
            ))}
            
            {isPartnerTyping && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] pb-safe">
        <ChatInput 
          onSend={handleSend}
          disabled={!isDevMode && !isConnected}
          onTyping={handleTyping} 
        />
      </div>
      
    </div>
  );
}