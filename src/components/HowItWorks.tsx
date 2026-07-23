import { motion } from 'framer-motion';
import { MousePointerClick, Users, MessageSquare } from 'lucide-react';

const steps = [
  {
    step: "Step 01",
    title: "Click Start Chat",
    description: "No forms, no emails, no friction. Just click the button and you're in.",
    icon: <MousePointerClick className="w-7 h-7" />
  },
  {
    step: "Step 02",
    title: "Get Matched",
    description: "Our routing engine pairs you with someone across the globe in milliseconds.",
    icon: <Users className="w-7 h-7" />
  },
  {
    step: "Step 03",
    title: "Start Talking",
    description: "Say hi! Your conversation is completely private, secure, and anonymous.",
    icon: <MessageSquare className="w-7 h-7" />
  }
];

export default function HowItWorks() {
  return (
    // CRITICAL FIX: Removed `overflow-hidden` from this section so the SVG can bleed upwards
    <section className="py-30 relative bg-[var(--card)] border-none">
      
      {/* Top SVG Curve Section Divider */}
      {/* With overflow-hidden gone, top-[-2px] will now perfectly overlap the white section above */}
      <div className="absolute top-[-2px] left-0 w-full leading-none rotate-0 pointer-events-none z-20">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[40px] md:h-[60px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-[var(--background)]"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 md:pt-16">
        <div className="text-center mb-20 md:mb-28">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--text-main)] tracking-tight">
            How it works
          </h2>
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            Three steps. Zero complications. We engineered out the friction so you can focus strictly on the conversation.
          </p>
        </div>

        <div className="relative">
          
          {/* Horizontal Curved Dashed Path (Desktop Only) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-32 z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <path 
                d="M 166,50 C 333,250 333,-150 500,50 C 666,250 666,-150 833,50" 
                stroke="var(--border-color)" 
                strokeWidth="3" 
                fill="none" 
                strokeDasharray="12 12" 
                className="opacity-60 dark:opacity-40" 
              />
            </svg>
          </div>

          {/* Vertical Curved Dashed Path (Mobile Only) */}
          <div className="block md:hidden absolute top-[10%] bottom-[10%] left-[50%] w-32 -translate-x-1/2 z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 200 1000" preserveAspectRatio="none">
              <path 
                d="M 100,166 C 250,333 -50,333 100,500 C 250,666 -50,666 100,833" 
                stroke="var(--border-color)" 
                strokeWidth="3" 
                fill="none" 
                strokeDasharray="12 12" 
                className="opacity-60 dark:opacity-40" 
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-8 relative z-10">
            {steps.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center text-center"
              >
                
                {/* Premium Floating Icon Box */}
                <div className="relative w-24 h-24 mb-10 group">
                  <div className="absolute inset-0 bg-[#3B82F6]/20 rounded-[2rem] blur-xl transition-all duration-500 group-hover:bg-[#3B82F6]/40 group-hover:blur-2xl"></div>
                  
                  <div className="relative w-full h-full bg-[var(--background)] border border-[var(--border-color)] rounded-[2rem] shadow-xl flex items-center justify-center text-[#3B82F6] transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                    {item.icon}
                  </div>
                  
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#111827] dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap z-20">
                    {item.step}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 text-[var(--text-main)]">{item.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom SVG Curve Section Divider */}
      {/* Set to bottom-[-2px] as well so it perfectly transitions to the next section */}
      <div className="absolute bottom-[-2px] left-0 w-full rotate-180 leading-none pointer-events-none z-20">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[40px] md:h-[60px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-[var(--background)]"></path>
        </svg>
      </div>
    </section>
  );
}