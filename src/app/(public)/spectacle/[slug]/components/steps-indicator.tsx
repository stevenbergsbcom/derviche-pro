/**
 * StepsIndicator — Fil d'Ariane des etapes de reservation
 * Derviche Diffusion - Page spectacle
 */

import { ChevronRight } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface StepsIndicatorProps {
  activeStepNumber: number;
}

// ============================================
// COMPONENT
// ============================================

export function StepsIndicator({ activeStepNumber }: StepsIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div
        className={`flex items-center gap-2 ${activeStepNumber >= 1 ? 'text-derviche' : 'text-muted-foreground'}`}
      >
        <span className={`text-sm font-medium ${activeStepNumber === 1 ? 'font-bold' : ''}`}>
          ① Créneau
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
      <div
        className={`flex items-center gap-2 ${activeStepNumber >= 2 ? 'text-derviche' : 'text-muted-foreground'}`}
      >
        <span className={`text-sm font-medium ${activeStepNumber === 2 ? 'font-bold' : ''}`}>
          ② Participants
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
      <div
        className={`flex items-center gap-2 ${activeStepNumber >= 3 ? 'text-derviche' : 'text-muted-foreground'}`}
      >
        <span className={`text-sm font-medium ${activeStepNumber === 3 ? 'font-bold' : ''}`}>
          ③ Vos informations
        </span>
      </div>
    </div>
  );
}
