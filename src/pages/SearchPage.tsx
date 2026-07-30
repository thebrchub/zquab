import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, User, ChevronRight, X } from 'lucide-react';
import { usersApi } from '../api/users'; // Adjust path as needed

// Mirroring the backend response shape
interface SearchResult {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  is_private: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛠️ Debounce Logic: Wait for the user to stop typing for 500ms before calling the API
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
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-6 pb-20">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">Discover People</h1>

      {/* Search Input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={30}
          placeholder="Search by username..."
          className="w-full pl-12 pr-12 py-4 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all shadow-sm text-lg"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Area */}
      <div className="space-y-3">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin mb-4" />
            <p>Searching the network...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            // Route to the public profile we will build next!
            <Link 
              key={user.id} 
              to={`/user/${user.username}`}
              className="flex items-center p-4 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl hover:border-[#3B82F6] transition-all group active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--background)] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--border-color)]">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="ml-4 flex-1 overflow-hidden">
                <h3 className="font-bold text-[var(--text-main)] truncate">{user.name || user.username}</h3>
                <p className="text-sm text-[var(--text-muted)] truncate">@{user.username}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
            </Link>
          ))
        ) : query.trim() !== '' ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border-color)] rounded-2xl border-dashed">
            <Search className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-medium">No users found</p>
            <p className="text-sm text-center mt-1">Make sure the username is spelled correctly.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}