import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Loader2 } from 'lucide-react';

// Public/Static Pages
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import BlogPage from './pages/BlogPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Safety from './pages/Safety';
import About from './pages/About';
import Contact from './pages/Contact';

// Protected App Pages
import OnboardingPage from './pages/OnboardingPage'; 
import HomePage from './pages/HomePage';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';

// 1. Protected Route Wrapper (For standard logged-in pages)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }
  
  // If there is no session, OR the user is just a Guest, redirect them to Auth
  if (!user || user.is_guest) {
    return <Navigate to="/auth" replace />;
  }

  // If they are a registered user but haven't set a username yet, force onboarding
  if (!user.username) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

// 2. Auth Route Wrapper (Prevents logged-in users from seeing the login page)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (user && !user.is_guest) {
    // Direct to onboarding if profile is incomplete, otherwise to home
    if (!user.username) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

// 3. Onboarding Route Wrapper (Locks users here until profile is complete)
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;

  // Must be logged in via Google to see this page
  if (!user || user.is_guest) return <Navigate to="/auth" replace />;
  
  // If they already have a username, they don't need onboarding anymore
  if (user.username) return <Navigate to="/home" replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<RootLayout />}>
                
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/contact" element={<Contact />} />

                {/* Auth Route */}
                <Route 
                  path="/auth" 
                  element={
                    <AuthRoute>
                      <AuthPage />
                    </AuthRoute>
                  } 
                />

                {/* Onboarding Route */}
                <Route 
                  path="/onboarding" 
                  element={
                    <OnboardingRoute>
                      <OnboardingPage />
                    </OnboardingRoute>
                  } 
                />

                {/* Protected Dashboard & Social Routes */}
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat/:roomId" 
                  element={
                    <ProtectedRoute>
                      <ChatRoom />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/search" 
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 🛠️ FIX: The ONE and ONLY catch-all route, placed inside RootLayout! */}
                <Route path="*" element={<NotFoundPage />} />
                
              </Route>

              {/* 🛠️ DEV UI TESTING ROUTES (No Auth Wrappers) */}
              <Route path="/dev/onboarding" element={<OnboardingPage />} />
              <Route path="/dev/auth" element={<AuthPage />} />
              <Route path="/dev/home" element={<HomePage />} />
              <Route path="/dev/chat" element={<ChatRoom />} />
              <Route path="/dev/profile" element={<Profile />} />

            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;