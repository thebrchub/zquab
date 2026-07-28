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
  devMockLogin: () => void; 
  refreshSession: () => Promise<void>; // 🛠️ NEW: Expose this to your apps
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🛠️ NEW: Extracted this so it can be called from anywhere
  const refreshSession = async () => {
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data;
      
      setUser({
        user_id: userData.id,
        is_guest: false,
        username: userData.username,
        name: userData.name,
        avatar_url: userData.avatar_url,
      });
    } catch (error: any) {
      console.log('No active full user session found on load.');
      setUser(null);
    }
  };

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

  const devMockLogin = () => {
    setUser({
      user_id: 'dev_mock_999',
      is_guest: false,
      username: 'dev_ninja',
      name: 'Dev Ninja',
      avatar_url: ''
    });
  };

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsGuest, logout, devMockLogin, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};