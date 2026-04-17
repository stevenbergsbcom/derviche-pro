/**
 * SortableRow — Row drag&drop réutilisable (zone vedette + zone globale)
 * Derviche Diffusion — Migration 111
 *
 * S'appuie sur @dnd-kit/sortable. Affiche :
 *  - poignée de drag (GripVertical)
 *  - miniature image (ou placeholder)
 *  - titre + compagnie
 *  - slot `extra` (badges statut, input rang, bouton remove) fourni par le parent
 */

'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { GripVertical, Drama } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableRowProps {
  id: string;
  title: string;
  companyName: string;
  imageUrl: string | null;
  /** Zone(s) à droite (badges statut, input rang, bouton remove, etc.) */
  extra?: ReactNode;
  /** Si true, la poignée est désactivée (drag impossible). */
  disabled?: boolean;
  /** Tooltip à afficher sur la poignée quand disabled. */
  disabledTooltip?: string;
}

export function SortableRow({
  id,
  title,
  companyName,
  imageUrl,
  extra,
  disabled = false,
  disabledTooltip,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasImage =
    !!imageUrl && !imageUrl.includes('placeholder');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 border rounded-md bg-white p-2',
        isDragging && 'shadow-lg opacity-80 z-10',
      )}
    >
      <button
        type="button"
        aria-label={disabled ? disabledTooltip ?? 'Drag désactivé' : 'Réorganiser'}
        title={disabled ? disabledTooltip : 'Glisser pour réorganiser'}
        className={cn(
          'shrink-0 text-muted-foreground',
          disabled
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-grab active:cursor-grabbing hover:text-foreground',
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="shrink-0 w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
        {hasImage ? (
          <Image
            src={imageUrl as string}
            alt=""
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <Drama className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate italic">{companyName}</p>
      </div>

      {extra && <div className="shrink-0 flex items-center gap-2">{extra}</div>}
    </div>
  );
}
