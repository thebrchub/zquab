import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react'; // 🛠️ Removed the Map icon

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100dvh-80px)] p-4 md:p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
       
      >
       
        <div className="relative z-10">
          
          {/* 🛠️ Replaced Map icon with your custom zQuab Logo */}
          <div className=" rounded-full flex items-center justify-center mx-auto mb-6  overflow-hidden">
            <img 
              src="/logo.png" 
              alt="zQuab Logo" 
              className="w-32 h-32 object-contain hover:scale-110 transition-transform duration-300" 
            />
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-[var(--text-main)] mb-2 tracking-tighter drop-shadow-sm">
            404
          </h1>
          
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-main)] mb-3">
            Dude, you look lost!
          </h2>
          
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed text-sm md:text-base">
            There is no such page with us. The link might be broken, or the page may have been removed. Let's get you back to familiar territory.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl font-bold hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            <Link 
              to="/"
              className="flex-1 py-3.5 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Home className="w-5 h-5" />
              Home Page
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}