import { ShieldCheck, Flag, ShieldBan, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const safetyFeatures = [
  {
    icon: <Flag className="w-6 h-6" />,
    title: "Easy Reporting",
    desc: "Flag inappropriate behavior with one click. We review it instantly.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    offset: "md:ml-0"
  },
  {
    icon: <ShieldBan className="w-6 h-6" />,
    title: "Instant Blocking",
    desc: "Block users instantly to prevent reconnection. Your boundaries matter.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    offset: "md:ml-12" // Staggers the middle card for a dynamic UI layout
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Clear Guidelines",
    desc: "Strict community rules to keep chats friendly and respectful.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    offset: "md:ml-0"
  }
];

export default function SafetySection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-[var(--background)]">
      
      {/* Eased out fluid margins to match Hero and Features */}
      <div className="mx-4 md:mx-8 lg:mx-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-widest mb-8">
              <ShieldCheck className="w-4 h-4" />
              Your Safety is Priority
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-[var(--text-main)] tracking-tight leading-[1.1]">
              Anonymous, but <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">never unmoderated.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-xl">
              We believe in the magic of meeting strangers, but we also believe in feeling completely secure. Our straightforward moderation tools ensure you are always in control of your experience. Don't like a vibe? Just skip or block.
            </p>
            
            <Link 
              to="/safety" 
              className="group inline-flex items-center gap-2 text-[var(--text-main)] font-semibold text-lg hover:text-[#3B82F6] transition-colors"
            >
              Read our full safety policy 
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </motion.div>

          {/* Right Content - Staggered Premium Cards */}
          <div className="relative flex flex-col gap-6">
            
            {/* Ambient Background Glow behind the cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-500/5 dark:bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            {safetyFeatures.map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`relative z-10 p-6 md:p-8 rounded-[2rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${feat.offset}`}
              >
                <div className="flex gap-5 md:gap-6 items-start">
                  <div className={`p-4 rounded-2xl ${feat.bg} ${feat.color} shrink-0`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[var(--text-main)] mb-2">{feat.title}</h4>
                    <p className="text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}