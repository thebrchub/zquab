import React from 'react';

interface UserProps {
  id?: string;
  name: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
  subtitle?: string; 
}

interface Props {
  user: UserProps;
  actionButton?: React.ReactNode;
  onClick?: () => void;
}

export default function UserCard({ user, actionButton, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 bg-[var(--card)] border border-[var(--border-color)] rounded-xl flex items-center justify-between gap-4 transition-colors ${onClick ? 'cursor-pointer hover:bg-[var(--background)]' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[var(--border-color)] overflow-hidden flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {user.is_online && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--card)] rounded-full"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--text-main)] truncate leading-tight">{user.name}</h3>
          <p className="text-sm text-[var(--text-muted)] truncate">@{user.username}</p>
          {user.subtitle && (
            <p className="text-xs text-[var(--text-muted)]/70 truncate mt-0.5">{user.subtitle}</p>
          )}
        </div>
      </div>

      {actionButton && (
        <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          {actionButton}
        </div>
      )}
    </div>
  );
}