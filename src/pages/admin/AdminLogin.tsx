import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Lock, User, KeyRound } from 'lucide-react';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL || 'https://7uymscqv6xcutr5f6b2yvcgqri0wnkuj.lambda-url.us-east-1.on.aws';

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

      // 1. Cognito authentication
      const result = await signIn({
        username: credentials.username,
        password: credentials.password
      });

      console.log('✅ Cognito signin result:', result);

      if (result.isSignedIn) {
        // 2. Get user profile from Users API (role verification)
        const email = credentials.username;
        const userId = email.replace(/[^a-zA-Z0-9]/g, '-');
        
        console.log('🔍 Fetching user profile for:', userId);
        const response = await fetch(
          `${USERS_API_URL}/users/${encodeURIComponent(userId)}/profile`,
          { mode: 'cors' }
        );
        
        const profile = response.ok ? await response.json() : {};
        console.log('📋 User profile:', profile);
        console.log('📋 User role:', profile.role);

        // Check if admin
        if (profile.role === 'admin') {
          console.log('🎉 Admin access granted');
          // Store admin session
          localStorage.setItem('adminAuthenticated', 'true');
          localStorage.setItem('adminEmail', email);
          // Get session tokens
          const session = await fetchAuthSession();
          if (session.tokens) {
            localStorage.setItem('jwt_token', session.tokens.accessToken.toString());
            localStorage.setItem('user_email', email);
          }
          // Redirect to admin dashboard
          navigate('/admin/dashboard');
        } else {
          console.log('❌ Not an admin user');
          // Sign out Cognito user
          await signOut();
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_email');
          setError('Access denied. Admin privileges required.');
        }
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed. Please check credentials.');
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
          <p>Use Cognito admin credentials</p>
        </div>
      </div>
    </div>
  );
}
