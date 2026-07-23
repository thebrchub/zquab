import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto glass rounded-3xl p-12 text-center relative overflow-hidden border border-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        
        <h2 className="text-4xl font-bold mb-6 text-[var(--text-main)] relative z-10">
          Ready to meet someone?
        </h2>
        
        <Link 
          to="/chat"
          className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-10 py-5 rounded-full font-bold text-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 relative z-10"
        >
          Start Chatting
          <ArrowRight className="w-6 h-6" />
        </Link>
      </div>
    </section>
  );
}