import { Zap, Fingerprint, Waves, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const philosophyFeatures = [
  {
    Icon: Zap,
    title: "Instant Immersion",
    desc: "Skip the setup and drop directly into an active conversation. The engine is optimized to connect you with someone new in milliseconds.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    glow: "from-blue-500/20",
    borderHover: "hover:border-blue-500/50",
  },
  {
    Icon: Fingerprint,
    title: "Identity Optional",
    desc: "Engage strictly on your own terms. We care about the exchange of ideas, not follower counts, public timelines, or curated personas.",
    color: "text-zinc-600 dark:text-zinc-300",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-500/20",
    glow: "from-zinc-500/20",
    borderHover: "hover:border-zinc-500/50",
  },
  {
    Icon: Waves,
    title: "Dynamic Pairing",
    desc: "A seamless conversational flow. Our routing system works quietly in the background to match you with your next connection the moment you are ready.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    ring: "ring-indigo-500/20",
    glow: "from-indigo-500/20",
    borderHover: "hover:border-indigo-500/50",
  }
];

export default function PhilosophySection() {
  return (
    <section className="py-24 md:py-32 relative w-full bg-[var(--background)] z-20 border-none">
      <div className="mx-4 md:mx-8 lg:mx-12">
        
        {/* Header Section */}
        <div className="text-center mb-24 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border-color)] shadow-sm text-[var(--text-main)] font-bold text-xs uppercase tracking-widest mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            The zQuab Philosophy
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-[var(--text-main)] tracking-tight leading-[1.1] max-w-4xl"
          >
            Engineered for dialogue. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500">
              Stripped of the noise.
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Modern platforms turned talking into a performance. We’re bringing it back to reality. By removing public metrics and static profiles, we’ve created a minimalist environment focused entirely on authentic, one-to-one human interaction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              to="/about" 
              className="group inline-flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-[var(--text-main)] hover:text-[#3B82F6] transition-colors"
            >
              Discover how it works
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </motion.div>
        </div>

        {/* Premium Complex Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
          {philosophyFeatures.map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 + 0.2, duration: 0.5 }}
              className="relative group"
            >
              {/* Outer Glow Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem] blur-xl pointer-events-none`} />

              {/* Main Card Container */}
              <div className={`relative h-full p-8 md:p-10 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border-color)] ${feat.borderHover} shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden flex flex-col z-10 transition-colors duration-500`}>
                
                {/* 1. Dot Matrix Background Pattern */}
                <div 
                  className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.3] dark:group-hover:opacity-[0.15]" 
                  style={{ 
                    backgroundImage: 'radial-gradient(circle at center, var(--text-muted) 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                  }} 
                />

                {/* 2. Top-Right Corner Mesh Gradient Bloom */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-bl ${feat.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl`} />

                {/* 3. Giant Watermark Icon */}
                <feat.Icon 
                  className={`absolute -bottom-8 -right-8 w-64 h-64 ${feat.color} opacity-[0.02] dark:opacity-[0.03] group-hover:opacity-[0.05] dark:group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none -rotate-12`} 
                  strokeWidth={1}
                />

                {/* Top: Premium Icon Badge */}
                <div className="relative z-10 mb-16">
                  <div className={`inline-flex p-4 rounded-2xl ${feat.bg} ${feat.color} ring-1 ring-inset ${feat.ring} shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out backdrop-blur-md`}>
                    <feat.Icon className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                </div>
                
                {/* Bottom: Architectural Typography Layout */}
                <div className="relative z-10 mt-auto">
                  {/* Subtle Gradient Divider */}
                  <div className="h-px w-12 bg-gradient-to-r from-[var(--text-muted)]/50 to-transparent mb-6" />
                  
                  <h4 className="text-2xl font-extrabold text-[var(--text-main)] mb-4 tracking-tight">
                    {feat.title}
                  </h4>
                  <p className="text-[var(--text-muted)] leading-relaxed text-base md:text-lg">
                    {feat.desc}
                  </p>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}