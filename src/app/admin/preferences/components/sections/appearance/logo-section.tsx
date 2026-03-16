/**
 * Section logos de l'organisation
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { ImageIcon } from 'lucide-react';

import { Label } from '@/components/ui/label';

import { LogoUploader } from '../logo-uploader';
import type { LogoSectionProps } from './types';

// ============================================
// COMPONENT
// ============================================

/** Section d'upload des logos (blanc et sombre). */
export function LogoSection({
  displayLogoWhiteUrl,
  displayLogoDarkUrl,
  onLogoWhiteChange,
  onLogoDarkChange,
  canEdit,
  isSaving,
  logoWhiteError,
  logoDarkError,
}: LogoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <Label>Logos de l&apos;organisation</Label>
      </div>

      <p className="text-xs text-muted-foreground">
        Uploadez deux versions du logo : une version blanche pour les fonds sombres et une
        version sombre pour les fonds clairs. Le logo approprié sera automatiquement utilisé
        selon le thème choisi.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Logo blanc (pour fonds sombres) */}
        <LogoUploader
          value={displayLogoWhiteUrl}
          onChange={onLogoWhiteChange}
          disabled={!canEdit || isSaving}
          error={logoWhiteError}
          label="Logo blanc (fonds sombres)"
          previewBgColor="dark"
          inputId="logo-white-upload"
        />

        {/* Logo sombre (pour fonds clairs) */}
        <LogoUploader
          value={displayLogoDarkUrl}
          onChange={onLogoDarkChange}
          disabled={!canEdit || isSaving}
          error={logoDarkError}
          label="Logo sombre (fonds clairs)"
          previewBgColor="light"
          inputId="logo-dark-upload"
        />
      </div>
    </div>
  );
}
