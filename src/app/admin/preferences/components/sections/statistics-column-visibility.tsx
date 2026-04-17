/**
 * StatisticsColumnVisibility - Sous-composant de la section Statistiques
 * Checkboxes pour masquer/afficher des colonnes dans les tables stats.
 * Derviche Diffusion — Phase 4A
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// ============================================
// TYPES
// ============================================

interface Column {
  key: string;
  label: string;
}

export interface StatisticsColumnVisibilityProps {
  /** Titre du fieldset (ex: « Tableau "Par spectacle" ») */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Préfixe sans espaces utilisé pour générer des id HTML stables
   *  (ex: `shows`, `venues`). Requis pour éviter des IDs invalides. */
  idPrefix: string;
  /** Colonnes qui peuvent être cachées */
  hideableColumns: Column[];
  /** Liste des clés actuellement cachées */
  hiddenColumns: string[];
  /** Désactive toutes les cases (lecture seule) */
  disabled?: boolean;
  /** Callback changement */
  onChange: (next: string[]) => void;
}

// ============================================
// COMPONENT
// ============================================

export function StatisticsColumnVisibility({
  title,
  description,
  idPrefix,
  hideableColumns,
  hiddenColumns,
  disabled,
  onChange,
}: StatisticsColumnVisibilityProps) {
  const toggle = (key: string, hidden: boolean) => {
    if (hidden) {
      // Ajouter si pas déjà présent (déduplication)
      onChange(
        [...hiddenColumns, key].filter((v, i, a) => a.indexOf(v) === i),
      );
    } else {
      onChange(hiddenColumns.filter((k) => k !== key));
    }
  };

  return (
    <fieldset className="space-y-2 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {hideableColumns.map((col) => {
          const hidden = hiddenColumns.includes(col.key);
          return (
            <div key={col.key} className="flex items-center gap-2">
              <Checkbox
                id={`col-${idPrefix}-${col.key}`}
                checked={hidden}
                disabled={disabled}
                onCheckedChange={(v) => toggle(col.key, Boolean(v))}
              />
              <Label
                htmlFor={`col-${idPrefix}-${col.key}`}
                className="cursor-pointer text-sm font-normal"
              >
                Masquer « {col.label} »
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
