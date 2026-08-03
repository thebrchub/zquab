import { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { UserPlus, LogOut, Check, Loader2, Globe2, Plus, User, HelpCircle } from 'lucide-react';


type Status = 'idle' | 'searching' | 'connected' | 'disconnected';

interface Props {
  status: Status;
  onNext: () => void;
  userCountry?: { name: string; code: string } | null;
  partnerCountry?: { name: string; code: string } | null;
  partnerUsername?: string; 
  partnerGender?: string; 
  onAddFriend?: () => void;
  friendRequestStatus?: 'none' | 'loading' | 'sent';
  isAlreadyFriend?: boolean;
  onLeaveConfirm: () => void;
}

export default function ConnectionCard({ 
  status, 
  onNext, 
  userCountry, 
  partnerCountry,
  partnerUsername,
  partnerGender,
  onAddFriend,
  friendRequestStatus = 'none',
  isAlreadyFriend = false,
  onLeaveConfirm
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-full border border-[var(--border-color)] shadow-sm bg-[var(--card)] relative overflow-hidden">
      
      {/* INLINE CONFIRMATION OVERLAY */}
      {showConfirm && (
        <div className="absolute inset-0 z-20 bg-[var(--card)]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-blue-500/10 text-[#3B82F6] rounded-full flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h4 className="text-[var(--text-main)] font-bold text-lg mb-1">Add @{partnerUsername}?</h4>
          <p className="text-sm text-[var(--text-muted)] mb-6">They will receive a friend request.</p>
          
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                onAddFriend?.();
                setShowConfirm(false);
              }}
              className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              Send Request
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-3 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STATUS HEADER */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Status
        </h3>
        
        {status === 'searching' && (
          <div className="flex items-center gap-2 text-[#3B82F6] font-bold">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" />
            Searching...
          </div>
        )}
        
        {status === 'connected' && (
          <div className="flex items-center gap-2 text-green-500 font-bold">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]" />
            Stranger Connected
          </div>
        )}

        {status === 'disconnected' && (
          <div className="flex items-center gap-2 text-red-500 font-bold">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Disconnected
          </div>
        )}
      </div>

      <div className="space-y-4 mt-auto">
        
        {/* 🛠️ THE COMPACT STACKED PROFILE WITH OVERLAPPING BADGE */}
        {status === 'connected' && partnerUsername && (
          <div className="bg-[var(--background)]/50 p-6 rounded-3xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center relative">
            
            {/* Avatar Container (Relative for Badge positioning) */}
            <div className="relative mb-3">
              <div className="w-20 h-20 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-10 h-10 text-indigo-500" />
              </div>

              {/* Dynamic Overlapping Badge */}
              {!isAlreadyFriend && friendRequestStatus === 'none' ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#3B82F6] hover:bg-blue-600 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md border-[3px] border-[var(--background)]"
                  aria-label="Add Friend"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : friendRequestStatus === 'loading' ? (
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--card)] border-[3px] border-[var(--background)] flex items-center justify-center shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                </div>
              ) : (
                <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full ${isAlreadyFriend ? 'bg-emerald-500' : 'bg-green-500'} text-white flex items-center justify-center shadow-md border-[3px] border-[var(--background)]`}>
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
            
            {/* 🛠️ FIX: Made the username a clickable link that opens in a new tab */}
            <a 
              href={`/user/${partnerUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-[var(--text-main)] hover:text-[#3B82F6] hover:underline transition-colors text-xl leading-tight mb-1"
              title={`View @${partnerUsername}'s profile in a new tab`}
            >
              @{partnerUsername}
            </a>
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              {isAlreadyFriend ? 'Already Friends' : (partnerGender || 'Verified User')}
            </span>
          </div>
        )}

        {/* 🛠️ ANONYMOUS PROFILE PLACEHOLDER */}
        {status === 'connected' && !partnerUsername && (
          <div className="bg-[var(--background)]/50 py-6 px-4 rounded-3xl border border-[var(--border-color)] border-dashed flex flex-col items-center justify-center text-center relative">
            
            {/* Avatar Container - NOW A BUTTON FOR MOBILE TAPS */}
            <button type="button" className="relative mb-3 group focus:outline-none">
              <div className="w-20 h-20 bg-gray-500/10 border-2 border-gray-500/20 rounded-full flex items-center justify-center shadow-sm transition-colors group-hover:border-gray-500/40 group-focus:border-gray-500/40">
                <HelpCircle className="w-10 h-10 text-gray-500" />
              </div>
              
              {/* Hover / Tap Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <div className="bg-[var(--text-main)] text-[var(--background)] text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
                  No account created
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[var(--text-main)]"></div>
                </div>
              </div>
            </button>
            
            <span className="font-black text-[var(--text-main)] text-xl leading-tight mb-1">Anonymous</span>
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              Guest User
            </span>
          </div>
        )}

        {/* LOCATIONS */}
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--background)]/50 p-4">
          <div className="flex-1 flex flex-col items-center group relative cursor-help">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">You</span>
            {userCountry?.code ? (
              <ReactCountryFlag countryCode={userCountry.code} svg className="text-3xl rounded-sm drop-shadow-sm" />
            ) : (
              <div className="w-8 h-6 bg-[var(--border-color)] rounded animate-pulse" />
            )}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-main)] text-[var(--background)] text-xs font-bold px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
              {userCountry?.name || 'Detecting...'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
            </div>
          </div>

          <div className="w-px h-10 bg-[var(--border-color)] mx-2"></div>

          <div className="flex-1 flex flex-col items-center group relative cursor-help">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Stranger</span>
            {partnerCountry?.code ? (
              <ReactCountryFlag countryCode={partnerCountry.code} svg className="text-3xl rounded-sm drop-shadow-sm" />
            ) : (
              <Globe2 className="w-7 h-7 text-[var(--text-muted)] opacity-50" />
            )}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--text-main)] text-[var(--background)] text-xs font-bold px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
              {partnerCountry?.name || 'Unknown Location'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
            </div>
          </div>
        </div>

        <button 
          onClick={onNext} 
          className="w-full flex items-center justify-center gap-2 bg-[var(--background)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] py-4 rounded-xl font-bold transition-all active:scale-[0.98] mt-2"
        >
          <UserPlus className="w-5 h-5" />
          Next Stranger
        </button>
        
        {/* 🛠️ Replaced <Link> with a button to trigger the modal */}
        <button 
          onClick={onLeaveConfirm}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-xl font-bold transition-all active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          Leave Chat
        </button>
      </div>
    </div>
  );
}