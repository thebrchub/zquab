import { Send, Smile, Image, Info, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
  onRequestPhoto?: () => void;
  photoRequestDisabled?: boolean;
}

export default function ChatInput({ onSend, disabled, onRequestPhoto, photoRequestDisabled }: Props) {
  const [text, setText] = useState('');
  const [showPhotoInfo, setShowPhotoInfo] = useState(false);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="p-4 bg-[var(--card)] border-t border-[var(--border-color)] rounded-b-2xl relative">
      
      {/* Mobile-Friendly Info Popup */}
      <AnimatePresence>
        {showPhotoInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-4 mb-2 w-64 bg-[var(--card)] border border-[var(--border-color)] shadow-xl p-3 rounded-xl z-50 flex items-start gap-2"
          >
            <Info className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">
              For safety, direct uploads are disabled. You can only request photos. If you want to send one, the stranger must request it from you first!
            </p>
            <button onClick={() => setShowPhotoInfo(false)} className="text-[var(--text-muted)] hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 max-w-4xl mx-auto bg-[var(--background)] p-1.5 rounded-full border border-[var(--border-color)] focus-within:border-[#3B82F6] transition-colors">
        <button 
          disabled={disabled}
          className="p-2 text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors disabled:opacity-50"
        >
          <Smile className="w-6 h-6" />
        </button>

        {onRequestPhoto && (
          <div className="flex items-center relative ml-1 mr-2">
            <button
              type="button"
              onClick={onRequestPhoto}
              disabled={disabled || photoRequestDisabled}
              title="Ask for a photo"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 rounded-full text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Image className="w-4 h-4" />
              Ask Photo
            </button>
            
            {/* The Tiny Info Icon - Adjusted positioning for the new pill shape */}
            <button 
              type="button"
              onClick={() => setShowPhotoInfo(!showPhotoInfo)}
              className="absolute -top-1.5 -right-1.5 bg-[var(--background)] rounded-full text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors z-10"
            >
              <Info className="w-4 h-4 bg-[var(--card)] rounded-full" />
            </button>
          </div>
        )}
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          placeholder={disabled ? "Waiting for connection..." : "Type a message..."}
          className="flex-1 min-w-0 bg-transparent outline-none px-2 text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
        />
        
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 p-2.5 bg-[#3B82F6] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3B82F6] transition-all transform active:scale-95"
        >
          <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
        </button>
      </div>
    </div>
  );
}