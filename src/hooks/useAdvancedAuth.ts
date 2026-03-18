// hooks/useAdvancedAuth.ts
import { useState, useCallback, useEffect } from 'react';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { getUserFromToken, isTokenExpired } from '@/utils/tokenDecoder';

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'manager';
  avatar?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface SignInResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresMFA?: boolean;
  requiresNewPassword?: boolean;
}

export interface SignUpResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresConfirmation?: boolean;
}

// Password validation
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');

  if (errors.length === 0) {
    strength = 'strong';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

// Main hook
export function useAdvancedAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('⚠️ Token expired, clearing...');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Decode token to get user info
      const userFromToken = getUserFromToken(token);
      
      if (userFromToken) {
        setUser({
          id: userFromToken.id,
          email: userFromToken.email,
          name: userFromToken.name || 'User',
          role: (userFromToken.role as 'user' | 'admin' | 'manager') || 'user',
          emailVerified: true,
          phoneVerified: false,
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Sign in with email/password
  const signInAdvanced = useCallback(async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ): Promise<SignInResult> => {
    setIsLoading(true);
    
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Please enter both email and password',
        };
      }

      console.log('🔐 Advanced sign in attempt for:', email);

      // Use Amplify's built-in SRP authentication
      const result = await signIn({
        username: email,
        password: password,
      });

      console.log('✅ Cognito signin result:', result);

      if (result.isSignedIn) {
        // Get session tokens
        const session = await fetchAuthSession();
        
        if (session.tokens) {
          const accessToken = session.tokens.accessToken.toString();
          const idToken = session.tokens.idToken?.toString() || accessToken;
          
          // Store tokens
          localStorage.setItem('jwt_token', accessToken);
          localStorage.setItem('idToken', idToken);
          
          if (options?.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            setRememberMe(true);
          } else {
            localStorage.removeItem('rememberMe');
            setRememberMe(false);
          }

          // Decode user from token
          const userFromToken = getUserFromToken(accessToken);
          
          const authenticatedUser: AuthUser = {
            id: userFromToken?.id || email,
            email: userFromToken?.email || email,
            name: userFromToken?.name || email.split('@')[0],
            role: (userFromToken?.role as 'user' | 'admin' | 'manager') || 'user',
            emailVerified: true,
            phoneVerified: false,
          };

          setUser(authenticatedUser);
          setIsAuthenticated(true);

          toast.success(`Welcome back, ${authenticatedUser.name}!`);

          return {
            success: true,
            user: authenticatedUser,
          };
        }
      }

      return {
        success: false,
        error: 'Authentication failed',
      };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);

      // Handle specific error types
      let errorMessage = 'Invalid email or password';
      
      if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Your account is not confirmed. Please check your email.';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'No account found with this email.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Invalid email or password.';
      } else if (error.name === 'UserLambdaValidationException') {
        errorMessage = error.message || 'Authentication failed.';
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up with email/password
  const signUpAdvanced = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<SignUpResult> => {
    setIsLoading(true);
    
    try {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: `Password must contain: ${passwordValidation.errors.join(', ')}`,
        };
      }

      console.log('📝 Sign up attempt for:', email);

      // Use Amplify's built-in signup
      const { signUp } = await import('aws-amplify/auth');
      const result = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: name,
            phone_number: phone || '',
          },
        },
      });

      console.log('✅ Signup result:', result);

      // Decode user info
      const userFromToken = result.userId ? {
        id: result.userId,
        email: email,
        name: name,
        role: 'user' as const,
      } : null;

      toast.success('Account created! Please check your email to confirm.');

      return {
        success: true,
        user: userFromToken as AuthUser,
        requiresConfirmation: true,
      };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);

      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = error.message || 'Invalid information provided.';
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out
  const signOutAdvanced = useCallback(async () => {
    try {
      console.log('🚪 Sign out initiated');

      await signOut();

      // Clear all storage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('user');
      localStorage.removeItem('user_email');

      setUser(null);
      setIsAuthenticated(false);
      setRememberMe(false);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      toast.error('Failed to logout');
    }
  }, []);

  // Resend confirmation code
  const resendConfirmationCode = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { resendSignUpCode } = await import('aws-amplify/auth');
      await resendSignUpCode({ username: email });
      
      toast.success('Confirmation code resent! Check your email.');
      return true;
    } catch (error: any) {
      console.error('❌ Resend code error:', error);
      toast.error('Failed to resend code. Please try again.');
      return false;
    }
  }, []);

  // Confirm signup
  const confirmSignUp = useCallback(async (
    email: string,
    code: string
  ): Promise<boolean> => {
    try {
      const { confirmSignUp } = await import('aws-amplify/auth');
      await confirmSignUp({ username: email, confirmationCode: code });
      
      toast.success('Account confirmed! You can now login.');
      return true;
    } catch (error: any) {
      console.error('❌ Confirm signup error:', error);
      toast.error(error.message || 'Invalid confirmation code.');
      return false;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { resetPassword } = await import('aws-amplify/auth');
      await resetPassword({ username: email });
      
      toast.success('Password reset code sent! Check your email.');
      return true;
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      toast.error(error.message || 'Failed to send reset code.');
      return false;
    }
  }, []);

  // Confirm password reset
  const confirmPasswordReset = useCallback(async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      // Validate new password
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        toast.error(`Password must contain: ${validation.errors.join(', ')}`);
        return false;
      }

      const { confirmResetPassword } = await import('aws-amplify/auth');
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });
      
      toast.success('Password reset successful! You can now login.');
      return true;
    } catch (error: any) {
      console.error('❌ Confirm reset error:', error);
      toast.error(error.message || 'Failed to reset password.');
      return false;
    }
  }, []);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    rememberMe,
    
    // Actions
    signIn: signInAdvanced,
    signUp: signUpAdvanced,
    signOut: signOutAdvanced,
    checkAuth,
    resendConfirmationCode,
    confirmSignUp,
    resetPassword,
    confirmPasswordReset,
    
    // Utilities
    validatePassword,
  };
}

// Helper hook for password strength
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [requirements, setRequirements] = useState<{
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  }>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const validation = validatePassword(password);
    setStrength(validation.strength);
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  return { strength, requirements };
}

// Export PasswordStrengthIndicator component
export { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
