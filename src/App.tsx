import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Loader2 } from 'lucide-react';

// Public/Static Pages
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage'; // Anonymous random chat
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Safety from './pages/Safety';
import About from './pages/About';
import Contact from './pages/Contact';

// Protected App Pages
import HomePage from './pages/HomePage'; // Dashboard
import ChatRoom from './pages/ChatRoom'; // 1-on-1 DM chat
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import FriendsHub from './pages/FriendsHub';

// Protected Route Wrapper
// Ensures the user has an active guest/logged-in session before accessing internal pages
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
      </div>
    );
  }
  
  // If there is no user session, redirect to the landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              {/* RootLayout wraps everything to provide Navbar/Footer handling */}
              <Route element={<RootLayout />}>
                
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/contact" element={<Contact />} />

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
                  path="/user/:username" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/friends" 
                  element={
                    <ProtectedRoute>
                      <FriendsHub />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
                
              </Route>
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;