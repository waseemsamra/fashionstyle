// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { authService, type User, type AuthResponse } from '@/services/authService';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from localStorage on init
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔐 Login attempt for:', email);
      
      const data: AuthResponse = await authService.login(email, password);
      
      // Store tokens and user
      localStorage.setItem('jwt_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_email', data.user.email);
      
      setUser(data.user);
      console.log('✅ Login successful:', data.user.email);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📝 Signup attempt for:', data.email);
      
      const authData: AuthResponse = await authService.signup(data);
      
      // Store tokens and user
      localStorage.setItem('jwt_token', authData.accessToken);
      localStorage.setItem('refresh_token', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('user_email', authData.user.email);
      
      setUser(authData.user);
      console.log('✅ Signup successful:', authData.user.email);
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logout initiated');
      await authService.logout();
    } catch (err: any) {
      console.error('❌ Logout error:', err);
    } finally {
      // Clear all local storage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_email');
      setUser(null);
      console.log('✅ Logout complete');
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };
}
