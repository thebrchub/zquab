import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';

interface AuthUser {
  user_id: string;
  is_guest: boolean;
  username?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginAsGuest = async () => {
    try {
      const response = await apiClient.post('/auth/guest');
      setUser(response.data as AuthUser);
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // The Magic: Restore session on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Attempt to fetch the full user profile using the existing cookie
        const response = await apiClient.get('/users/me');
        const userData = response.data;
        
        // Map backend response to our AuthUser state
        setUser({
          user_id: userData.id,
          is_guest: false,
          username: userData.username,
          name: userData.name,
          avatar_url: userData.avatar_url,
        });
      } catch (error: any) {
        // If it throws a 401 (Unauthorized) or 403 (Forbidden - Guest Token),
        // it means there is no active full account session.
        console.log('No active full user session found on load.');
        setUser(null);
      } finally {
        // Stop the loading spinner and render the app
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};