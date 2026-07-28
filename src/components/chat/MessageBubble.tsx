interface Props {
  message?: string;
  content?: string; 
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  time?: string;
  imageUrl?: string;
}

// Utility to check if a string contains ONLY emojis (and spaces)
const isOnlyEmojis = (str: string) => {
  if (!str.trim()) return false;
  // This Regex checks for extended emoji characters and whitespace
  const emojiRegex = /^[\p{Extended_Pictographic}\s]+$/u;
  return emojiRegex.test(str);
};

export default function MessageBubble({ message, content, isOwn, status, time, imageUrl }: Props) {
  const displayText = content || message || '';
  const formattedTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  
  const emojiOnly = isOnlyEmojis(displayText);

  return (
    <div className={`flex flex-col w-full mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      
      {/* 1. Standalone Image Render (Independent of Text Bubble) */}
      {imageUrl && (
        <div className={`max-w-[75%] md:max-w-[65%] mb-1 relative`}>
          <img 
            src={imageUrl} 
            alt="Shared photo" 
            className="w-full h-auto rounded-2xl object-cover shadow-sm border border-[var(--border-color)]" 
          />
        </div>
      )}
      
      {/* 2. Text or Emoji Render */}
      {displayText && (
        <div 
          className={`max-w-[75%] md:max-w-[65%] flex flex-col relative
            ${emojiOnly 
              ? 'bg-transparent text-4xl leading-tight' // Transparent & Huge for Emojis
              : `rounded-2xl px-4 py-2.5 shadow-sm text-sm md:text-base leading-relaxed break-words
                 ${isOwn 
                   ? 'bg-[#3B82F6] text-white rounded-tr-sm' 
                   : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                 }`
            }`}
        >
          <p>{displayText}</p>
          
          {/* Time & Status for DM Chat */}
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

      {/* Time & Status for Emojis (Rendered below the emoji since it has no bubble) */}
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