import { Globe, Heart, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const values = [
  {
    icon: Globe,
    title: "Global Reach, Local Presence",
    description: "Bridging geographical divides in milliseconds. Connect with diverse perspectives from every corner of the planet instantly."
  },
  {
    icon: Heart,
    title: "Pure Human Element",
    description: "No algorithms feeding you curated echo chambers. Just raw, unpredictable, and authentic human-to-human conversation."
  },
  {
    icon: Shield,
    title: "Privacy First Architecture",
    description: "Designed from the ground up to respect your digital footprint. No unnecessary tracking, no public profiles, and total ephemerality."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 relative w-full bg-[var(--background)] z-20 overflow-hidden">
      <div className="mx-4 md:mx-8 lg:mx-12">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border-color)] shadow-sm text-[var(--text-main)] font-bold text-xs uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            About zQuab
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--text-main)] tracking-tight"
          >
            Reclaiming the lost art of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500">spontaneous dialogue.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed"
          >
            The internet used to be a place of serendipitous discovery. zQuab was built to strip away the performance metrics, algorithms, and friction of modern social networks, giving you a clean window to talk to someone new.
          </motion.p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 max-w-6xl mx-auto">
          {values.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
              className="p-8 md:p-10 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 flex flex-col items-start"
            >
              <div className="p-4 rounded-2xl bg-blue-500/10 text-[#3B82F6] mb-6 ring-1 ring-inset ring-blue-500/20">
                <item.icon className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-3 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}