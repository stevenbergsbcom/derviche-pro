/**
 * StatusButtonsSection - Grille des boutons de statut de présence
 * Derviche Diffusion
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { STATUS_BUTTONS } from '../constants';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface StatusButtonsSectionProps {
  /** Statut actuellement sélectionné */
  selectedStatus: CheckinStatus | null;
  /** Callback de changement de statut (met à jour le state local) */
  onStatusChange: (status: CheckinStatus | null) => void;
  /** Callback d'auto-save immédiat en BDD */
  onAutoSave: (status: CheckinStatus | null) => Promise<void>;
  /** La réservation est-elle annulée ? */
  isCancelled: boolean;
  /** En cours de traitement ? */
  isSubmitting: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function StatusButtonsSection({
  selectedStatus,
  onStatusChange,
  onAutoSave,
  isCancelled,
  isSubmitting,
}: StatusButtonsSectionProps) {
  // Masquer si la réservation est annulée
  if (isCancelled) {
    return null;
  }

  return (
    <div>
      <p className="text-base font-medium text-muted-foreground mb-3">
        Statut de présence
      </p>
      
      {/* Grille 2x2 des boutons */}
      <div className="grid grid-cols-2 gap-3">
        {STATUS_BUTTONS.map((config) => {
          const Icon = config.icon;
          const isActive = selectedStatus === config.status;
          
          return (
            <button
              key={config.status}
              type="button"
              onClick={() => {
                onStatusChange(config.status);
                void onAutoSave(config.status);
              }}
              disabled={isSubmitting}
              aria-label={`Marquer comme ${config.label}`}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4',
                'rounded-xl border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? config.activeColor
                  : cn(config.bgColor, config.borderColor, config.color),
                isSubmitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'text-white')} />
              <span className={cn('text-base font-medium', isActive && 'text-white')}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Bouton réinitialiser - visible si un statut est sélectionné */}
      {selectedStatus !== null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange(null);
            void onAutoSave(null);
          }}
          disabled={isSubmitting}
          aria-label="Réinitialiser le statut de présence"
          className="mt-3 w-full text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Réinitialiser (non pointé)
        </Button>
      )}
    </div>
  );
}
