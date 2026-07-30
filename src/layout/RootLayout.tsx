import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop'; 
import DevMenu from '../components/DevMenu';


export default function RootLayout() {
  const location = useLocation();
  
  // 🛠️ Check if we are on pages that should NOT have a footer
  const isLandingPage = location.pathname === '/';
  
  // 🛠️ Use startsWith to catch /home, /chat, and /chat/12345
  const isAppInterface = location.pathname.startsWith('/home') || 
                         location.pathname.startsWith('/chat');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-main)] font-sans transition-colors duration-300">
      
      <ScrollToTop />
      
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      {/* Toast notifications positioned globally */}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
          },
        }} 
      />
      
      {/* 🛠️ Hide the footer on the landing page AND app interfaces */}
      {!isLandingPage && !isAppInterface && <Footer />}

      <DevMenu />
   
    </div>
  );
}