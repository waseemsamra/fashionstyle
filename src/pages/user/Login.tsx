import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, confirmSignUp, signInWithRedirect } from 'aws-amplify/auth';
import { User, Lock, Mail, Phone, Facebook } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', phone: '', password: '', confirmPassword: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const username = signUpMethod === 'email' ? credentials.email : credentials.phone;
        await signUp({
          username,
          password: credentials.password,
          options: {
            userAttributes: signUpMethod === 'email' 
              ? { email: credentials.email }
              : { phone_number: credentials.phone }
          }
        });
        setNeedsVerification(true);
        setError('Verification code sent! Check your ' + (signUpMethod === 'email' ? 'email' : 'phone'));
      } else {
        const result = await signIn({ username: credentials.email, password: credentials.password });
        if (result.isSignedIn) {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const username = signUpMethod === 'email' ? credentials.email : credentials.phone;
      await confirmSignUp({ username, confirmationCode: credentials.code });
      setError('Account verified! Please sign in.');
      setIsSignUp(false);
      setNeedsVerification(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithRedirect({ provider: 'Facebook' });
    } catch (err: any) {
      setError(err.message || 'Facebook login failed');
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
                <div className={`${error.includes('sent') || error.includes('verified') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg text-sm`}>
                  {error}
                </div>
              )}

              {isSignUp && (
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSignUpMethod('email')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${signUpMethod === 'email' ? 'bg-white shadow' : ''}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpMethod('phone')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${signUpMethod === 'phone' ? 'bg-white shadow' : ''}`}
                  >
                    Phone
                  </button>
                </div>
              )}
              
              {(!isSignUp || signUpMethod === 'email') && (
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
              )}

              {isSignUp && signUpMethod === 'phone' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={credentials.phone}
                      onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      placeholder="+92 300 1234567"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

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
                  />
                </div>
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
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleFacebookLogin}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold hover:underline text-sm">
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
