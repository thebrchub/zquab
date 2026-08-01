import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, User, ChevronRight, X, Copy, CheckCircle2, History } from 'lucide-react';
import { usersApi } from '../api/users'; 
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  is_private: boolean;
  is_online?: boolean;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 🛠️ NEW: Recent Searches state initialized from localStorage
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>(() => {
    try {
      const saved = localStorage.getItem('zquab_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // 🛠️ NEW: Save user to recent searches when clicked
  const handleSelectUser = (clickedUser: SearchResult) => {
    setRecentSearches((prev) => {
      // Remove if already exists to push it to the top, then slice to keep max 5 items
      const filtered = prev.filter((item) => item.username !== clickedUser.username);
      const updated = [clickedUser, ...filtered].slice(0, 5);
      localStorage.setItem('zquab_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // 🛠️ NEW: Remove single item from recent searches
  const handleRemoveRecent = (e: React.MouseEvent, usernameToRemove: string) => {
    e.preventDefault(); // Prevent navigating to the profile when clicking the 'X'
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.username !== usernameToRemove);
      localStorage.setItem('zquab_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCopyLink = () => {
    if (!user?.username) return;
    const profileUrl = `${window.location.origin}/user/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-12 pb-24">
      
      {/* 1. Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight mb-2">
          Find Someone
        </h1>
        <p className="text-lg text-[var(--text-muted)] font-medium">
          Search for friends using their unique username.
        </p>
      </div>

      {/* 2. The Tool (Search Bar) */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
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

      {/* 3. Dynamic Area */}
      <div className="space-y-3">
        {error && (
          <div className="py-4 text-red-500 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin mb-4" />
          </div>
        ) : query.trim() !== '' ? (
          
          // SEARCH RESULTS
          results.length > 0 ? (
            results.map((result) => (
              <Link 
                key={result.id} 
                to={`/user/${result.username}`}
                onClick={() => handleSelectUser(result)}
                className="flex items-center p-4 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl hover:border-[#3B82F6] transition-all group active:scale-[0.98]"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-[var(--background)] overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
                    {result.avatar_url ? (
                      <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-[var(--text-muted)]" />
                    )}
                  </div>
                  {result.is_online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--card)] rounded-full"></div>
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
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
              <p className="text-lg font-bold text-[var(--text-main)] mb-1">No users found</p>
              <p className="text-base text-center">Make sure the username is spelled correctly.</p>
            </div>
          )
        ) : (
          
          // DEFAULT STATE: RECENT SEARCHES + TIPS
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1 text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <History className="w-4 h-4" /> Recent Profiles
                </div>
                <div className="space-y-2">
                  {recentSearches.map((item) => (
                    <div 
                      key={item.username}
                      className="flex items-center justify-between p-3 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl hover:border-[#3B82F6] transition-all group"
                    >
                      <Link 
                        to={`/user/${item.username}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden flex items-center justify-center border border-[var(--border-color)] flex-shrink-0">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[var(--text-main)] text-sm truncate">{item.name || item.username}</h4>
                          <p className="text-xs text-[var(--text-muted)] truncate">@{item.username}</p>
                        </div>
                      </Link>

                      {/* Cross mark button to delete individual history item */}
                      <button 
                        onClick={(e) => handleRemoveRecent(e, item.username)}
                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Remove from history"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-2 sm:px-4 space-y-10 pt-4">
              {/* Minimal Rule Set */}
              <div className="text-center sm:text-left">
                <p className="text-[var(--text-main)] text-lg font-bold mb-1">Search by exact username.</p>
                <p className="text-[var(--text-muted)] text-base">
                  Usernames don't contain spaces. Example: <span className="text-[var(--text-main)] font-semibold">rajmillennium</span>
                </p>
              </div>

              <hr className="border-[var(--border-color)] opacity-60" />

              {/* Minimal Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-center sm:text-left">
                <div>
                  <p className="text-[var(--text-main)] text-lg font-bold mb-1">Can't find someone?</p>
                  <p className="text-[var(--text-muted)] text-base">Ask them to share their profile link.</p>
                </div>
                
                <button 
                  onClick={handleCopyLink}
                  disabled={!user || user.is_guest}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--card)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] rounded-full font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {copied ? (
                    <><CheckCircle2 className="w-5 h-5 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-5 h-5" /> Copy My Link</>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}