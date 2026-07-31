import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, User, ChevronRight, X, Copy, CheckCircle2, Users, HelpCircle } from 'lucide-react';
import { usersApi } from '../api/users'; 
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  is_private: boolean;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await usersApi.searchUsers(trimmedQuery);
        setResults(data || []);
      } catch (err: any) {
        console.error('Search failed:', err);
        setError('Failed to fetch results. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleCopyLink = () => {
    if (!user?.username) return;
    const profileUrl = `${window.location.origin}/user/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-6 pb-20">
      <h1 className="text-3xl font-black text-[var(--text-main)] mb-6 tracking-tight">Find Someone</h1>

      {/* Search Input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={30}
          placeholder="Search exact username..."
          className="w-full pl-14 pr-12 py-5 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all shadow-sm text-lg font-medium"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-6 h-6 bg-[var(--background)] rounded-full p-1 border border-[var(--border-color)]" />
          </button>
        )}
      </div>

      {/* Results Area */}
      <div className="space-y-3">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-medium border border-red-500/20">
            {error}
          </div>
        )}

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin mb-4" />
            <p className="font-medium animate-pulse">Searching network...</p>
          </div>
        ) : query.trim() !== '' ? (
          // HAS QUERY BUT EITHER FOUND OR NOT FOUND
          results.length > 0 ? (
            results.map((result) => (
              <Link 
                key={result.id} 
                to={`/user/${result.username}`}
                className="flex items-center p-4 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl hover:border-[#3B82F6] transition-all group active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--background)] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--border-color)]">
                  {result.avatar_url ? (
                    <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                  <h3 className="font-bold text-[var(--text-main)] text-lg truncate">{result.name || result.username}</h3>
                  <p className="text-sm text-[var(--text-muted)] font-medium truncate">@{result.username}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border-color)] rounded-3xl border-dashed">
              <div className="w-16 h-16 bg-[var(--background)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-bold text-[var(--text-main)]">No users found</p>
              <p className="text-sm mt-2 text-center max-w-xs leading-relaxed">
                Make sure the username is spelled correctly. Usernames are unique.
              </p>
            </div>
          )
        ) : (
          // 🛠️ THE PREMIUM EMPTY STATE (When no query is typed)
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Search Tips Card */}
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-500/10 text-[#3B82F6] rounded-2xl flex items-center justify-center mb-5">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[var(--text-main)] mb-3">How Search Works</h3>
              <ul className="space-y-2.5 text-sm text-[var(--text-muted)] font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-[#3B82F6] mt-0.5">•</span> 
                  Search by exact username.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3B82F6] mt-0.5">•</span> 
                  Usernames contain no spaces.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3B82F6] mt-0.5">•</span> 
                  Example: <span className="bg-[var(--background)] px-2 py-0.5 rounded-md border border-[var(--border-color)] text-[var(--text-main)]">rajmillennium</span>
                </li>
              </ul>
            </div>

            {/* Profile Link Card */}
            <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[var(--text-main)] mb-2">Can't find them?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-5 font-medium leading-relaxed flex-1">
                Have them share their profile link with you directly, or share yours!
              </p>
              
              <button 
                onClick={handleCopyLink}
                disabled={!user || user.is_guest}
                className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--border-color)] hover:border-[#3B82F6] text-[var(--text-main)] hover:text-[#3B82F6] py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:hover:border-[var(--border-color)] disabled:hover:text-[var(--text-main)]"
              >
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy My Link</>
                )}
              </button>
              {(!user || user.is_guest) && (
                <p className="text-[10px] text-center mt-2 text-[var(--text-muted)]">Log in to share your profile.</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}