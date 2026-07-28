import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop'; 
import DevMenu from '../components/DevMenu';

export default function RootLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isChatPage = location.pathname === '/chat';

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
      
      {!isLandingPage && !isChatPage && <Footer />}

      <DevMenu />
   
    </div>
  );
}