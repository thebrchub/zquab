import ReactCountryFlag from 'react-country-flag';
import { UserPlus, LogOut, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'idle' | 'searching' | 'connected' | 'disconnected';

interface Props {
  status: Status;
  onNext: () => void;
  userCountry?: { name: string; code: string } | null;
  partnerCountry?: { name: string; code: string } | null;
  
  // 🛠️ The hidden username from the backend, plus action props
  partnerUsername?: string; 
  onAddFriend?: () => void;
  friendRequestStatus?: 'none' | 'loading' | 'sent';
}

export default function ConnectionCard({ 
  status, 
  onNext, 
  userCountry, 
  partnerCountry,
  partnerUsername,
  onAddFriend,
  friendRequestStatus = 'none'
}: Props) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-full border border-[var(--border-color)] shadow-sm bg-[var(--card)]">
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
          Connection Status
        </h3>
        
        {status === 'searching' && (
          <div className="flex items-center gap-3 text-[#3B82F6] font-medium bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" />
            Searching...
          </div>
        )}
        
        {status === 'connected' && (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400 font-medium bg-green-500/10 p-3 rounded-xl border border-green-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" />
            Stranger Connected
          </div>
        )}

        {status === 'disconnected' && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Stranger Disconnected
          </div>
        )}
      </div>

      <div className="space-y-3 mt-auto">
        
        {/* 🛠️ ADD FRIEND BUTTON - Only shows if they are a real user (have a username) */}
        {status === 'connected' && partnerUsername && (
          <div className="mb-6 bg-[var(--background)] p-4 rounded-xl border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] text-center mb-3">
              Enjoying the chat? Add them to your network!
            </p>
            <button 
              onClick={onAddFriend}
              disabled={friendRequestStatus !== 'none'}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                friendRequestStatus === 'sent' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
              } disabled:opacity-80 disabled:active:scale-100`}
            >
              {friendRequestStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {friendRequestStatus === 'sent' && <><Check className="w-4 h-4" /> Request Sent</>}
              {friendRequestStatus === 'none' && <><UserPlus className="w-4 h-4" /> Add Friend</>}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)]/50 px-4 py-3 text-sm text-[var(--text-muted)]">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Your location
          </div>
          <div className="flex items-center gap-2">
            {userCountry?.code ? (
              <>
                <ReactCountryFlag countryCode={userCountry.code} svg className="text-lg leading-none" />
                <span className="font-medium text-[var(--text-main)]">{userCountry.name}</span>
              </>
            ) : (
              <span>{userCountry?.name || 'Detecting location...'}</span>
            )}
          </div>
        </div>

        {partnerCountry && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)]/50 px-4 py-3 text-sm text-[var(--text-muted)]">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Stranger location
            </div>
            <div className="flex items-center gap-2">
              {partnerCountry.code ? (
                <>
                  <ReactCountryFlag countryCode={partnerCountry.code} svg className="text-lg leading-none" />
                  <span className="font-medium text-[var(--text-main)]">{partnerCountry.name}</span>
                </>
              ) : (
                <span>{partnerCountry.name}</span>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={onNext} 
          className="w-full flex items-center justify-center gap-2 bg-[var(--background)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] mt-2"
        >
          <UserPlus className="w-5 h-5" />
          Next Stranger
        </button>
        
        <Link 
          to="/"
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Leave Chat
        </Link>
      </div>
    </div>
  );
}