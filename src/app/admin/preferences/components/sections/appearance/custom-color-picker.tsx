/**
 * Panneau de couleurs personnalisées pour le thème custom
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { ColorPickerField } from './color-picker-field';
import type { CustomColorPickerProps } from './types';

// ============================================
// COMPONENT
// ============================================

/** Panneau de sélection des couleurs du thème personnalisé. */
export function CustomColorPicker({
  customSeeds,
  onColorChange,
  canEdit,
}: CustomColorPickerProps) {
  return (
    <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-muted/30 p-4">
      <p className="text-sm font-medium">Personnaliser les couleurs</p>
      <div className="grid gap-6 sm:grid-cols-3">
        <ColorPickerField
          label="Couleur principale"
          description="Boutons, liens, accents"
          value={customSeeds.primary}
          onChange={(c) => onColorChange('primary', c)}
          disabled={!canEdit}
        />
        <ColorPickerField
          label="Couleur d'accent"
          description="Accent secondaire, badges"
          value={customSeeds.accent}
          onChange={(c) => onColorChange('accent', c)}
          disabled={!canEdit}
        />
        <ColorPickerField
          label="Fond de la sidebar"
          description="Barre latérale de navigation"
          value={customSeeds.sidebar}
          onChange={(c) => onColorChange('sidebar', c)}
          disabled={!canEdit}
        />
      </div>
    </div>
  );
}
