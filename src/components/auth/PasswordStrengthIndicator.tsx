// components/auth/PasswordStrengthIndicator.tsx
import { usePasswordStrength as useStrength } from '@/hooks/useAdvancedAuth';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, requirements } = useStrength(password);

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
