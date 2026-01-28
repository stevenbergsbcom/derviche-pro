/**
 * Composant PasswordField - Champ mot de passe avec génération
 * Derviche Diffusion - Session 102
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import type { PasswordFieldProps } from '../types';

/**
 * Indicateur de force du mot de passe
 */
function PasswordStrengthIndicator({ score, label }: { score: number; label: string }) {
  const getBarColor = (index: number, currentScore: number): string => {
    if (index >= Math.ceil(currentScore / 25)) {
      return 'bg-gray-200';
    }
    if (currentScore < 40) return 'bg-red-500';
    if (currentScore < 60) return 'bg-orange-500';
    if (currentScore < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${getBarColor(i, score)}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Force : {label}</p>
    </div>
  );
}

/**
 * Champ mot de passe avec génération automatique et indicateur de force
 */
export function PasswordField({
  password,
  onChange,
  onGenerate,
  onCopy,
  showPassword,
  onToggleVisibility,
  copied,
  passwordStrength,
  validationError,
  isSubmitting,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="new_user_password">
        Mot de passe <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="new_user_password"
            name="new_user_password_field"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Mot de passe sécurisé"
            disabled={isSubmitting}
            className={`pr-10 ${validationError ? 'border-destructive' : ''}`}
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={onToggleVisibility}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onGenerate}
          disabled={isSubmitting}
          title="Générer un mot de passe"
          aria-label="Générer un mot de passe"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => void onCopy()}
          disabled={isSubmitting || !password}
          title="Copier le mot de passe"
          aria-label="Copier le mot de passe"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}
      {passwordStrength && (
        <PasswordStrengthIndicator
          score={passwordStrength.score}
          label={passwordStrength.label}
        />
      )}
    </div>
  );
}
