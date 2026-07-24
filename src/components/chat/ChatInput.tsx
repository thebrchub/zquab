import { Send, Smile, Image } from 'lucide-react';
import { useState } from 'react';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
  onRequestPhoto?: () => void;
  photoRequestDisabled?: boolean;
}

export default function ChatInput({ onSend, disabled, onRequestPhoto, photoRequestDisabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="p-4 bg-[var(--card)] border-t border-[var(--border-color)] rounded-b-2xl">
      <div className="flex items-center gap-2 max-w-4xl mx-auto bg-[var(--background)] p-1.5 rounded-full border border-[var(--border-color)] focus-within:border-[#3B82F6] transition-colors">
        <button 
          disabled={disabled}
          className="p-2 text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors disabled:opacity-50"
        >
          <Smile className="w-6 h-6" />
        </button>

        {onRequestPhoto && (
          <button
            type="button"
            onClick={onRequestPhoto}
            disabled={disabled || photoRequestDisabled}
            title="Ask for a photo"
            className="p-2 text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors disabled:opacity-50"
          >
            <Image className="w-6 h-6" />
          </button>
        )}
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          placeholder={disabled ? "Waiting for connection..." : "Type a message..."}
          className="flex-1 bg-transparent outline-none px-2 text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
        />
        
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2.5 bg-[#3B82F6] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3B82F6] transition-all transform active:scale-95"
        >
          <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
        </button>
      </div>
    </div>
  );
}