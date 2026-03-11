import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, signIn, signUp, fetchAuthSession, confirmSignUp } from 'aws-amplify/auth';
import { authService } from '@/services/auth';
import { api } from '@/services/api';
import { User, Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Check for OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      console.log('Checking OAuth callback, hash:', hash);
      
      if (hash && (hash.includes('id_token') || hash.includes('access_token'))) {
        try {
          const session = await fetchAuthSession();
          if (session.tokens) {
            const accessToken = session.tokens.accessToken.toString();
            const email = session.tokens.idToken?.payload?.email as string || '';

            console.log('OAuth success, storing token and email:', email);
            localStorage.setItem('jwt_token', accessToken);
            localStorage.setItem('user_email', email);
            window.location.hash = '';

            // Auto-create profile for OAuth users
            if (email) {
              try {
                const userId = email.split('@')[0];
                await api.createUserProfile(userId, email);
                console.log('✅ OAuth user profile created for:', email);
              } catch (profileErr: any) {
                console.log('Profile creation skipped:', profileErr.message);
              }
            }

            // Always redirect to dashboard after successful OAuth login
            console.log('Redirecting to dashboard from OAuth callback');
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          setError('Authentication failed: ' + err.message);
        }
      } else if (hash) {
        console.log('Hash present but no tokens:', hash.substring(0, 100));
      }
    };
    handleAuthCallback();
  }, [navigate]);

  // Clear existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await signOut();
        authService.signOut();
      } catch (err) {
        // Ignore errors
      }
    };
    checkExistingSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (credentials.password !== credentials.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Try backend signup first
        try {
          console.log('Attempting backend signup...');
          const response = await authService.signup(credentials.email, credentials.password);
          console.log('Backend signup response:', response);

          if (response.message) {
            // Backend signup successful - profile should be created on backend
            console.log('✅ Backend signup successful, profile will be created on verification');
            setError('Account created! Please verify your email.');
            setNeedsVerification(true);
            setLoading(false);
            return;
          }
        } catch (backendErr: any) {
          console.log('Backend signup failed:', backendErr.message);

          // Check for specific errors
          if (backendErr.response?.data?.error?.includes('already') ||
              backendErr.message?.includes('already')) {
            setError('User already exists. Redirecting to login...');
            setTimeout(() => {
              setIsSignUp(false);
              setCredentials({ ...credentials, password: '', confirmPassword: '' });
            }, 1500);
            setLoading(false);
            return;
          }

          // Fallback to Cognito signup
          console.log('Using Cognito signup as fallback');
        }

        // Fallback to Cognito signup
        try {
          console.log('Signing up with Cognito...');
          console.log('Email:', credentials.email);
          console.log('Password length:', credentials.password.length);

          // Validate email format first
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
          }

          // Validate password meets Cognito requirements
          const password = credentials.password;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumbers = /[0-9]/.test(password);
          
          if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
          }
          if (!hasUppercase || !hasLowercase || !hasNumbers) {
            setError('Password must contain uppercase, lowercase, and numbers.');
            setLoading(false);
            return;
          }

          const result = await signUp({
            username: credentials.email,
            password: password,
            options: {
              userAttributes: {
                email: credentials.email,
                name: credentials.email.split('@')[0] // Just email and name
              },
              autoSignIn: true
            }
          });
          
          console.log('Cognito signup result:', result);
          setNeedsVerification(true);
          setError('Verification code sent! Check your email (and spam folder).');
          setLoading(false);
        } catch (cognitoErr: any) {
          console.error('Cognito signup error:', cognitoErr);
          console.error('Error details:', JSON.stringify(cognitoErr, null, 2));
          console.error('Error name:', cognitoErr.name);
          console.error('Error message:', cognitoErr.message);
          
          if (cognitoErr.name === 'UsernameExistsException') {
            setError('User already exists. Redirecting to login...');
            setTimeout(() => {
              setIsSignUp(false);
              setCredentials({ ...credentials, password: '', confirmPassword: '' });
            }, 2000);
            setLoading(false);
            return;
          } else if (cognitoErr.name === 'InvalidParameterException') {
            // Get more specific error message
            const msg = cognitoErr.message || '';
            if (msg.includes('email')) {
              setError('Invalid email format. Please use a valid email address.');
            } else if (msg.includes('password') || msg.includes('Password')) {
              setError('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
            } else {
              setError('Invalid parameters. Please check: 1) Valid email, 2) Password 8+ chars with uppercase, lowercase & numbers');
            }
          } else if (cognitoErr.name === 'InvalidPasswordException') {
            setError('Password must be at least 8 characters with uppercase, lowercase, and numbers.');
          } else if (cognitoErr.name === 'NotAuthorizedException') {
            setError('Not authorized to perform this action.');
          } else if (cognitoErr.code === 'InvalidParameterException') {
            setError('Invalid parameters. Please check your email and password format.');
          } else {
            setError('Signup failed: ' + (cognitoErr.message || 'Please try again'));
          }
          setLoading(false);
        }
        return;

      } else {
        // Try backend signin first
        try {
          console.log('Attempting backend signin...');
          const response = await authService.signin(credentials.email, credentials.password);
          console.log('Backend signin response:', response);

          if (response.accessToken) {
            console.log('Backend signin successful, redirecting...');

            // Auto-create profile if it doesn't exist
            try {
              const userId = credentials.email.replace(/[^a-zA-Z0-9]/g, '-');
              console.log('Creating profile for userId:', userId);
              await api.createUserProfile(userId, credentials.email);
              console.log('✅ User profile created/updated for:', credentials.email);
            } catch (profileErr: any) {
              console.log('Profile creation skipped or failed:', profileErr.message);
            }

            // Check if there's checkout data to restore
            const checkoutData = localStorage.getItem('checkout_data');
            const from = (location as any).state?.from;
            
            if (checkoutData && from === '/checkout') {
              console.log('🛒 Restoring checkout data after login');
              // Redirect to checkout to complete the order
              navigate('/checkout', { replace: true });
            } else {
              // Redirect to checkout if coming from there, otherwise dashboard
              const redirectUrl = from || '/dashboard';
              console.log('Redirecting to:', redirectUrl);
              navigate(redirectUrl, { replace: true });
            }
            
            return;
          }
        } catch (backendErr: any) {
          console.log('Backend signin failed:', backendErr.message);
          console.log('Error response:', backendErr.response?.data);
          console.log('Error status:', backendErr.response?.status);

          // Handle 401 Unauthorized - user doesn't exist or wrong password
          if (backendErr.response?.status === 401) {
            const errorMsg = backendErr.response?.data?.message || backendErr.response?.data?.error || 'Invalid credentials';
            
            // Check if it's a "user not found" error
            if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('Invalid')) {
              setError('Invalid email or password. If you don\'t have an account, please sign up first.');
              setIsSignUp(true); // Switch to signup form
              setLoading(false);
              return;
            }
            
            setError(errorMsg);
            setLoading(false);
            return;
          }

          // Check if password reset is required
          if (backendErr.response?.data?.code === 'PasswordResetRequiredException' ||
              backendErr.message?.includes('Password reset')) {
            setError('Password reset required. Please use "Forgot Password" to reset.');
            setShowResetPassword(true);
            setResetEmail(credentials.email);
            setLoading(false);
            return;
          }

          // Check if user doesn't exist
          if (backendErr.response?.data?.code === 'UserNotFoundException' ||
              backendErr.message?.includes('User does not exist')) {
            setError('User does not exist. Please sign up first.');
            setIsSignUp(true);
            setLoading(false);
            return;
          }

          // For CORS errors or network issues
          if (backendErr.code === 'ERR_NETWORK' || backendErr.message?.includes('CORS')) {
            console.log('Network/CORS error, checking for existing token...');
            const token = localStorage.getItem('jwt_token');
            if (token) {
              console.log('Using existing token, redirecting to dashboard');
              navigate('/dashboard', { replace: true });
              return;
            }
          }

          console.log('Using Cognito signin as fallback');
        }

        // Fallback to direct Cognito signin (works better on Amplify)
        console.log('Signing in with Cognito directly...');
        try {
          const result = await signIn({
            username: credentials.email,
            password: credentials.password
          });

          console.log('Cognito signin result:', result);

          if (result.isSignedIn) {
            // Get the session tokens
            const session = await fetchAuthSession();
            if (session.tokens) {
              const email = session.tokens.idToken?.payload?.email as string || credentials.email;
              localStorage.setItem('jwt_token', session.tokens.accessToken.toString());
              localStorage.setItem('user_email', email);

              // Auto-create profile if it doesn't exist
              try {
                const userId = email.replace(/[^a-zA-Z0-9]/g, '-');
                console.log('Creating profile for userId:', userId);
                await api.createUserProfile(userId, email);
                console.log('✅ User profile created/updated for:', email);
              } catch (profileErr: any) {
                console.log('Profile creation skipped or failed:', profileErr.message);
              }
            }

            // Redirect to checkout if coming from there, otherwise dashboard
            const from = (location as any).state?.from || '/dashboard';
            console.log('Cognito signin successful, redirecting to:', from);
            navigate(from, { replace: true });
          }
        } catch (cognitoErr: any) {
          console.error('Cognito signin failed:', cognitoErr);
          throw cognitoErr; // Re-throw to be caught by outer catch
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let errorMsg = err.message || 'Authentication failed. Please check your credentials.';
      
      // Simplify Cognito error messages
      if (errorMsg.includes('NotAuthorizedException')) {
        errorMsg = 'Incorrect username or password.';
      } else if (errorMsg.includes('UserNotConfirmedException')) {
        errorMsg = 'Please verify your email first.';
        setNeedsVerification(true);
      } else if (errorMsg.includes('PasswordResetRequired')) {
        errorMsg = 'Password reset required. Please use "Forgot Password".';
        setShowResetPassword(true);
        setResetEmail(credentials.email);
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: credentials.email,
        confirmationCode: credentials.code
      });

      // Auto-create user profile in DynamoDB after successful verification
      try {
        const userId = credentials.email.replace(/[^a-zA-Z0-9]/g, '-');
        console.log('Creating profile for userId:', userId, 'email:', credentials.email);
        await api.createUserProfile(userId, credentials.email);
        console.log('✅ User profile created successfully for:', credentials.email);
      } catch (profileErr: any) {
        console.log('⚠️ Profile creation failed, but signup succeeded:', profileErr.message);
        console.log('Profile will be created on first login');
        // Don't fail the verification if profile creation fails
      }

      setError('Account verified! Please sign in.');
      setIsSignUp(false);
      setNeedsVerification(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try backend first
      const response = await authService.forgotPassword(resetEmail);
      if (response.message) {
        setError('Reset code sent! Check your email.');
        setCodeSent(true);
      }
    } catch (err: any) {
      console.log('Backend forgot password failed:', err.message);
      
      // Fallback to Cognito
      try {
        const { resetPassword } = await import('aws-amplify/auth');
        await resetPassword({ username: resetEmail });
        setError('Reset code sent! Check your email.');
        setCodeSent(true);
      } catch (cognitoErr: any) {
        setError(cognitoErr.message || 'Failed to send reset code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try backend first
      const response = await authService.confirmPassword(resetEmail, resetCode, newPassword);
      if (response.message) {
        setError('Password reset successful! Please login.');
        setTimeout(() => {
          setShowResetPassword(false);
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setCodeSent(false);
          setIsSignUp(false);
        }, 2000);
      }
    } catch (err: any) {
      console.log('Backend confirm password failed:', err.message);
      
      // Fallback to Cognito
      try {
        const { confirmResetPassword } = await import('aws-amplify/auth');
        await confirmResetPassword({
          username: resetEmail,
          confirmationCode: resetCode,
          newPassword
        });
        setError('Password reset successful! Please login.');
        setTimeout(() => {
          setShowResetPassword(false);
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setCodeSent(false);
          setIsSignUp(false);
        }, 2000);
      } catch (cognitoErr: any) {
        setError(cognitoErr.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-100 to-beige-200 flex items-center justify-center px-4 py-20">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{needsVerification ? 'Verify Account' : isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-gray-600 text-sm mt-2">
            {needsVerification ? 'Enter verification code' : isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </p>
        </div>

        {needsVerification ? (
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className={`${error.includes('verified') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg text-sm`}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Verification Code</label>
              <input
                type="text"
                value={credentials.code}
                onChange={(e) => setCredentials({ ...credentials, code: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                placeholder="Enter 6-digit code"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="w-full bg-gold hover:bg-gold/90 text-white py-3 rounded-lg font-medium" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`${error.includes('sent') || error.includes('verified') || error.includes('successful') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg text-sm`}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Must be 8+ characters with uppercase, lowercase, and numbers
                  </p>
                )}
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={credentials.confirmPassword}
                      onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      placeholder="Confirm password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-gold hover:bg-gold/90 text-white py-3 rounded-lg font-medium" disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              {!isSignUp && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-gold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold hover:underline text-sm">
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Reset Password</h2>
              <button onClick={() => { setShowResetPassword(false); setResetEmail(''); setResetCode(''); setNewPassword(''); }} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            {!codeSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    placeholder="your@email.com"
                    required
                    disabled={loading || codeSent}
                  />
                </div>
                <button type="submit" className="w-full bg-gold hover:bg-gold/90 text-white py-3 rounded-lg font-medium" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCodeSent(true)}
                    className="text-sm text-gray-600 hover:text-gold"
                  >
                    Already have a reset code? Click here
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                  ✓ Reset code sent to {resetEmail}. Check your email!
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reset Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    placeholder="Enter code from email"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    placeholder="New password"
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="w-full bg-gold hover:bg-gold/90 text-white py-3 rounded-lg font-medium" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
