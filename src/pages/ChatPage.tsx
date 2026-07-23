import { useState, useEffect, useRef, useMemo } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ConnectionCard from '../components/chat/ConnectionCard';
import { Loader2, UserPlus, MoreVertical, Flag, ShieldBan, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatClient, type ChatMessage } from '../utils/chatClient';

type Status = 'searching' | 'connected' | 'disconnected';

type SystemMessage = { id: string; text: string };

export default function ChatPage() {
  const [status, setStatus] = useState<Status>('searching');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatClient = useMemo(() => {
    return new ChatClient({
      onStatusChange: setStatus,
      onIncomingMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onSystemMessage: (text) => {
        setSystemMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text }]);
      },
      onMatchFound: () => {},
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
    });
  }, []);

  useEffect(() => {
    chatClient.start().catch((error) => {
      setSystemMessages((prev) => [...prev, { id: 'sys-error', text: 'Unable to start chat client.' }]);
      console.error(error);
    });
    return () => {
      chatClient.shutdown();
    };
  }, [chatClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, systemMessages]);

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
  };

  return (
    // UX FIX 1: Removed mobile padding, enforced edge-to-edge layout, locked dynamic viewport height
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:gap-4 md:p-4 h-[calc(100dvh-64px)] overflow-hidden">
      
      {/* Left: Chat Window */}
      {/* UX FIX 2: Removed border radius and borders on mobile for a native app feel */}
      <div className="flex-1 flex flex-col bg-[var(--background)] md:bg-transparent md:glass rounded-none md:rounded-2xl border-0 md:border md:border-[var(--border-color)] overflow-hidden min-h-0 relative">
        
        {/* Chat Header (Responsive) */}
        <div className="p-3 md:p-4 border-b border-[var(--border-color)] bg-[var(--card)]/80 backdrop-blur-md flex-shrink-0 flex justify-between items-center z-20">
          
          {/* Desktop Title */}
          <h2 className="font-bold text-lg text-[var(--text-main)] hidden md:block">Anonymous Chat</h2>
          
          {/* Mobile Status Indicator */}
          <div className="md:hidden flex items-center gap-2">
            {status === 'searching' && <><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" /> <span className="text-sm font-semibold text-[#3B82F6]">Searching</span></>}
            {status === 'connected' && <><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" /> <span className="text-sm font-semibold text-green-500">Connected</span></>}
            {status === 'disconnected' && <><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-sm font-semibold text-red-500">Disconnected</span></>}
          </div>

          {/* UX FIX 3: Mobile Integrated Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <button 
              onClick={handleNext}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> Next
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-color)] rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Mobile Dropdown Menu */}
              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] rounded-xl border border-[var(--border-color)] shadow-xl overflow-hidden py-1 z-50 origin-top-right"
                  >
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-main)] hover:bg-red-500/10 hover:text-red-500 transition-colors">
                      <Flag className="w-4 h-4" /> Report
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-main)] hover:bg-red-500/10 hover:text-red-500 transition-colors">
                      <ShieldBan className="w-4 h-4" /> Block
                    </button>
                    <div className="h-px bg-[var(--border-color)] my-1" />
                    <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors">
                      <LogOut className="w-4 h-4" /> Leave Chat
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        {/* UX FIX 4: overscroll-contain explicitly stops the mobile browser pull-to-refresh jerk */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-[var(--background)]/30 min-h-0"
          onClick={() => setShowMobileMenu(false)}
        >
          {status === 'searching' && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
              <p className="font-medium animate-pulse">Looking for someone interesting...</p>
            </div>
          )}

          {messages.map(msg => (
            msg.isSystem ? (
              <div key={msg.id} className="text-center text-xs tracking-wide uppercase text-[var(--text-muted)] font-bold my-6">
                {msg.text}
              </div>
            ) : (
              <MessageBubble key={msg.id} message={msg.text} isOwn={msg.isOwn} />
            )
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="flex-shrink-0 z-10" onClick={() => setShowMobileMenu(false)}>
          <ChatInput onSend={handleSend} disabled={status !== 'connected'} />
        </div>
      </div>

      {/* Right: Controls Sidebar (Desktop Only) */}
      {/* UX FIX 5: Completely hidden on mobile breakpoints */}
      <div className="hidden md:block w-80 h-full flex-shrink-0">
        <ConnectionCard status={status} onNext={handleNext} />
      </div>
      
    </div>
  );
}