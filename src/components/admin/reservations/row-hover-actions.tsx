/**
 * Bouton d'action sur une ligne de réservation
 * - Clic sur le crayon : ouvre le dialog de modification
 * Derviche Diffusion
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface RowHoverActionsProps {
  onEdit: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function RowHoverActions({ onEdit }: RowHoverActionsProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 cursor-pointer hover:bg-derviche/10 hover:text-derviche"
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      <Pencil className="w-4 h-4" />
    </Button>
  );
}
