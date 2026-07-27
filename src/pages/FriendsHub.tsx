import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '../api/friends';
import UserCard from '../components/UserCard';
import PaginationLoader from '../components/PaginationLoader';
import { Users, UserPlus, ShieldBan, Search, Check, X, Loader2 } from 'lucide-react';

type Tab = 'friends' | 'requests' | 'blocked' | 'search';

export default function FriendsHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const LIMIT = 15;

  const fetchData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      }
      
      const currentOffset = reset ? 0 : offset;
      let results: any[] = [];

      if (activeTab === 'friends') {
        results = await friendsApi.getFriends(LIMIT, currentOffset);
      } else if (activeTab === 'requests') {
        results = await friendsApi.getRequests('received', LIMIT, currentOffset);
      } else if (activeTab === 'blocked') {
        results = await friendsApi.getBlockedUsers(LIMIT, currentOffset);
      } else if (activeTab === 'search' && searchQuery.trim()) {
        // API guide specifies search uses ?q= instead of ?query=
        results = await friendsApi.searchFriends(searchQuery);
        setHasMore(false); // Search endpoint in API isn't paginated in the guide
      }

      setData(prev => reset ? results : [...prev, ...results]);
      if (results.length < LIMIT && activeTab !== 'search') setHasMore(false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when tab changes
  useEffect(() => {
    if (activeTab !== 'search' || searchQuery) {
      fetchData(true);
    } else {
      setData([]);
    }
  }, [activeTab]);

  // Debounced Search
  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) fetchData(true);
      else setData([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAction = async (action: () => Promise<void>, username: string) => {
    try {
      await action();
      setData(prev => prev.filter(u => u.username !== username));
    } catch (error) {
      alert('Action failed. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-6 pb-20 flex flex-col h-[100dvh]">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">Friends Hub</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2 flex-shrink-0">
        {[
          { id: 'friends', icon: Users, label: 'My Friends' },
          { id: 'requests', icon: UserPlus, label: 'Requests' },
          { id: 'search', icon: Search, label: 'Find Friends' },
          { id: 'blocked', icon: ShieldBan, label: 'Blocked' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#3B82F6] text-white' 
                : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--background)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div className="mb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-[var(--card)] border border-[var(--border-color)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-main)] outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>
        </div>
      )}

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        {loading && data.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border-color)] rounded-2xl">
            <p>Nothing to show here.</p>
          </div>
        ) : (
          data.map((user) => (
            <UserCard
              key={user.id || user.request_id}
              user={{
                ...user,
                subtitle: activeTab === 'friends' ? `Friends since ${new Date(user.friends_since).getFullYear()}` : 
                          activeTab === 'blocked' ? 'Blocked' : undefined
              }}
              onClick={() => navigate(`/user/${user.username}`)}
              actionButton={
                activeTab === 'requests' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.acceptRequest(user.username), user.username); }}
                      className="p-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.rejectRequest(user.username), user.username); }}
                      className="p-2 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : activeTab === 'blocked' ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(() => friendsApi.unblockUser(user.username), user.username); }}
                    className="px-4 py-1.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm font-bold hover:bg-[var(--card)] transition-colors"
                  >
                    Unblock
                  </button>
                ) : null
              }
            />
          ))
        )}
        <PaginationLoader onLoadMore={() => fetchData()} hasMore={hasMore} isLoading={loading} />
      </div>
    </div>
  );
}
