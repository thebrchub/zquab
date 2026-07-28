import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical } from 'lucide-react';

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
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

  // 1. Initial Load of History
  useEffect(() => {
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
  }, [roomId, isConnected]);

  // 2. Listen for Live WebSocket Messages
  useEffect(() => {
    if (!lastMessage || !roomId) return;
    
    if (lastMessage.room_id === roomId) {
      if (lastMessage.type === 'message_delivered' || lastMessage.type === 'message_sent_confirm') {
        const newMsg = {
          id: lastMessage.id,
          content: lastMessage.payload?.text || '', 
          created_at: new Date(lastMessage.ts).toISOString(),
          isOwn: false, 
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }
    }
  }, [lastMessage, roomId]);

  // 3. Infinite Scroll (Upwards)
  useEffect(() => {
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
  }, [hasMore, loadingMore, loading, messages, roomId]);

  const handleSend = (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    sendMessage('send_message', { text }, roomId);
    
    const optimisticMsg = {
      id: Date.now().toString(),
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
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--background)] z-50">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate('/home')} className="px-6 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-main)] active:scale-95">
          Go Back
        </button>
      </div>
    );
  }

  return (
    // 1. The absolute lock: fixed inset-0 ensures it never scrolls beyond the viewport
    <div className="fixed inset-0 flex flex-col bg-[var(--background)] z-50 w-full h-[100dvh] overflow-hidden">
      
      {/* 2. Header: flex-shrink-0 keeps it from squishing */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] pt-safe">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
               {/* Avatar placeholder */}
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-base sm:text-lg">Chat Room</h2>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Message Area: flex-1 takes remaining space, overscroll-contain stops iOS bouncing */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 pb-2 custom-scrollbar bg-[var(--background)]"
      >
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-2 mb-2">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] font-medium mt-10 bg-[var(--card)] border border-[var(--border-color)] p-4 rounded-xl mx-auto max-w-xs">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id || index}
                content={msg.content}
                isOwn={msg.isOwn}
                status={msg.status}
                time={msg.created_at}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Input Area: Safe area padding for newer iPhones */}
      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] pb-safe">
        <ChatInput 
          onSend={handleSend}
          disabled={!isConnected}
        />
      </div>
      
    </div>
  );
}