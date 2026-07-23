import { EyeOff, Lock, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 md:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 text-[var(--text-main)]">Privacy Policy</h1>
        <p className="text-[var(--text-muted)]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-8 rounded-3xl border border-[var(--border-color)] space-y-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <EyeOff className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Anonymous by Design</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                zQuab does not require you to create an account, provide an email address, or link any social media profiles. When you use our platform, you are completely anonymous to the strangers you chat with.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Lock className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Your Conversations</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Messages are transmitted securely. Once you disconnect from a chat, the conversation is wiped from our active servers. We do not store chat histories for long-term data mining or advertising purposes.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Server className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Data We Collect</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                To keep the platform running and enforce safety rules, we collect minimal technical data such as IP addresses (to handle blocking and bans) and generalized connection analytics (to show online user counts). We do not sell this data to third parties.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}