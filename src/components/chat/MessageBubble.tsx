import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
  content?: string; 
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  time?: string;
  imageUrl?: string;
  onImageClick?: (url: string) => void; 
  isUploading?: boolean; // 🛠️ ADDED: Track uploading state
}

const isOnlyEmojis = (str: string) => {
  if (!str.trim()) return false;
  const emojiRegex = /^[\p{Extended_Pictographic}\s]+$/u;
  return emojiRegex.test(str);
};

export default function MessageBubble({ message, content, isOwn, status, time, imageUrl, onImageClick, isUploading }: Props) {
  const displayText = content || message || '';
  const formattedTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  
  const emojiOnly = isOnlyEmojis(displayText);

  return (
    <div className={`flex flex-col w-full mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      
      {/* 1. Standalone Image Render */}
      {imageUrl && (
        <div className={`max-w-[75%] md:max-w-[65%] mb-1 relative rounded-2xl overflow-hidden`}>
          <img 
            src={imageUrl} 
            alt="Shared photo" 
            onClick={!isUploading ? () => onImageClick?.(imageUrl) : undefined}
            className={`w-full h-auto object-cover shadow-sm border border-[var(--border-color)] transition-all duration-300 ${
              isUploading 
                ? 'opacity-60 blur-sm grayscale-[30%]' // 🛠️ Blurs the image while uploading
                : 'cursor-zoom-in hover:opacity-90 active:scale-[0.98]'
            }`} 
          />
          
          {/* 🛠️ The Loading Overlay */}
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
          className={`max-w-[75%] md:max-w-[65%] flex flex-col relative
            ${emojiOnly 
              ? 'bg-transparent text-4xl leading-tight'
              : `rounded-2xl px-4 py-2.5 shadow-sm text-sm md:text-base leading-relaxed break-words
                 ${isOwn 
                   ? 'bg-[#3B82F6] text-white rounded-tr-sm' 
                   : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                 }`
            }`}
        >
          <p>{displayText}</p>
          
          {formattedTime && !emojiOnly && (
            <div className={`flex items-center gap-1.5 mt-1 text-[10px] uppercase font-bold self-end
              ${isOwn ? 'text-blue-100' : 'text-[var(--text-muted)]'}
            `}>
              <span>{formattedTime}</span>
              {isOwn && status && (
                <span className="tracking-wider opacity-80">
                  • {status}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {formattedTime && emojiOnly && (
        <div className={`flex items-center gap-1 mt-1 text-[10px] uppercase font-bold
          ${isOwn ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}
        `}>
          <span>{formattedTime}</span>
          {isOwn && status && <span>• {status}</span>}
        </div>
      )}

    </div>
  );
}