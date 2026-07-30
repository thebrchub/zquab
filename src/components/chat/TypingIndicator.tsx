import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    // justify-start ensures it locks to the left exactly like an incoming message
    <div className="flex w-full my-2 justify-start">
      {/* 
        Using CSS variables for the background and border so it adapts to Light/Dark mode.
        opacity-80 makes the bubble itself sit slightly back in the visual hierarchy.
      */}
      <div className="bg-[var(--card)] border border-[var(--border-color)] px-4 py-4 rounded-[1.25rem] rounded-tl-sm flex items-center gap-1.5 shadow-sm w-fit opacity-80">
        <motion.div 
          className="w-2 h-2 bg-[var(--text-muted)] rounded-full" 
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} 
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0 }} 
        />
        <motion.div 
          className="w-2 h-2 bg-[var(--text-muted)] rounded-full" 
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} 
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} 
        />
        <motion.div 
          className="w-2 h-2 bg-[var(--text-muted)] rounded-full" 
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} 
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }} 
        />
      </div>
    </div>
  );
}