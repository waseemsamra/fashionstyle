// components/auth/ResetPasswordForm.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdvancedAuth, PasswordStrengthIndicator } from '@/hooks/useAdvancedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Eye, EyeOff, Shield, Check } from 'lucide-react';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset, isLoading } = useAdvancedAuth();
  
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Get email from location state
  const email = (location.state as any)?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const success = await confirmPasswordReset(email, formData.code, formData.password);
    
    if (success) {
      navigate('/login', { 
        state: { message: 'Password reset successful! You can now login.' } 
      });
    } else {
      setError('Failed to reset password. Please check your code and try again.');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-gold" />
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        </div>
        <CardDescription>
          Enter the code from your email and your new password
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Reset Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Reset Code *</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
            <p className="text-xs text-gray-500">
              Check your email for the 6-digit code
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10"
                required
                autoComplete="new-password"
              />
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Passwords match
              </div>
            )}
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
                Resetting password...
              </>
            ) : (
              'Reset Password'
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
