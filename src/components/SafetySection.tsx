import { ShieldCheck, Flag, ShieldBan, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const safetyFeatures = [
  {
    Icon: Flag,
    title: "Easy Reporting",
    desc: "Flag inappropriate behavior with one click. We review it instantly.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/20",
    glow: "from-orange-500/20",
    borderHover: "hover:border-orange-500/50",
  },
  {
    Icon: ShieldBan,
    title: "Instant Blocking",
    desc: "Block users instantly to prevent reconnection. Your boundaries matter.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    glow: "from-red-500/20",
    borderHover: "hover:border-red-500/50",
  },
  {
    Icon: BookOpen,
    title: "Clear Guidelines",
    desc: "Strict community rules to keep chats friendly and respectful.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    glow: "from-blue-500/20",
    borderHover: "hover:border-blue-500/50",
  }
];

export default function SafetySection() {
  return (
    <section className="py-24 relative w-full bg-[var(--background)] z-20 border-none">
      <div className="mx-4 md:mx-8 lg:mx-12">
        
        {/* Header Section */}
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-6">
            <ShieldCheck className="w-4 h-4" />
            Your Safety is Priority
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--text-main)] tracking-tight">
            Anonymous, but <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">never unmoderated.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            We believe in the magic of meeting strangers, but we also believe in feeling completely secure. Our straightforward moderation tools ensure you are always in control.
          </p>

          <Link 
            to="/safety" 
            className="group inline-flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-[var(--text-main)] hover:text-[#3B82F6] transition-colors"
          >
            Read our full safety policy 
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* Premium Complex Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
          {safetyFeatures.map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
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