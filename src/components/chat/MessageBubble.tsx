import { Loader2, Check, CheckCheck } from 'lucide-react';
import { memo } from 'react';

interface Props {
  message?: string;
  content?: string; 
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  time?: string;
  imageUrl?: string;
  onImageClick?: (url: string) => void; 
  isUploading?: boolean;
  isSystem?: boolean;
}

const isOnlyEmojis = (str: string) => {
  if (!str.trim()) return false;
  const emojiRegex = /^[\p{Extended_Pictographic}\s]+$/u;
  return emojiRegex.test(str);
};

function MessageBubble({ message, content, isOwn, status, time, imageUrl, onImageClick, isUploading, isSystem }: Props) {
  const displayText = content || message || '';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 sm:my-6 w-full select-none">
        <span className="text-[11px] sm:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest text-center px-4">
          {displayText}
        </span>
      </div>
    );
  }

  const formattedTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const emojiOnly = isOnlyEmojis(displayText);

  // 🛠️ NEW: Helper to render fixed-width icons instead of text
  const renderStatusIcon = () => {
    if (!isOwn || !status) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-white/70" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-white/70" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-[#4ade80]" />; // Bright green for contrast on blue
      default:
        return null;
    }
  };

  // 🛠️ NEW: Helper for emoji-only status icons (different colors for the transparent background)
  const renderEmojiStatusIcon = () => {
    if (!isOwn || !status) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-[#3B82F6]" />; // Blue ticks for read emojis
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col w-full mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      
      {/* 1. Standalone Image Render */}
      {imageUrl && (
        <div className={`max-w-[75%] md:max-w-[65%] mb-1 relative rounded-2xl overflow-hidden`}>
          <img 
            src={imageUrl} 
            alt="Shared photo" 
            draggable={false} 
            onDragStart={(e) => e.preventDefault()} 
            onClick={!isUploading ? () => onImageClick?.(imageUrl) : undefined}
            className={`w-full h-auto object-cover shadow-sm border border-[var(--border-color)] transition-all duration-300 ${
              isUploading 
                ? 'opacity-60 blur-sm grayscale-[30%]' 
                : 'cursor-zoom-in hover:opacity-90 active:scale-[0.98]'
            }`} 
          />
          
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 p-3 sm:p-4 rounded-full backdrop-blur-md flex flex-col items-center justify-center shadow-2xl">
                <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                <span className="text-[10px] text-white font-bold tracking-widest uppercase">Sending</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 2. Text or Emoji Render */}
      {displayText && (
        <div 
          className={`max-w-[75%] md:max-w-[65%] flex flex-col relative transition-all duration-200 ease-out
            ${emojiOnly 
              ? 'bg-transparent text-4xl leading-tight'
              : `rounded-2xl px-4 py-2.5 shadow-sm text-base md:text-[17px] leading-relaxed
                 ${isOwn 
                   ? 'bg-[#3B82F6] text-white rounded-tr-sm' 
                   : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                 }`
            }`}
        >
          <p className="break-words whitespace-pre-wrap">{displayText}</p>
          
          {formattedTime && !emojiOnly && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] uppercase font-bold self-end
              ${isOwn ? 'text-blue-100' : 'text-[var(--text-muted)]'}
            `}>
              <span>{formattedTime}</span>
              {/* 🛠️ FIX: Replaced text with the icon helper */}
              <div className="flex items-center ml-0.5">
                {renderStatusIcon()}
              </div>
            </div>
          )}
        </div>
      )}

      {formattedTime && emojiOnly && (
        <div className={`flex items-center gap-1 mt-1 text-[10px] uppercase font-bold
          ${isOwn ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}
        `}>
          <span>{formattedTime}</span>
          {/* 🛠️ FIX: Replaced text with the emoji icon helper */}
          <div className="flex items-center ml-0.5">
            {renderEmojiStatusIcon()}
          </div>
        </div>
      )}

    </div>
  );
}

export default memo(MessageBubble);