import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react'; // 🛠️ ADDED: useEffect
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { RoomsProvider } from './context/RoomsContext';
import { Loader2 } from 'lucide-react';
import BlogPost from './pages/BlogPost';

// Route-level code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Safety = lazy(() => import('./pages/Safety'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Protected App Pages
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[var(--background)]">
      <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
    </div>
  );
}

// 1. Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }
  
  if (!user || user.is_guest) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.username) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

// 2. Auth Route Wrapper
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (user && !user.is_guest) {
    if (!user.username) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

// 3. Onboarding Route Wrapper
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user || user.is_guest) return <Navigate to="/auth" replace />;
  if (user.username) return <Navigate to="/home" replace />;
  
  return <>{children}</>;
}

// 🛠️ NEW: Global Tab Blinker Hook
// This runs in the background and only activates if the user is on another tab
function useTabBlinker() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const originalTitle = document.title;
    let isBlinking = false;

    const startBlinking = (e: any) => {
      // document.hidden ensures it ONLY blinks if they are not actively looking at the site
      if (document.hidden && !isBlinking) {
        isBlinking = true;
        const message = e.detail?.message || 'New Message! 💬';
        let toggle = false;
        
        interval = setInterval(() => {
          document.title = toggle ? message : originalTitle;
          toggle = !toggle;
        }, 1000);
      }
    };

    const stopBlinking = () => {
      if (isBlinking) {
        isBlinking = false;
        if (interval) clearInterval(interval);
        document.title = originalTitle;
      }
    };

    // Listen for our custom zQuab event
    window.addEventListener('zquab_notification', startBlinking);
    
    // Stop blinking immediately when they come back to the tab
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) stopBlinking();
    });
    window.addEventListener('focus', stopBlinking);

    return () => {
      window.removeEventListener('zquab_notification', startBlinking);
      window.removeEventListener('visibilitychange', stopBlinking);
      window.removeEventListener('focus', stopBlinking);
      if (interval) clearInterval(interval);
      document.title = originalTitle;
    };
  }, []);
}

function App() {
  // 🛠️ ACTIVATE THE GLOBAL HOOK HERE
  useTabBlinker();

  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <RoomsProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<RootLayout />}>
                
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route element={<BlogPost />} path="/blog/:slug" />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/user/:username" element={<UserProfile />} />

                {/* Auth Route */}
                <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />

                {/* Onboarding Route */}
                <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

                {/* Protected Dashboard & Social Routes */}
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFoundPage />} />
                
              </Route>

              {/* DEV UI TESTING ROUTES */}
              <Route path="/dev/onboarding" element={<OnboardingPage />} />
              <Route path="/dev/auth" element={<AuthPage />} />
              <Route path="/dev/home" element={<HomePage />} />
              <Route path="/dev/chat" element={<ChatRoom />} />
              <Route path="/dev/profile" element={<Profile />} />

            </Routes>
            </Suspense>
          </BrowserRouter>
          </RoomsProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;