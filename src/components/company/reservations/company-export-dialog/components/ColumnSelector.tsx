/**
 * Sélecteur de colonnes pour l'export compagnie
 * Grille de checkboxes avec actions rapides (tout/aucun/défaut)
 */

import { memo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  COMPANY_COLUMNS_CONFIG,
  COMPANY_COLUMNS_ORDER,
} from '@/hooks/useCompanyReservations';
import type { ColumnSelectorProps } from '../types';

// ============================================
// COMPOSANT
// ============================================

export const ColumnSelector = memo(function ColumnSelector({
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
  onUseDefaultColumns,
}: ColumnSelectorProps) {
  const totalColumns = COMPANY_COLUMNS_ORDER.length;
  const selectedCount = selectedColumns.length;

  return (
    <div className="space-y-3">
      {/* En-tête avec compteur et actions */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Colonnes à exporter
          <Badge variant="secondary" className="ml-2">
            {selectedCount}/{totalColumns}
          </Badge>
        </Label>

        {/* Actions rapides */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            aria-label="Sélectionner toutes les colonnes"
            className="h-7 text-xs"
          >
            <CheckSquare className="w-3 h-3 mr-1" aria-hidden="true" />
            Tout
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            aria-label="Désélectionner toutes les colonnes"
            className="h-7 text-xs"
          >
            <Square className="w-3 h-3 mr-1" aria-hidden="true" />
            Aucun
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUseDefaultColumns}
            aria-label="Utiliser les colonnes par défaut"
            className="h-7 text-xs"
          >
            Défaut
          </Button>
        </div>
      </div>

      {/* Grille de colonnes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1">
        {COMPANY_COLUMNS_ORDER.map((col) => {
          const isSelected = selectedColumns.includes(col);
          const config = COMPANY_COLUMNS_CONFIG[col];

          return (
            <label
              key={col}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                isSelected
                  ? 'bg-derviche/10 border border-derviche/30'
                  : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleColumn(col)}
                aria-label={`Inclure la colonne ${config.label}`}
              />
              <span className="truncate">{config.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
});

ColumnSelector.displayName = 'ColumnSelector';
