import { useState, useEffect, createContext, useContext } from 'react';

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
  login: (email: string, password: string, preserveLocation?: boolean) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }, preserveLocation?: boolean) => Promise<void>;
  logout: (preserveLocation?: boolean) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
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
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(authToken);
      } else {
        // Token is invalid
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, preserveLocation = true) => {
    // Store current location before login
    if (preserveLocation) {
      localStorage.setItem('auth_return_path', window.location.pathname + window.location.search);
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);

    // Restore location after successful login
    if (preserveLocation) {
      const returnPath = localStorage.getItem('auth_return_path');
      if (returnPath && returnPath !== '/login') {
        localStorage.removeItem('auth_return_path');
        // Use pushState to navigate without reload
        setTimeout(() => {
          window.history.pushState({}, '', returnPath);
          // Trigger a custom event to notify components of the location change
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 50);
      }
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }, preserveLocation = true) => {
    // Store current location before registration
    if (preserveLocation) {
      localStorage.setItem('auth_return_path', window.location.pathname + window.location.search);
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);

    // Restore location after successful registration
    if (preserveLocation) {
      const returnPath = localStorage.getItem('auth_return_path');
      if (returnPath && returnPath !== '/register') {
        localStorage.removeItem('auth_return_path');
        // Use pushState to navigate without reload
        setTimeout(() => {
          window.history.pushState({}, '', returnPath);
          // Trigger a custom event to notify components of the location change
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 50);
      }
    }
  };

  const logout = (preserveLocation = true) => {
    // Store current location before logout
    if (preserveLocation) {
      localStorage.setItem('auth_return_path', window.location.pathname + window.location.search);
    }

    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);

    // Restore location after logout
    if (preserveLocation) {
      const returnPath = localStorage.getItem('auth_return_path');
      if (returnPath) {
        localStorage.removeItem('auth_return_path');
        // Use pushState to navigate without reload
        setTimeout(() => {
          window.history.pushState({}, '', returnPath);
          // Trigger a custom event to notify components of the location change
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 50);
      }
    }
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

export { AuthContext };