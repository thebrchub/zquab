import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex w-full my-2">
      <div className="bg-[#1a1a1a] border border-[var(--border-color)] px-4 py-3.5 rounded-[1.25rem] rounded-tl-sm flex items-center gap-1.5 shadow-sm w-fit">
        <motion.div 
          className="w-2 h-2 bg-gray-400 rounded-full" 
          animate={{ y: [0, -4, 0] }} 
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }} 
        />
        <motion.div 
          className="w-2 h-2 bg-gray-400 rounded-full" 
          animate={{ y: [0, -4, 0] }} 
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} 
        />
        <motion.div 
          className="w-2 h-2 bg-gray-400 rounded-full" 
          animate={{ y: [0, -4, 0] }} 
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} 
        />
      </div>
    </div>
  );
}