import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { blogsApi, type Blog } from '../api/blogs';
import PaginationLoader from '../components/PaginationLoader';
import { Helmet } from 'react-helmet-async';

export default function BlogPage() {
  const navigate = useNavigate();
  
  // 🛠️ Dynamic State
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 9; // Multiple of 3 looks best on large screens

  const fetchBlogs = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      }
      
      const currentOffset = reset ? 0 : offset;
      const results = await blogsApi.getBlogs(LIMIT, currentOffset);

      setBlogs(prev => reset ? results : [...prev, ...results]);
      if (results.length < LIMIT) setHasMore(false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial mount
  useEffect(() => {
    fetchBlogs(true);
  }, []);

  // 🛠️ Formats RFC3339 to "Jul 28, 2026"
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Draft';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fallback gradients if a post has no cover image
  const fallbackGradients = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-500",
    "from-orange-400 to-rose-400"
  ];

  return (
    <>

    <Helmet>
  <title>zQuab Blog | Tips, Updates & Guides for Anonymous Chatting</title>
  <meta name="description" content="Explore the zQuab blog for the latest platform updates, internet safety tips, and guides on making the best out of your anonymous chat experiences." />
</Helmet>
    <div className="min-h-[calc(100dvh-64px)] bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto z-10 relative">
        
        {/* Page Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black text-[var(--text-main)] tracking-tight mb-4"
          >
            Thoughts on Connection
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto"
          >
            Insights, updates, and deep dives into the human element of the internet from the builders of zQuab.
          </motion.p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {loading && blogs.length === 0 ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="col-span-full text-center py-20 text-[var(--text-muted)] bg-[var(--card)] border border-[var(--border-color)] rounded-2xl">
              <p>No articles published yet. Check back soon!</p>
            </div>
          ) : (
            blogs.map((post, index) => {
              const gradient = fallbackGradients[index % fallbackGradients.length];
              
              return (
                <motion.article 
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col bg-[var(--card)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#3B82F6]/5 transition-all duration-300 cursor-pointer"
                >
                  {/* Card Image */}
                  <div className={`h-48 w-full bg-gradient-to-br ${!post.coverImage ? gradient : ''} p-6 flex flex-col justify-end relative overflow-hidden bg-[var(--border-color)]`}>
                    {post.coverImage && (
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-0"></div>
                    
                    {/* Replaced category with generic Article pill */}
                    <span className="relative z-10 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full self-start shadow-sm">
                      Article
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mb-6 line-clamp-3 flex-1 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Card Footer */}
                    <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(post.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readingTime} min read
                        </span>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6] transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>

        {/* Pagination Loader */}
        {blogs.length > 0 && (
          <PaginationLoader 
            onLoadMore={() => fetchBlogs(false)} 
            hasMore={hasMore} 
            isLoading={loading} 
          />
        )}
        
      </div>
    </div>
    </>
  );
}