import { useState } from 'react';
import { 
  Globe, Heart, Shield, MessageCircle, 
  UserX, Zap, Lock, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

const faqs = [
  {
    question: "Do I need to register to use zQuab?",
    answer: "Not at all. We believe in reducing friction. You can jump into a random chat room instantly without ever handing over your email or creating a password. Accounts are completely optional and only exist if you want to save specific preferences."
  },
  {
    question: "Is this platform really free?",
    answer: "Yes. Connecting with other human beings shouldn't be locked behind a paywall. zQuab is entirely free to use for standard anonymous text chatting."
  },
  {
    question: "Why can't I share live video?",
    answer: "We intentionally designed zQuab to strip away the physical judgments associated with video chat. A text-first approach brings back the magic of everyday conversation where ideas and personality shine first. It also keeps our servers lightning-fast across all devices."
  },
  {
    question: "Is my chat data safe?",
    answer: "Absolutely. We do not permanently store your chat logs or personal information. Once a session ends, the digital footprint of that conversation vanishes. We recommend reading our Privacy Policy for the full technical breakdown."
  },
  {
    question: "How do you handle moderation and safety?",
    answer: "While we value anonymity, we do not tolerate abuse. We employ automated systems to block spam, illicit content, and severe harassment. If someone breaks the community rules, they will be banned. We want this to feel like a friendly chat in a local café."
  }
];

const rules = [
  "No begging for money or financial scams.",
  "No promoting external links or businesses.",
  "Zero tolerance for bullying, harassment, or hate speech.",
  "Treat strangers with the same respect you expect in return."
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="min-h-[100dvh] pt-20 pb-24 relative w-full bg-[var(--background)] z-20 font-sans">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
        
        {/* --- HERO SECTION --- */}
        <div className="max-w-5xl mx-auto text-center mb-24 mt-12">
          {/* <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border-color)] shadow-sm text-[var(--text-main)] font-bold text-xs uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            About zQuab
          </motion.div> */}
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-[var(--text-main)] tracking-tight leading-tight"
          >
            Reclaiming the lost art of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-cyan-400">
              spontaneous dialogue.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-3xl mx-auto mb-10"
          >
            The internet used to be a place of serendipitous discovery. zQuab strips away the performance metrics, algorithms, and friction of modern social networks, giving you a clean window to talk to someone entirely new.
          </motion.p>

          <motion.button
            onClick={() => navigate('/chat')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/25 transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-lg">Chat with a Stranger</span>
          </motion.button>
        </div>

        {/* --- 3 VALUE PILLARS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 w-full mb-32">
          {values.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="p-8 md:p-10 rounded-[2rem] bg-[var(--card)] border border-[var(--border-color)] flex flex-col items-start hover:border-[#3B82F6]/50 transition-colors"
            >
              <div className="p-4 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] mb-6 border border-[#3B82F6]/20">
                <item.icon className="w-7 h-7" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-3 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed text-base">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* --- OUR STORY & VISION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-main)] tracking-tight leading-tight">
              Strangers are just friends you haven't met yet.
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed text-lg">
              We built this platform because we noticed a massive gap in modern social media. Today, you mostly interact with people you already know, or you shout into a void hoping an algorithm picks you up. 
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed text-lg">
              zQuab aims to fix that. Whether you want to discuss a dilemma completely honestly with a neutral third party, meet people from across the globe, or just practice your conversational skills—we provide the safest, fastest environment to do it. No profiles to judge, just voices to hear.
            </p>
            <div className="pt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)] bg-[var(--card)] border border-[var(--border-color)] px-5 py-3 rounded-xl">
                <UserX className="w-5 h-5 text-[#3B82F6]" /> Anonymous
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)] bg-[var(--card)] border border-[var(--border-color)] px-5 py-3 rounded-xl">
                <Lock className="w-5 h-5 text-emerald-500" /> Secure
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)] bg-[var(--card)] border border-[var(--border-color)] px-5 py-3 rounded-xl">
                <Zap className="w-5 h-5 text-amber-500" /> Instant
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[var(--card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border-color)] shadow-2xl"
          >
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-6">Community Guidelines</h3>
            <p className="text-[var(--text-muted)] mb-8 text-lg">
              To keep zQuab an incredible place to chat, we ask our users to treat everyone with the same respect they would in real life.
            </p>
            <ul className="space-y-5">
              {rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-4 text-[var(--text-main)]">
                  <CheckCircle2 className="w-6 h-6 text-[#3B82F6] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{rule}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* --- FAQ SECTION --- */}
        <div className="max-w-5xl mx-auto mb-32 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-[var(--text-muted)] text-lg">Everything you need to know about how zQuab works.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[var(--card)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-[#3B82F6]/50 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                >
                  <span className="font-bold text-lg md:text-xl text-[var(--text-main)] pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-6 h-6 text-[#3B82F6] shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-6 md:p-8 pt-0 text-[var(--text-muted)] text-lg leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- BOTTOM CTA --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-5xl mx-auto bg-[#3B82F6] rounded-[2rem] p-10 md:p-16 text-center text-white relative overflow-hidden"
        >
          {/* Subtle Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Ready to meet someone new?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users connecting right now. No signup required. Completely anonymous.
            </p>
            <motion.button
              onClick={() => navigate('/chat')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--card)] text-[var(--text-main)] font-bold rounded-full shadow-xl transition-transform"
            >
              <MessageCircle className="w-6 h-6 text-[#3B82F6]" />
              <span className="text-lg">Start a Conversation</span>
            </motion.button>
          </div>
        </motion.div>

      </div>
    </main>
  );
}