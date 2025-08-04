import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): StrengthResult => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = '';
  let color = '';

  switch (score) {
    case 0:
    case 1:
      label = 'Muito fraca';
      color = 'text-red-500';
      break;
    case 2:
      label = 'Fraca';
      color = 'text-orange-500';
      break;
    case 3:
      label = 'Média';
      color = 'text-yellow-500';
      break;
    case 4:
      label = 'Forte';
      color = 'text-green-500';
      break;
    case 5:
      label = 'Muito forte';
      color = 'text-green-600';
      break;
  }

  return { score, label, color, requirements };
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ 
  password, 
  className 
}) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Barra de força */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-2 flex-1 rounded-sm transition-colors",
              level <= strength.score
                ? strength.score <= 1
                  ? "bg-red-500"
                  : strength.score <= 2
                  ? "bg-orange-500"
                  : strength.score <= 3
                  ? "bg-yellow-500"
                  : strength.score <= 4
                  ? "bg-green-500"
                  : "bg-green-600"
                : "bg-slate-600"
            )}
          />
        ))}
      </div>

      {/* Label da força */}
      <p className={cn("text-sm font-medium", strength.color)}>
        {strength.label}
      </p>

      {/* Lista de requisitos */}
      <div className="space-y-1">
        <RequirementItem 
          met={strength.requirements.length} 
          text="Mínimo 8 caracteres" 
        />
        <RequirementItem 
          met={strength.requirements.uppercase} 
          text="Uma letra maiúscula" 
        />
        <RequirementItem 
          met={strength.requirements.lowercase} 
          text="Uma letra minúscula" 
        />
        <RequirementItem 
          met={strength.requirements.number} 
          text="Um número" 
        />
        <RequirementItem 
          met={strength.requirements.special} 
          text="Um caractere especial" 
        />
      </div>
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <div className="flex items-center space-x-2">
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        met ? "bg-green-500" : "bg-slate-500"
      )}
    />
    <span
      className={cn(
        "text-xs",
        met ? "text-green-400" : "text-slate-400"
      )}
    >
      {text}
    </span>
  </div>
);

export default PasswordStrength;