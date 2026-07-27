

interface Props {
  // Supports both 'message' (Anonymous Chat) and 'content' (DM Chat)
  message?: string;
  content?: string; 
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  time?: string;
  imageUrl?: string; // For the anonymous photo sharing
}

export default function MessageBubble({ message, content, isOwn, status, time, imageUrl }: Props) {
  // Gracefully fallback to whichever text prop was passed
  const displayText = content || message || '';
  const formattedTime = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 flex flex-col relative
          ${isOwn 
            ? 'bg-[#3B82F6] text-white rounded-tr-sm' 
            : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
          }`}
      >
        {/* Render Image if one was sent */}
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Shared photo" 
            className="max-w-full rounded-xl mb-2 object-cover border border-white/10" 
          />
        )}
        
        {/* Render Text if there is any */}
        {displayText && (
          <p className="text-sm md:text-base leading-relaxed break-words">{displayText}</p>
        )}
        
        {/* Render Time & Status if provided (used in DM Chat) */}
        {formattedTime && (
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
    </div>
  );
}