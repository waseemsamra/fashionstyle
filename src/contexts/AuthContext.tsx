import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, type User } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Query current user
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) return null;
      
      try {
        // Decode user from token instead of calling backend
        const { getUserFromToken } = await import('@/utils/tokenDecoder');
        const userFromToken = getUserFromToken(token);
        
        // Fallback: use stored email from localStorage if JWT doesn't contain email
        const storedEmail = localStorage.getItem('user_email');
        const userEmail = userFromToken?.email || storedEmail;
        
        console.log('🔍 AuthContext: Token email:', userFromToken?.email);
        console.log('🔍 AuthContext: Stored email:', storedEmail);
        console.log('🔍 AuthContext: Final email:', userEmail);
        
        if (userEmail) {
          return {
            id: userEmail, // Use email as primary identifier, not cognitoSub
            email: userEmail,
            name: userFromToken?.name || userEmail.split('@')[0] || 'User',
            role: (userFromToken?.role as 'user' | 'admin' | 'manager') || 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: true,
            phoneVerified: false,
            preferences: {
              newsletter: false,
              smsNotifications: false,
              emailNotifications: false,
              language: 'en',
              currency: 'USD',
            },
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('jwt_token');
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
    enabled: true,
  });

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      refetch().finally(() => setIsInitialized(true));
    } else {
      setIsInitialized(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('jwt_token', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user_id', response.user.id);
      localStorage.setItem('user_email', response.user.email);
      
      await refetch();
      
      // Sync guest wishlist if exists
      const guestWishlist = localStorage.getItem('guestWishlist');
      if (guestWishlist) {
        const guestItems = JSON.parse(guestWishlist);
        if (guestItems.length > 0) {
          console.log(`🔄 Syncing ${guestItems.length} wishlist items...`);
          // Wishlist will be synced automatically via useSyncGuestWishlist hook
        }
      }
      
      toast.success(`Welcome back, ${response.user.name || response.user.email}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await authService.signup(data);
      
      localStorage.setItem('jwt_token', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user_id', response.user.id);
      localStorage.setItem('user_email', response.user.email);
      
      await refetch();
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Remove tokens
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    queryClient.setQueryData(['current-user'], (old: User | null) => {
      if (!old) return old;
      return { ...old, ...updatedUser };
    });
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
