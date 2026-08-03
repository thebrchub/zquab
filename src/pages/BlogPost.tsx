import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { blogsApi, type Blog } from '../api/blogs';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await blogsApi.getBlogBySlug(slug);
        setBlog(data);
      } catch (err: any) {
        console.error('Failed to fetch blog post:', err);
        setError(err.response?.data?.error || 'Failed to load article.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Draft';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-[var(--card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Article Not Found</h2>
          <p className="text-[var(--text-muted)] mb-6">{error || 'This article may have been removed or does not exist.'}</p>
          <button 
            onClick={() => navigate('/blog')}
            className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white w-full py-3 rounded-xl font-bold transition-all"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[var(--background)] py-8 md:py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[#3B82F6] font-bold transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to all articles
        </button>

        {/* Article Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-main)] tracking-tight leading-tight mb-6">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm md:text-base font-medium text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
                {blog.author.charAt(0).toUpperCase()}
              </div>
              {blog.author}
            </span>
            <div className="w-1 h-1 rounded-full bg-[var(--border-color)]"></div>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(blog.publishedAt)}
            </span>
            <div className="w-1 h-1 rounded-full bg-[var(--border-color)]"></div>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {blog.readingTime} min read
            </span>
          </div>
        </header>

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-12 border border-[var(--border-color)] bg-[var(--card)]">
            <img 
              src={blog.coverImage} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Markdown Content */}
        <article className="
          [&>p]:text-[var(--text-muted)] [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-lg
          [&>h1]:text-[var(--text-main)] [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:mt-12 [&>h1]:tracking-tight
          [&>h2]:text-[var(--text-main)] [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-10 [&>h2]:tracking-tight
          [&>h3]:text-[var(--text-main)] [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-8
          [&>ul]:text-[var(--text-muted)] [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>ul]:text-lg
          [&>ol]:text-[var(--text-muted)] [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2 [&>ol]:text-lg
          [&>blockquote]:border-l-4 [&>blockquote]:border-[#3B82F6] [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-[var(--text-muted)] [&>blockquote]:mb-6 [&>blockquote]:py-1
          [&>a]:text-[#3B82F6] [&>a]:hover:underline [&>a]:font-medium
          [&>strong]:text-[var(--text-main)] [&>strong]:font-bold
          [&>hr]:border-[var(--border-color)] [&>hr]:my-10
          [&>pre]:bg-[var(--card)] [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:mb-6 [&>pre]:border [&>pre]:border-[var(--border-color)]
          [&>code]:text-[var(--text-main)] [&>code]:bg-[var(--card)] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-sm
        ">
          <ReactMarkdown>
            {blog.content || ''}
          </ReactMarkdown>
        </article>

      </motion.div>
    </div>
  );
}