import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Lock, User, KeyRound } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await getCurrentUser();
        // If we get here, user is already logged in
        console.log('✅ User already logged in, redirecting...');
        navigate('/admin/dashboard', { replace: true });
      } catch (error) {
        // Not logged in, which is fine
        console.log('ℹ️ No existing session');
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Admin login attempt for:', credentials.username);

      // Sign out any existing user first
      try {
        await signOut();
        console.log('🚪 Signed out existing user');
      } catch (e) {
        // Ignore sign out errors
      }

      // Use Cognito directly (same as user login)
      console.log('📡 Authenticating with Cognito...');
      const result = await signIn({
        username: credentials.username,
        password: credentials.password
      });

      console.log('✅ Cognito signin result:', result);

      if (result.isSignedIn) {
        // Get the session tokens
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();

        if (session.tokens) {
          const email = session.tokens.idToken?.payload?.email as string || credentials.username;
          const accessToken = session.tokens.accessToken.toString();

          localStorage.setItem('jwt_token', accessToken);
          localStorage.setItem('user_email', email);
          localStorage.setItem('admin_access', 'true');

          console.log('✅ Tokens stored!');
          console.log('🎉 Admin login successful!');

          // Redirect to admin dashboard
          navigate('/admin/dashboard', { replace: true });
        }
      }

    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Simplify error messages
      let errorMsg = 'Login failed. Please check your credentials.';
      
      if (error.name === 'UserNotConfirmedException') {
        errorMsg = 'Your account is not confirmed. Please check your email.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMsg = 'Invalid email or password.';
      } else if (error.name === 'UserNotFoundException') {
        errorMsg = 'No account found with this email.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-gray-600 text-sm mt-2">Enter your credentials to access dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                placeholder="Enter password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold hover:bg-gold/90 text-white py-3"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Use your backend admin credentials</p>
        </div>
      </div>
    </div>
  );
}
