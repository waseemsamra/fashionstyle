// components/auth/ForgotPasswordForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdvancedAuth } from '@/hooks/useAdvancedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, Shield } from 'lucide-react';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAdvancedAuth();
  
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const success = await resetPassword(email);
    
    if (success) {
      setSent(true);
    } else {
      setError('Failed to send reset code. Please try again.');
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-gold" />
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          </div>
          <CardDescription>
            We've sent a password reset code to your email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ Password reset code sent to <strong>{email}</strong>
            </p>
            <p className="text-green-700 text-xs mt-2">
              The code will expire in 15 minutes. Check your spam folder if you don't see it.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={() => navigate('/reset-password', { state: { email } })}
            className="w-full bg-gold hover:bg-gold/90"
          >
            Continue to Reset Password
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-gold" />
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
        </div>
        <CardDescription>
          Enter your email and we'll send you a reset code
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold hover:bg-gold/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send Reset Code'
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
