import { UserPlus, Flag, ShieldBan, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

type Status = 'searching' | 'connected' | 'disconnected';

interface Props {
  status: Status;
  onNext: () => void;
}

export default function ConnectionCard({ status, onNext }: Props) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-full border border-[var(--border-color)] shadow-sm">
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
        <button 
          onClick={onNext} 
          className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" />
          Next Stranger
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 glass hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-[var(--text-muted)] py-3 rounded-xl font-medium transition-all">
            <Flag className="w-4 h-4" />
            Report
          </button>
          <button className="flex items-center justify-center gap-2 glass hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-[var(--text-muted)] py-3 rounded-xl font-medium transition-all">
            <ShieldBan className="w-4 h-4" />
            Block
          </button>
        </div>
        
        <Link 
          to="/"
          className="w-full flex items-center justify-center gap-2 glass hover:bg-[var(--border-color)] text-[var(--text-main)] py-3 rounded-xl font-medium transition-all mt-2"
        >
          <LogOut className="w-5 h-5" />
          Leave Chat
        </Link>
      </div>
    </div>
  );
}