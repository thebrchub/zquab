import { useState } from 'react';
import { MessageSquarePlus, Send, CheckCircle2, Mail, Sparkles, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  categoryToTopic,
  nameFromEmail,
  sendContactEmail,
  type ContactCategory,
} from '../api/email';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<ContactCategory>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendContactEmail({
        name: nameFromEmail(email),
        email: email.trim(),
        message: message.trim(),
        topic: categoryToTopic(category),
        social_profile: socialHandle.trim() || undefined,
      });

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to send message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] w-full bg-[var(--background)] z-20 border-none relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 lg:pt-24 pb-24 flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
        
        {/* LEFT COLUMN: Typography & Context */}
        <div className="w-full lg:w-5/12 flex flex-col pt-4 lg:sticky lg:top-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-[var(--text-main)] tracking-tight leading-tight">
              Help us shape <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-indigo-500">zQuab.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--text-muted)] font-medium leading-relaxed mb-10">
              Found a bug? Have an idea for a new feature? Or just want to share feedback? Send it directly to our team. We read absolutely everything.
            </p>

            <div className="flex items-center gap-4 p-5 bg-[var(--card)] border border-[var(--border-color)] rounded-2xl w-fit shadow-sm">
               <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[#3B82F6]">
                 <Mail className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Prefer Email?</p>
                 <p className="text-sm font-bold text-[var(--text-main)]">info@zquab.com</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: The Form Card */}
        <div className="w-full lg:w-7/12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-6 sm:p-8 md:p-10 rounded-[2rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20"
          >
            {submitted ? (
              <div className="py-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 ring-1 ring-inset ring-green-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-[var(--text-main)] mb-3">Message received</h3>
                <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-10 text-lg">
                  Thank you for helping us improve zQuab. If your feature makes the cut, we'll be in touch!
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    setEmail('');
                    setSocialHandle('');
                    setError(null);
                  }}
                  className="px-8 py-4 rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] font-bold text-base hover:border-[#3B82F6] transition-colors active:scale-95 shadow-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                
                {/* Category selector pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
                    What is this regarding?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'feedback', label: 'General Feedback' },
                      { id: 'feature', label: 'Feature Request' },
                      { id: 'issue', label: 'Bug / Issue' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id as ContactCategory)}
                        className={`py-3.5 px-4 rounded-2xl text-sm font-bold transition-all border ${
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
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      category === 'feature' 
                        ? "Tell us what feature you'd love to see next..." 
                        : category === 'issue' 
                        ? "Describe what went wrong so we can fix it..." 
                        : "Share your thoughts on your experience..."
                    }
                    className="w-full p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[#3B82F6] transition-colors resize-none text-base leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 🛠️ Mandatory Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[#3B82F6] transition-colors text-base"
                    />
                  </div>

                  {/* 🛠️ NEW: Social Handle Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      Social Profile <span className="font-normal opacity-70">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon className="w-5 h-5 text-[var(--text-muted)]" />
                      </div>
                      <input
                        type="text"
                        value={socialHandle}
                        onChange={(e) => setSocialHandle(e.target.value)}
                        placeholder="LinkedIn or Instagram URL"
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[#3B82F6] transition-colors text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* 🛠️ NEW: Contributor Perks Banner */}
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 items-start">
                  <div className="bg-blue-500/20 p-2 rounded-full flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed font-medium">
                      <span className="font-bold text-[#3B82F6]">Become a Contributor!</span> If your suggested feature makes it into zQuab, we'll add you to our official Contributor's List and you'll unlock exclusive perks in future versions.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full sm:inline-flex items-center justify-center gap-3 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-60 disabled:hover:bg-[#3B82F6] disabled:hover:scale-100 text-white px-8 py-4 rounded-full font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageSquarePlus className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                    {!isSubmitting && (
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </div>

              </form>
            )}
          </motion.div>
        </div>

      </div>
    </main>
  );
}