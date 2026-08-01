import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Loader2 } from 'lucide-react';

// Route-level code splitting — each page is only fetched when its route is
// actually visited, instead of every page bundling into the initial load.
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
            <Suspense fallback={<RouteFallback />}>
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
                {/* Public search & profile views — backend allows anonymous/guest
                    access to both search and individual profiles (reduced payload,
                    no friend_request_status for anon); SearchPage/UserProfile handle
                    permissions themselves, no auth guard needed. */}
                <Route path="/search" element={<SearchPage />} />
                <Route path="/user/:username" element={<UserProfile />} />

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
            </Suspense>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;