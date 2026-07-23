import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full pb-8 pt-12 bg-transparent">
      {/* Fluid margins matching the Hero and CTA sections */}
      <div className="mx-4 md:mx-8 lg:mx-12">
        
        {/* Box Container */}
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--card)] border border-[var(--border-color)] shadow-xl shadow-black/5 dark:shadow-black/20 pt-16 px-8 sm:px-12 lg:px-16 flex flex-col">
          
          {/* Top Content: Logo, Description, Links */}
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-8">
            
            {/* Left side: Brand Identity */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link to="/" className="flex items-center gap-3 mb-5 group">
                <img 
                  src="/logo.png" 
                  alt="zQuab Logo" 
                  className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="font-bold text-2xl tracking-tight text-[var(--text-main)]">
                  zQuab
                </span>
              </Link>
              <p className="text-[var(--text-muted)] text-sm max-w-xs mb-6 leading-relaxed">
                Connect with random people worldwide in milliseconds. Pure, unfiltered conversation. No signup required.
              </p>
              <p className="text-xs text-[var(--text-muted)]/60 font-bold uppercase tracking-widest">
                &copy; {currentYear} zQuab. All rights reserved.
              </p>
            </div>

            {/* Right side: Nav Links */}
            <div className="flex flex-wrap justify-center lg:justify-end gap-x-8 gap-y-4 text-sm font-bold tracking-wide uppercase text-[var(--text-muted)]">
              <Link to="/about" className="hover:text-[#3B82F6] transition-colors">About</Link>
              <Link to="/safety" className="hover:text-[#3B82F6] transition-colors">Safety</Link>
              <Link to="/privacy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[#3B82F6] transition-colors">Terms</Link>
              <a href="mailto:hello@zquab.com" className="hover:text-[#3B82F6] transition-colors">Contact</a>
            </div>
            
          </div>

          {/* Faded Giant Block Name at the Bottom */}
          <div className="w-full flex justify-center pointer-events-none select-none translate-y-[22%]">
            <span className="text-[22vw] font-black leading-none tracking-tighter text-[var(--text-main)] opacity-[0.03] dark:opacity-[0.02]">
              zQuab
            </span>
          </div>
          
        </div>
      </div>
    </footer>
  );
}