/**
 * Champ sélecteur de couleur avec input hex
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface ColorPickerFieldProps {
  /** Libellé du champ */
  label: string;
  /** Description courte */
  description: string;
  /** Valeur hex actuelle */
  value: string;
  /** Callback lors du changement */
  onChange: (color: string) => void;
  /** Champ désactivé */
  disabled?: boolean;
}

// ============================================
// HELPERS
// ============================================

/** Valide un hex (avec ou sans #) */
function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(hex);
}

// ============================================
// COMPONENT
// ============================================

/** Champ de sélection de couleur avec color picker et input hex. */
export function ColorPickerField({
  label,
  description,
  value,
  onChange,
  disabled,
}: ColorPickerFieldProps) {
  const [inputValue, setInputValue] = useState(value);

  // Synchroniser quand la valeur externe change
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    setInputValue(hex);

    // Ajouter le # si absent
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (isValidHex(hex)) {
      onChange(hex);
    }
  };

  const handleInputBlur = () => {
    // Restaurer la dernière valeur valide si invalide
    if (!isValidHex(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn('space-y-2', disabled && 'pointer-events-none opacity-60')}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="[&_.react-colorful]:w-full [&_.react-colorful]:rounded-md">
        <HexColorPicker color={value} onChange={onChange} />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 shrink-0 rounded border border-black/10"
          style={{ backgroundColor: value }}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          maxLength={7}
          className="h-8 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
