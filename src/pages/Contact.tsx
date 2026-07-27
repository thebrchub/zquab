import { useState } from 'react';
import { MessageSquarePlus, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<'feedback' | 'feature' | 'issue'>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Handle submission logic (e.g., fetch to your backend or email handler)
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen pt-32 pb-24 relative w-full bg-[var(--background)] z-20 border-none">
      <div className="mx-4 md:mx-8 lg:mx-12 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border-color)] shadow-sm text-[var(--text-main)] font-bold text-xs uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            Direct Line
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 text-[var(--text-main)] tracking-tight"
          >
            Help us shape <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500">zQuab.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg text-[var(--text-muted)] max-w-xl mx-auto"
          >
            Found a bug? Have an idea for a new feature? Or just want to share feedback? Send it directly to our team. We read everything.
          </motion.p>
        </div>

        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative p-8 md:p-12 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
        >
          {submitted ? (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 ring-1 ring-inset ring-green-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">Message received</h3>
              <p className="text-[var(--text-muted)] max-w-md mb-8">
                Thank you for helping us improve zQuab. Your input has been securely routed to our team.
              </p>
              <button
                onClick={() => { setSubmitted(false); setMessage(''); setEmail(''); }}
                className="px-6 py-3 rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold text-sm hover:border-[#3B82F6] transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Category selector pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  What is this regarding?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'feedback', label: 'General Feedback' },
                    { id: 'feature', label: 'Feature Request' },
                    { id: 'issue', label: 'Bug / Issue' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id as any)}
                      className={`py-3 px-4 rounded-2xl text-xs md:text-sm font-bold transition-all border ${
                        category === item.id 
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-lg shadow-blue-500/20' 
                          : 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Your Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'feature' 
                      ? "Tell us what feature you'd love to see next..." 
                      : category === 'issue' 
                      ? "Describe what went wrong so we can fix it..." 
                      : "Share your thoughts on your experience..."
                  }
                  className="w-full p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[#3B82F6] transition-colors resize-none text-base"
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Email <span className="font-normal opacity-70">(Optional — if you'd like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[#3B82F6] transition-colors text-base"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="group inline-flex items-center gap-3 bg-[#3B82F6] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  Submit Feedback
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </form>
          )}
        </motion.div>

      </div>
    </main>
  );
}