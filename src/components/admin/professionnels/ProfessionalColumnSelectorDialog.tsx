/**
 * ProfessionalColumnSelectorDialog
 * Sélection des colonnes visibles dans le tableau des professionnels.
 * Version allégée (sans drag-and-drop, ordre fixe).
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import {
  PROFESSIONAL_COLUMNS_ORDER,
  PROFESSIONAL_COLUMNS_CONFIG,
  DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS,
  type ProfessionalColumn,
} from '@/hooks/useUserPreferences';

// ============================================
// PROPS
// ============================================

interface ProfessionalColumnSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleColumns: ProfessionalColumn[];
  onSave: (cols: ProfessionalColumn[]) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function ProfessionalColumnSelectorDialog({
  open,
  onOpenChange,
  visibleColumns,
  onSave,
  isSaving,
}: ProfessionalColumnSelectorDialogProps) {
  const [selected, setSelected] = useState<ProfessionalColumn[]>(visibleColumns);

  // Resync quand la modale s'ouvre
  useEffect(() => {
    if (open) setSelected(visibleColumns);
  }, [open, visibleColumns]);

  const toggle = (col: ProfessionalColumn) => {
    setSelected((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleReset = () => setSelected(DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS);
  const handleSave = async () => { await onSave(selected); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Colonnes du tableau</DialogTitle>
          <DialogDescription>
            Cochez les colonnes optionnelles à afficher.
            <br />
            <span className="text-xs">
              {selected.length} colonne{selected.length > 1 ? 's' : ''} optionnelle{selected.length > 1 ? 's' : ''} visible{selected.length > 1 ? 's' : ''} — Nom, Email, Statut et Actions sont toujours affichés.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {PROFESSIONAL_COLUMNS_ORDER.map((col) => {
            const config = PROFESSIONAL_COLUMNS_CONFIG[col];
            const isChecked = selected.includes(col);
            return (
              <label
                key={col}
                className={`
                  flex items-center gap-3 p-2.5 rounded-md border cursor-pointer
                  transition-colors select-none
                  ${isChecked
                    ? 'border-derviche/30 bg-derviche/5'
                    : 'border-border hover:bg-muted/50'}
                `}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(col)}
                />
                <span className={`text-sm ${isChecked ? 'font-medium' : 'text-muted-foreground'}`}>
                  {config.label}
                </span>
              </label>
            );
          })}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="w-full sm:w-auto sm:mr-auto"
          >
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
