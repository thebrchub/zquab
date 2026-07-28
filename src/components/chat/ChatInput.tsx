import { Send, Smile, Image, Info, Paperclip, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
  onRequestPhoto?: () => void;
  photoRequestDisabled?: boolean;
}

export default function ChatInput({ onSend, disabled, onRequestPhoto, photoRequestDisabled }: Props) {
  const [text, setText] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    setShowDrawer(false);
    setShowEmoji(false);
  };

  return (
    <div className="bg-[var(--card)] border-t border-[var(--border-color)] flex flex-col w-full relative z-20">
      
      {/* 1. Floating Emoji Picker (Absolute) */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+8px)] left-2 sm:left-14 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border-color)]"
          >
            <EmojiPicker 
              theme={Theme.DARK} 
              onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
              searchDisabled={false}
              skinTonesDisabled
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Compact Floating Attachment Menu (Absolute) */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+8px)] left-2 z-50 w-80 bg-[var(--card)] border border-[var(--border-color)] shadow-2xl rounded-2xl overflow-hidden origin-bottom-left"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[var(--text-main)] text-sm uppercase tracking-wider">Attachments</h4>
                <button onClick={() => setShowDrawer(false)} className="text-[var(--text-muted)] hover:text-red-500 bg-[var(--background)] p-1.5 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Info Box */}
              <div className="flex items-start gap-2.5 mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  Direct uploads are disabled for safety. You must request a photo from the stranger first!
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  onRequestPhoto?.();
                  setShowDrawer(false);
                }}
                disabled={disabled || photoRequestDisabled}
                className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98] text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
              >
                <Image className="w-4 h-4" />
                Request a Photo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Bar */}
      <div className="flex items-center gap-2 p-2 sm:p-3 w-full max-w-5xl mx-auto pb-safe">
        
        {/* Attachment Toggle (Extreme Left) */}
        {onRequestPhoto && (
          <button
            onClick={() => {
              setShowDrawer(!showDrawer);
              setShowEmoji(false); 
            }}
            disabled={disabled}
            className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${
              showDrawer 
                ? 'bg-[#3B82F6] text-white' 
                : 'text-[var(--text-muted)] hover:text-[#3B82F6] hover:bg-[var(--background)]'
            } disabled:opacity-50`}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        )}

        {/* Input Wrapper */}
        <div className="flex-1 flex items-center gap-2 bg-[var(--background)] border border-[var(--border-color)] focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6] rounded-full px-2 py-1 transition-all">
          
          {/* Emoji Toggle */}
          <button 
            onClick={() => {
              setShowEmoji(!showEmoji);
              setShowDrawer(false); 
            }}
            disabled={disabled}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
              showEmoji ? 'text-[#3B82F6] bg-[var(--card)]' : 'text-[var(--text-muted)] hover:text-[#3B82F6]'
            }`}
          >
            <Smile className="w-6 h-6" />
          </button>
          
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={disabled}
            placeholder={disabled ? "Waiting..." : "Type a message..."}
            className="flex-1 min-w-0 bg-transparent outline-none py-2 pr-2 text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-50 text-base"
          />
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 p-3 bg-[#3B82F6] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3B82F6] transition-all transform active:scale-95 shadow-md"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>

      </div>
    </div>
  );
}