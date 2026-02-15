'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Lock, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  validatePassword, 
  getProgressBarColor, 
  type PasswordValidationResult,
  type PasswordCriteria 
} from '@/lib/password-validation';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showStrengthMeter?: boolean;
  showCriteria?: boolean;
  minLength?: number;
  onValidationChange?: (validation: PasswordValidationResult) => void;
  error?: string;
  description?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  className,
  label = 'Password',
  showStrengthMeter = true,
  showCriteria = true,
  minLength = 6,
  onValidationChange,
  error,
  description,
  value = '',
  onChange,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Validate password whenever value changes
  useEffect(() => {
    if (typeof value === 'string') {
      const result = validatePassword(value, minLength);
      setValidation(result);
      onValidationChange?.(result);
    }
  }, [value, minLength, onValidationChange]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const CriteriaIcon = ({ met }: { met: boolean }) => (
    met ? (
      <Check className="h-3 w-3 text-green-500" />
    ) : (
      <X className="h-3 w-3 text-red-500" />
    )
  );

  const shouldShowValidation = isFocused || (typeof value === 'string' && value.length > 0);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
        </Label>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Input Container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'pl-10 pr-12 h-12 border-2 transition-colors',
            error 
              ? 'border-red-500 focus:border-red-500' 
              : 'focus:border-blue-500',
            className
          )}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          {...props}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Password Strength Meter */}
      {showStrengthMeter && shouldShowValidation && validation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Password Strength</span>
            <span className={cn('text-xs font-medium', validation.strength.color)}>
              {validation.strength.label}
            </span>
          </div>
          
          <div className="relative">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  getProgressBarColor(validation.strength)
                )}
                style={{ width: `${validation.strength.percentage}%` }}
              />
            </div>
          </div>

          {/* Suggestions */}
          {validation.strength.suggestions.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Suggestions: </span>
              {validation.strength.suggestions.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Password Criteria */}
      {showCriteria && shouldShowValidation && validation && (
        <div className="space-y-1 p-3 bg-muted/30 rounded-lg border">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Password Requirements
          </h4>
          
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-center gap-2">
              <CriteriaIcon met={validation.criteria.minLength} />
              <span className={validation.criteria.minLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                At least {minLength} characters
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CriteriaIcon met={validation.criteria.hasUppercase} />
              <span className={validation.criteria.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                Uppercase letter (A-Z)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CriteriaIcon met={validation.criteria.hasLowercase} />
              <span className={validation.criteria.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                Lowercase letter (a-z)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CriteriaIcon met={validation.criteria.hasNumber} />
              <span className={validation.criteria.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                Number (0-9)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CriteriaIcon met={validation.criteria.hasSpecialChar} />
              <span className={validation.criteria.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                Special character (!@#$%^&*)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };