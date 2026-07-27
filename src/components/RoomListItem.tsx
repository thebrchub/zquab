

interface Room {
  room_id: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
}

interface Partner {
  name: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface Props {
  room: Room;
  partner: Partner | null;
  onClick: () => void;
}

export default function RoomListItem({ room, partner, onClick }: Props) {
  // Format the date nicely (e.g., "10:30 AM" if today, otherwise "Jul 26")
  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={onClick}
      className="p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--background)] transition-colors flex items-center gap-4 cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-[var(--border-color)] overflow-hidden">
          {partner?.avatar_url ? (
            <img src={partner.avatar_url} alt={partner?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-xl text-[var(--text-muted)]">
              {partner?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {partner?.is_online && (
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--card)] rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-bold text-[var(--text-main)] truncate text-base">
            {partner?.name || 'Unknown User'}
          </h3>
          <span className="text-xs font-medium text-[var(--text-muted)] flex-shrink-0 ml-2">
            {formatTime(room.last_message_at)}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-3">
          <p className={`text-sm truncate ${room.unread_count > 0 ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-muted)]'}`}>
            {room.last_message_preview || 'No messages yet'}
          </p>
          
          {room.unread_count > 0 && (
            <span className="bg-[#3B82F6] text-white text-xs font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full flex-shrink-0 shadow-sm shadow-blue-500/20">
              {room.unread_count > 99 ? '99+' : room.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}