import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';

export default function Hero() {
  const { theme } = useTheme(); 
  
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartChatting = async () => {
    if (user) {
      navigate('/chat');
      return;
    }

    setLoading(true);
    try {
      await loginAsGuest();
      navigate('/chat'); 
    } catch (err) {
      console.error('Failed to authenticate:', err);
      alert('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative pt-8 pb-16 w-full">
      
      <div className="relative mx-4 md:mx-8 lg:mx-12 rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/40 bg-[var(--background)]">
        
        {theme === 'light' ? (
          <img 
            src="/hero-w.webp" 
            alt="Background Waves Light" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <img 
            src="/hero-d.webp" 
            alt="Background Waves Dark" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}
        
        <div className="relative z-10 px-6 py-12 sm:px-12 lg:px-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)]/80 backdrop-blur-sm text-sm font-medium text-[var(--text-main)] mb-8 border border-[var(--border-color)]">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
                zQuab v1.0 is live
              </div>
              
              {/* 🛠️ ADDED: text-center md:text-left */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-[var(--text-main)] text-center md:text-left">
                Meet someone <br />
                <span className="text-[#3B82F6]">new in seconds.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-2xl leading-relaxed">
                Chat instantly with strangers around the world. No signup. No downloads. Just pure, unfiltered conversation wrapped in a premium experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                
                <button 
                  onClick={handleStartChatting}
                  disabled={loading}
                  className="group flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? 'Connecting...' : 'Start Chatting'}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>

                <button className="flex items-center justify-center gap-2 bg-[var(--card)]/80 backdrop-blur-sm hover:bg-[var(--card)] text-[var(--text-main)] border border-[var(--border-color)] px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 active:scale-[0.98]">
                  View Features
                </button>
              </div>
            </motion.div>

            {/* Right Hero Visual - The Chat Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5 hidden lg:block relative"
            >
              <div className="relative rounded-2xl bg-[var(--card)] border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">
                
                {/* Mock Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--background)] border-b border-[var(--border-color)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                  </div>
                  <div className="mx-auto flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    zQuab Preview
                  </div>
                </div>
                
                {/* Mock Body */}
                <div className="p-5 space-y-6 h-[340px] bg-[var(--card)] relative flex flex-col">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-2 mb-2"
                  >
                    Stranger Connected
                  </motion.div>

                  {/* Left Message */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="flex justify-start gap-3 w-full"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" 
                      alt="Stranger Avatar" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--border-color)]"
                    />
                    <div className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-medium max-w-[75%]">
                      Hey! How's your day going?
                    </div>
                  </motion.div>

                  {/* Right Message */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 2.5 }}
                    className="flex justify-end gap-3 w-full"
                  >
                    <div className="bg-[#3B82F6] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium max-w-[75%]">
                      Pretty great! Just listening to some music 🎧
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" 
                      alt="Your Avatar" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#3B82F6]"
                    />
                  </motion.div>
                  
                  {/* Typing Indicator */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4 }}
                    className="flex justify-start gap-3 absolute bottom-6 left-0 w-full px-5"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" 
                      alt="Stranger Avatar" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--border-color)]"
                    />
                    <div className="bg-[var(--background)] border border-[var(--border-color)] px-4 py-3.5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></motion.div>
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></motion.div>
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}