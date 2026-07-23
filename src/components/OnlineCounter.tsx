import { motion } from 'framer-motion';

export default function OnlineCounter() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-3 mt-10 px-5 py-2.5 rounded-full glass inline-flex border border-[var(--border-color)]"
    >
      <div className="relative flex items-center justify-center w-3 h-3">
        <div className="absolute w-full h-full bg-[#22C55E] rounded-full animate-ping opacity-75" />
        <div className="relative w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_8px_#22C55E]" />
      </div>
      <span className="text-sm font-medium text-[var(--text-muted)]">
        <strong className="text-[var(--text-main)] font-semibold">1,248</strong> people online
      </span>
    </motion.div>
  );
}