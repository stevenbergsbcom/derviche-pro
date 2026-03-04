/**
 * FooterSection - Boutons d'action du drawer
 * Derviche Diffusion
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Loader2, X } from 'lucide-react';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface FooterSectionProps {
  /** Statut actuellement sélectionné */
  selectedStatus: CheckinStatus | null;
  /** Y a-t-il des modifications non sauvegardées ? */
  hasChanges: boolean;
  /** Peut-on sauvegarder ? */
  canSave: boolean;
  /** La réservation est-elle annulée ? */
  isCancelled: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
  /** Handler de sauvegarde */
  onSave: () => void;
  /** Handler d'ouverture de la modale de confirmation d'annulation */
  onCancelClick: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function FooterSection({
  selectedStatus,
  hasChanges,
  canSave,
  isCancelled,
  isSubmitting,
  onSave,
  onCancelClick,
}: FooterSectionProps) {
  return (
    <DrawerFooter className="border-t pt-4">
      <div className="flex gap-3">
        <DrawerClose asChild>
          <Button
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Fermer
          </Button>
        </DrawerClose>
        <Button
          onClick={() => void onSave()}
          disabled={!canSave}
          className={cn(
            'flex-1',
            selectedStatus === 'absent' && 'bg-red-600 hover:bg-red-700'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>

      {/* Indicateur de changement */}
      {hasChanges && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Modifications non enregistrées
        </p>
      )}

      {/* Bouton annuler — uniquement si confirmée, ouvre la modale de confirmation */}
      {!isCancelled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelClick}
          disabled={isSubmitting}
          className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1.5" />
          Annuler cette réservation
        </Button>
      )}
    </DrawerFooter>
  );
}
