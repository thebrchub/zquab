import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data: Ready to be replaced by your future API or CMS
const BLOG_POSTS = [
  {
    id: 1,
    title: "Reclaiming the Lost Art of Spontaneous Dialogue",
    excerpt: "Why the modern internet feels so lonely, and how removing algorithms and performance metrics can help us actually connect again.",
    author: "zQuab Team",
    date: "Jul 28, 2026",
    readTime: "4 min read",
    category: "Philosophy",
    gradient: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    title: "Privacy First: Why We Don't Want Your Data",
    excerpt: "In a world of data brokers and targeted ads, we chose a different path. A deep dive into the architecture of ephemeral, secure chatting.",
    author: "zQuab Engineering",
    date: "Jul 22, 2026",
    readTime: "6 min read",
    category: "Engineering",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "How to Have Better Conversations with Strangers",
    excerpt: "Breaking the ice is hard. Here are 5 psychological tips for turning a random 'hello' into a genuinely memorable conversation.",
    author: "Community Team",
    date: "Jul 15, 2026",
    readTime: "3 min read",
    category: "Community",
    gradient: "from-orange-400 to-rose-400"
  }
];

export default function BlogPage() {
  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {BLOG_POSTS.map((post, index) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="group flex flex-col bg-[var(--card)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#3B82F6]/5 transition-all duration-300"
            >
              {/* Card Image Placeholder (Using gradients to keep it fast and clean) */}
              <div className={`h-48 w-full bg-gradient-to-br ${post.gradient} p-6 flex flex-col justify-end relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                <span className="relative z-10 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full self-start">
                  {post.category}
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
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  {/* Fake "Read More" button that animates on hover */}
                  <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6] transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </div>
  );
}