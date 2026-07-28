import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ChevronDown, Rocket } from 'lucide-react';

export default function DevMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Safety net: This will completely hide the menu if you build for production
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {/* The Expanded Menu */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-56 flex flex-col gap-2 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Dev Menu</span>
          </div>
          
          <Link to="/dev/onboarding" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🎨 UI: Onboarding
          </Link>
          <Link to="/dev/auth" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            🔐 UI: Auth
          </Link>
          <Link to="/dev/home" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            📥 UI: Inbox
          </Link>
          <Link to="/dev/chat" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
            💬 UI: Chat Room
          </Link>
        </div>
      )}

      {/* The Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 transition-transform active:scale-95 border-2 border-purple-400/50"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <Bug className="w-6 h-6" />}
      </button>
    </div>
  );
}