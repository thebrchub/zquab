import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface Props {
  message: string;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={twMerge("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div className={twMerge(
        "max-w-[75%] px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm",
        isOwn
          ? "bg-[#3B82F6] text-white rounded-br-sm"
          : "glass text-[var(--text-main)] rounded-bl-sm border border-[var(--border-color)]"
      )}>
        {message}
      </div>
    </motion.div>
  );
}