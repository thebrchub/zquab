import { Shield, Flag, ShieldBan, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Safety() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="w-16 h-16 bg-blue-500/10 text-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--text-main)]">Trust & Safety</h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
          We built zQuab to be a fun, spontaneous way to meet people. Here is how we keep the community clean and safe for everyone.
        </p>
      </motion.div>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-3xl border border-[var(--border-color)]">
          <h2 className="text-2xl font-bold mb-6 text-[var(--text-main)] flex items-center gap-3">
            <Heart className="w-6 h-6 text-[#3B82F6]" />
            Community Guidelines
          </h2>
          <ul className="space-y-4 text-[var(--text-muted)]">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-2 flex-shrink-0" />
              <p><strong className="text-[var(--text-main)]">Be Respectful:</strong> Treat the person on the other side of the screen like a human being. Harassment, hate speech, and bullying are strictly prohibited.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-2 flex-shrink-0" />
              <p><strong className="text-[var(--text-main)]">Keep it Clean:</strong> No explicit content, unwanted sexual advances, or sharing of illicit materials.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-2 flex-shrink-0" />
              <p><strong className="text-[var(--text-main)]">Protect Privacy:</strong> Do not share your personal information (like your real name, address, or financial details), and never ask others for theirs.</p>
            </li>
          </ul>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-8 rounded-3xl border border-[var(--border-color)]">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6">
              <Flag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-main)]">Reporting</h3>
            <p className="text-[var(--text-muted)]">
              If someone makes you uncomfortable, use the Report button in the chat menu. Our moderation system reviews flagged behavior to remove bad actors from the platform.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-8 rounded-3xl border border-[var(--border-color)]">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6">
              <ShieldBan className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-main)]">Blocking</h3>
            <p className="text-[var(--text-muted)]">
              You are always in control. Hitting the Block button immediately ends the conversation and ensures you will never be matched with that specific user again.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}