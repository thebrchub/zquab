import { Send, Smile, Image as ImageIcon, Info, Paperclip, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
  onRequestPhoto?: () => void;
  onDirectImageClick?: () => void;
  photoRequestDisabled?: boolean;
  onTyping?: () => void;
}

export default function ChatInput({ 
  onSend, 
  disabled, 
  onRequestPhoto, 
  onDirectImageClick, 
  photoRequestDisabled,
  onTyping
}: Props) {
  const [text, setText] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🛠️ UPDATED: Uses the secure CDN URL we discussed earlier
  const STORAGE_CDN_BASE_URL = import.meta.env.VITE_STORAGE_CDN_BASE_URL ?? 'https://cdn.zquab.com/';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    if (newValue.includes(STORAGE_CDN_BASE_URL)) {
      newValue = newValue.replace(new RegExp(STORAGE_CDN_BASE_URL + '\\S*', 'g'), '');
    }

    setText(newValue);
    
    if (onTyping) onTyping();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    setShowDrawer(false);
    setShowEmoji(false); 
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="bg-[var(--card)] border-t border-[var(--border-color)] flex flex-col w-full relative z-20">
      
      <AnimatePresence>
        {showEmoji && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[calc(100%+8px)] left-2 sm:left-14 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border-color)] max-w-[90vw]"
          >
            <EmojiPicker 
              theme={Theme.DARK} 
              onEmojiClick={(emojiData) => {
                setText((prev) => prev + emojiData.emoji);
                if (onTyping) onTyping(); 
              }}
              searchDisabled={false}
              skinTonesDisabled
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[var(--background)] border-b border-[var(--border-color)]"
          >
            <div className="p-4 sm:p-6">
              
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[var(--text-main)]">Attachments</h4>
                <button onClick={() => setShowDrawer(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--card)] p-1 rounded-full border border-[var(--border-color)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                {/* 🛠️ FIX: Bumped from text-xs to text-sm for better readability */}
                <p className="text-sm text-[var(--text-main)] leading-relaxed">
                  For safety, direct photo uploads are disabled. You can only request photos. If you want to send one, the stranger must request it from you first!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onRequestPhoto?.();
                  setShowDrawer(false);
                }}
                disabled={disabled || photoRequestDisabled}
                className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
              >
                <ImageIcon className="w-5 h-5" />
                Request a Photo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 w-full max-w-5xl mx-auto pb-safe">
        
        {(onRequestPhoto || onDirectImageClick) && (
          <button
            onClick={() => {
              if (onDirectImageClick) {
                onDirectImageClick(); 
              } else {
                setShowDrawer(!showDrawer); 
                setShowEmoji(false); 
              }
            }}
            disabled={disabled || photoRequestDisabled}
            className={`p-2 sm:p-2.5 rounded-full transition-colors flex-shrink-0 mb-0.5 ${
              showDrawer 
                ? 'bg-[#3B82F6] text-white' 
                : 'text-[var(--text-muted)] hover:text-[#3B82F6] hover:bg-[var(--background)]'
            } disabled:opacity-50`}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 flex items-end gap-1 sm:gap-2 bg-[var(--background)] border border-[var(--border-color)] focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6] rounded-3xl px-1.5 sm:px-2 py-1 transition-all">
          <button 
            onClick={() => {
              setShowEmoji(!showEmoji);
              setShowDrawer(false); 
            }}
            disabled={disabled}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 mb-0.5 disabled:opacity-50 ${
              showEmoji ? 'text-[#3B82F6] bg-[var(--card)]' : 'text-[var(--text-muted)] hover:text-[#3B82F6]'
            }`}
          >
            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? "Waiting..." : "Message..."}
            // 🛠️ FIX: Bumped to text-base (16px) for mobile to prevent iOS zooming, and md:text-[17px] for desktop
            className="flex-1 min-w-0 bg-transparent outline-none py-2 pr-2 text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-50 text-base md:text-[17px] resize-none custom-scrollbar"
            style={{ maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 mb-0.5 p-2.5 sm:p-3 bg-[#3B82F6] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3B82F6] transition-all transform active:scale-95 shadow-md"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 sm:ml-1" />
        </button>

      </div>
    </div>
  );
}