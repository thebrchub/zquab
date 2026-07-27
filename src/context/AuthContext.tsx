import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../api/client';

interface AuthUser {
  user_id: string;
  is_guest: boolean;
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

  // Hits the backend to mint a new guest identity, or reuses the existing cookie.
  const loginAsGuest = async () => {
    try {
      // Remove <AuthUser> here
      const response = await apiClient.post('/auth/guest');
      
      // And cast the data as AuthUser here instead!
      setUser(response.data as AuthUser);
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  };

  // Clears the cookies on the backend and resets local state
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    // This stops the app from rendering private routes until we verify 
    // if the user is already authenticated (logic can be expanded later).
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access across the app
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};