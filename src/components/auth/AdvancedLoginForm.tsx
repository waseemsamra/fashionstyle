// components/auth/AdvancedLoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdvancedAuth, usePasswordStrength } from '@/hooks/useAdvancedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff, Check, X, Shield } from 'lucide-react';

interface AdvancedLoginFormProps {
  onSuccess?: () => void;
}

export function AdvancedLoginForm({ onSuccess }: AdvancedLoginFormProps) {
  const navigate = useNavigate();
  const { signIn, isLoading } = useAdvancedAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn(formData.email, formData.password, {
      rememberMe: formData.rememberMe,
    });

    if (result.success) {
      onSuccess?.();
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-gold" />
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        </div>
        <CardDescription>
          Sign in to your account with secure authentication
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-gold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold hover:bg-gold/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {/* Implement Google OAuth */}}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {/* Implement Facebook OAuth */}}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-gold hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

// Password strength indicator component
export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { strength, requirements } = usePasswordStrength(password);

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{
              width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
            }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">
          {strengthLabels[strength]}
        </span>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        <RequirementItem met={requirements.length} label="8+ characters" />
        <RequirementItem met={requirements.uppercase} label="Uppercase" />
        <RequirementItem met={requirements.lowercase} label="Lowercase" />
        <RequirementItem met={requirements.number} label="Number" />
        <RequirementItem met={requirements.special} label="Special char" />
      </div>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
}
