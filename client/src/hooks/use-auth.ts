import { useState, useEffect, createContext, useContext } from 'react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { registerPushOnLogin } from '@/lib/pwa';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  rating: string | null;
  reviewCount: number | null;
  phone: string | null;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    phone?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth called outside of AuthProvider context');
    // Return a safe default instead of throwing
    return {
      user: null,
      token: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      isLoading: false,
    };
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user info
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      console.log('Verifying token...');
      // Temporarily set token in localStorage for apiRequest to use
      const existingToken = localStorage.getItem('auth_token');
      if (!existingToken) {
        localStorage.setItem('auth_token', authToken);
      }
      
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      console.log('Token verification successful');
      setUser(data.user);
      setToken(authToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't crash the app, just clear auth state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    // Register push notifications after successful login
    setTimeout(async () => {
      console.log('🔔 Triggering push notification registration after login...');
      try {
        const success = await registerPushOnLogin();
        console.log('🔔 Push notification registration result:', success);
      } catch (error) {
        console.error('🔔 Push notification registration error:', error);
      }
    }, 2000);
    
    // Clear React Query cache to avoid stale data from previous user
    queryClient.clear();
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    phone?: string;
    phoneVerified?: boolean;
  }) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    // Clear React Query cache for fresh user data
    queryClient.clear();
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    
    // Clear React Query cache to remove all user-specific data
    queryClient.clear();
  };

  return {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };
}