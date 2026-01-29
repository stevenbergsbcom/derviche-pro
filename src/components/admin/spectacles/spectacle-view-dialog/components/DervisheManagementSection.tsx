/**
 * Section gestion Derviche Diffusion
 * Derviche Diffusion - Session 110
 */

import { User } from 'lucide-react';
import type { DervisheManagementSectionProps } from '../types';

export function DervisheManagementSection({
  managerName,
}: DervisheManagementSectionProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/10">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <User className="w-4 h-4" aria-hidden="true" />
        Gestion Derviche Diffusion
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {/* Responsable Derviche */}
        <div>
          <p className="text-xs text-muted-foreground">Responsable</p>
          {managerName ? (
            <p className="text-sm text-foreground">{managerName}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Non assigné</p>
          )}
        </div>
      </div>
    </div>
  );
}
