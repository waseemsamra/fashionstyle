// components/auth/EmailConfirmationForm.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdvancedAuth } from '@/hooks/useAdvancedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Shield, CheckCircle } from 'lucide-react';

export function EmailConfirmationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignUp, resendConfirmationCode, isLoading } = useAdvancedAuth();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);

  // Get email from location state
  const email = (location.state as any)?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('Please enter the confirmation code');
      return;
    }

    const confirmed = await confirmSignUp(email, code);
    
    if (confirmed) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Email confirmed! You can now login.' } 
        });
      }, 2000);
    } else {
      setError('Invalid code. Please check and try again.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    
    const success = await resendConfirmationCode(email);
    
    if (success) {
      // Show success message briefly
      setTimeout(() => setResending(false), 2000);
    } else {
      setResending(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Email Confirmed!</CardTitle>
          <CardDescription className="text-center">
            Redirecting to login...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-gold" />
          <CardTitle className="text-2xl font-bold">Confirm Your Email</CardTitle>
        </div>
        <CardDescription>
          Enter the code sent to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 text-sm font-medium">Check your email</p>
                <p className="text-blue-700 text-xs mt-1">
                  We've sent a 6-digit confirmation code to your email address.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Confirmation Code *</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-gold hover:underline font-medium disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend code'}
              </button>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
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
                Confirming...
              </>
            ) : (
              'Confirm Email'
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
