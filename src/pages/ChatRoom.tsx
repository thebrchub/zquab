import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Loader2, ArrowLeft, MoreVertical } from 'lucide-react';

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🛠️ DEV MODE CHECK
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

  // 1. Initial Load of History (Or Dev Mock Data)
  useEffect(() => {
    if (isDevMode) {
      // 🛠️ Inject fake data to test the UI instantly
      setMessages([
        { id: '1', content: 'Hey there!', created_at: new Date(Date.now() - 3600000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '2', content: 'Hi! How are you doing?', created_at: new Date(Date.now() - 3500000).toISOString(), isOwn: true, status: 'read' },
        { id: '3', content: 'I am doing great, just working on this awesome chat app UI. Testing to see how a really long message wraps around multiple lines when it hits the maximum width of the bubble container!', created_at: new Date(Date.now() - 3400000).toISOString(), isOwn: false, status: 'delivered' },
        { id: '4', content: 'Looks amazing so far! 🚀', created_at: new Date(Date.now() - 3300000).toISOString(), isOwn: true, status: 'read' },
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
    if (isDevMode) return; // Skip WebSocket listening in Dev Mode

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
  }, [lastMessage, roomId, isDevMode]);

  // 3. Infinite Scroll (Upwards)
  useEffect(() => {
    if (isDevMode) return; // Disable infinite scroll in Dev Mode

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

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    if (!isDevMode && !isConnected) return; // Bypass connection check in Dev Mode
    
    if (!isDevMode) {
      sendMessage('send_message', { text }, roomId);
    }
    
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

    // 🛠️ DEV MODE AUTO-REPLY BOT
    if (isDevMode) {
      setTimeout(() => {
        const replyMsg = {
          id: (Date.now() + 1).toString(),
          content: 'This is a mock reply from the Dev bot! 🤖',
          created_at: new Date().toISOString(),
          isOwn: false,
          status: 'delivered' as const
        };
        setMessages(prev => [...prev, replyMsg]);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }, 1000);
    }
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
    <div className="fixed inset-0 flex flex-col bg-[var(--background)] z-50 w-full h-[100dvh] overflow-hidden">
      
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
              <h2 className="font-bold text-[var(--text-main)] leading-tight text-base sm:text-lg">
                {isDevMode ? 'UI Testing Room' : 'Chat Room'}
              </h2>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-[var(--text-muted)] active:bg-[var(--background)] rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

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

      <div className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border-color)] pb-safe">
        <ChatInput 
          onSend={handleSend}
          disabled={!isDevMode && !isConnected}
        />
      </div>
      
    </div>
  );
}