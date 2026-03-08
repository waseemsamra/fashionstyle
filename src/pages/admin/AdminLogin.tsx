import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Lock, User, KeyRound } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Admin login attempt for:', credentials.username);

      // First, sign out any existing user
      console.log('🚪 Signing out existing user...');
      try {
        await signOut();
        console.log('✅ Signed out successfully');
      } catch (signOutErr) {
        console.log('No existing session to clear');
      }

      // Clear localStorage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('refreshToken');

      // Sign in with admin credentials
      console.log('🔐 Signing in...');
      const result = await signIn({
        username: credentials.username,
        password: credentials.password
      });

      console.log('📋 SignIn result:', result);

      if (result.isSignedIn) {
        console.log('✅ Admin login successful');
        
        // Get session tokens
        try {
          const session = await fetchAuthSession();
          if (session.tokens) {
            localStorage.setItem('jwt_token', session.tokens.accessToken.toString());
            localStorage.setItem('user_email', credentials.username);
            console.log('✅ Tokens stored in localStorage');
          }
        } catch (tokenErr) {
          console.log('⚠️ Could not fetch tokens, storing email only');
          localStorage.setItem('user_email', credentials.username);
        }
        
        navigate('/admin/dashboard');
      } else {
        console.log('⚠️ Login not complete, next step:', result.nextStep);
        setError(`Login step: ${result.nextStep?.signInStep || 'Unknown'}`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Admin login error:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      
      // Check for specific errors
      if (err.message?.includes('USER_SRP_AUTH')) {
        setError('SRP authentication not enabled. Please enable USER_SRP_AUTH in Cognito console.');
      } else if (err.message?.includes('UserAlreadyAuthenticated')) {
        setError('Already logged in. Redirecting to dashboard...');
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      } else if (err.message?.includes('incorrect') || err.message?.includes('Invalid')) {
        setError('Invalid username or password');
      } else {
        setError(err.message || 'Login failed');
      }
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
          <p>Use your Cognito credentials</p>
        </div>
      </div>
    </div>
  );
}
