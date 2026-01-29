/**
 * Footer avec boutons d'actions
 * Derviche Diffusion - Session 110
 */

import { Button } from '@/components/ui/button';
import type { DialogFooterActionsProps } from '../types';

export function DialogFooterActions({
  onEdit,
  onDelete,
}: DialogFooterActionsProps) {
  return (
    <div className="border-t px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onEdit}
        className="w-full sm:w-auto"
      >
        Modifier
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => void onDelete()}
        className="w-full sm:w-auto"
      >
        Supprimer
      </Button>
    </div>
  );
}
