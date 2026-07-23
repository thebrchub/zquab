import { motion } from 'framer-motion';

interface Props {
  title: string;
  description: string;
  image: string; // Swapped icon for image path
  delay?: number;
}

export default function FeatureCard({ title, description, image, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="bg-[var(--card)] p-2.5 rounded-[2rem] shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all border border-[var(--border-color)] flex flex-col h-full"
    >
      {/* Increased height to h-64 and added object-cover image */}
      <div className="w-full h-64 rounded-[1.5rem] overflow-hidden mb-5 border border-[var(--border-color)]/50 bg-[var(--background)]">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>

      {/* Content Area */}
      <div className="px-4 pb-4 flex-1 flex flex-col">
        
        <div className="flex justify-between items-start mb-3 gap-4">
          <h3 className="text-xl font-bold text-[var(--text-main)] leading-tight">
            {title}
          </h3>
          <span className="bg-[#111827] dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            Free
          </span>
        </div>

        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 flex-1">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 mt-auto">
          <span className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            Core Feature
          </span>
          <span className="bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            No Setup
          </span>
        </div>
        
      </div>
    </motion.div>
  );
}