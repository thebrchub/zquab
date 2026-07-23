import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CTAFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="relative w-full overflow-x-clip bg-transparent flex flex-col items-center">
      
      {/* =========================================
          1. EXACT CTA SECTION DESIGN
          ========================================= */}
      <div className="pt-24 pb-40 md:pt-32 md:pb-56 relative w-full bg-transparent overflow-x-clip overflow-y-visible flex flex-col items-center justify-center z-10">
        
        {/* Planetary Horizon Arc */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] min-w-[1600px] pointer-events-none z-0 translate-y-[65%] md:translate-y-[60%] opacity-90">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 1600 400" className="w-full h-auto drop-shadow-[0_-40px_80px_rgba(59,130,246,0.25)]">
              <defs>
                <linearGradient id="horizon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="20%" stopColor="#1e1b4b" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="80%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                <linearGradient id="rim-light" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="35%" stopColor="rgba(59,130,246,0.8)" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="65%" stopColor="rgba(59,130,246,0.8)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              <path
                d="M -200,400 Q 800,0 1800,400"
                fill="none"
                stroke="url(#horizon-grad)"
                strokeWidth="120"
              />

              <g transform="translate(0, -60)">
                <path
                  d="M -200,400 Q 800,0 1800,400"
                  fill="none"
                  stroke="url(#rim-light)"
                  strokeWidth="3"
                />
              </g>
            </svg>
          </motion.div>
        </div>

        {/* CTA Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-10 text-[var(--text-main)] tracking-tight leading-[1.1] drop-shadow-xl"
          >
            Ready to meet  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500"> someone?</span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link 
              to="/chat"
              className="group relative inline-flex items-center gap-3 bg-[#3B82F6] hover:bg-blue-600 text-white px-10 py-5 rounded-full font-bold text-lg md:text-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
            >
              Start Chatting Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

      </div>

      {/* =========================================
          2. THE BOXED FOOTER SECTION
          ========================================= */}
      <div className="w-full relative z-20 pb-8 pt-4 mx-auto px-4 md:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 pt-16 px-8 sm:px-12 lg:px-16 flex flex-col">
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-8">
            
            {/* Brand Logo & Info */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link to="/" className="flex items-center gap-3 mb-5 group">
                <img 
                  src="/logo.png" 
                  alt="zQuab Logo" 
                  className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="font-bold text-4xl tracking-tight text-[var(--text-main)]">
                  zQuab
                </span>
              </Link>
              <p className="text-[var(--text-muted)] text-sm max-w-xs mb-6 leading-relaxed">
                Connect with random people worldwide in milliseconds. Pure, unfiltered conversation. No signup required.
              </p>
              <p className="text-xs text-[var(--text-muted)]/60 font-bold uppercase tracking-widest">
                &copy; {currentYear} zQuab. All rights reserved.
              </p>
            </div>

            {/* Nav Links */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-x-8 gap-y-4 text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
              <Link to="/about" className="hover:text-[#3B82F6] transition-colors">About</Link>
              <Link to="/safety" className="hover:text-[#3B82F6] transition-colors">Safety</Link>
              <Link to="/privacy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[#3B82F6] transition-colors">Terms</Link>
              <a href="mailto:hello@zquab.com" className="hover:text-[#3B82F6] transition-colors">Contact</a>
            </div>
            
          </div>

          {/* Faded Giant Block Name */}
          <div className="w-full flex justify-center pointer-events-none select-none translate-y-[22%]">
            <span className="text-[22vw] font-black leading-none tracking-tighter text-[var(--text-main)] opacity-[0.03] dark:opacity-[0.02]">
              zQuab
            </span>
          </div>
          
        </div>
      </div>

    </section>
  );
}