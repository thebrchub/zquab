import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsApi } from '../api/rooms';
import { useWebSocket } from '../context/WebSocketContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput'; // Assuming you have this from before!
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
        // API guide specifies cursor is message ID, defaults to newest if omitted
        const history = await roomsApi.getMessages(roomId);
        // Reverse so newest is at the bottom of our UI
        setMessages(history.reverse());
        if (history.length < 50) setHasMore(false);
        
        // Scroll to bottom on initial load
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
    
    // Tell the WS server we entered this room
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
    
    // Check if the incoming WS event belongs to this room
    if (lastMessage.room_id === roomId) {
      if (lastMessage.type === 'message_delivered' || lastMessage.type === 'message_sent_confirm') {
        // Handle incoming new message
        const newMsg = {
          id: lastMessage.id,
          content: lastMessage.payload?.text || '', // Adjust based on your proto shape
          created_at: new Date(lastMessage.ts).toISOString(),
          isOwn: false, // In reality, you'd check sender_id against your own user_id
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Auto-scroll down for new messages
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
            // Find the oldest message ID to use as cursor
            const oldestId = messages[0].id;
            const olderMessages = await roomsApi.getMessages(roomId!, oldestId);
            
            if (olderMessages.length < 50) setHasMore(false);
            
            // Prepend older messages
            setMessages(prev => [...olderMessages.reverse(), ...prev]);
            
            // Maintain scroll position (optional UX polish: calculate scroll height difference)
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
    
    // Send via WebSocket
    sendMessage('send_message', { text }, roomId);
    
    // Optimistically add to UI
    const optimisticMsg = {
      id: Date.now().toString(), // Temporary ID
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
      <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate('/home')} className="px-6 py-2 bg-[var(--card)] border border-[var(--border-color)] rounded-full text-[var(--text-main)]">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col h-[calc(100dvh-64px)] bg-[var(--background)] relative">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border-color)] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors rounded-full hover:bg-[var(--background)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--border-color)]"></div>
            <div>
              <h2 className="font-bold text-[var(--text-main)] leading-tight">Chat Room</h2>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--background)] rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
      >
        {/* Invisible target for the Intersection Observer to trigger loading older messages */}
        <div ref={topObserverRef} className="h-4 w-full flex justify-center py-4 mb-4">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />}
        </div>
        
        {messages.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] mt-10">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id || index}
              content={msg.content}
              isOwn={msg.isOwn}
              status={msg.status}
              time={msg.created_at}
            />
          ))
        )}
      </div>

      {/* Reusing the ChatInput we tweaked earlier! */}
      <div className="flex-shrink-0">
        <ChatInput 
          onSend={handleSend}
          disabled={!isConnected}
        />
      </div>
      
    </div>
  );
}