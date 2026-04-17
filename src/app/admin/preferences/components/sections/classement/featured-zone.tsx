/**
 * FeaturedZone — Zone 1 de l'onglet Classement
 * Derviche Diffusion — Migration 111
 *
 * Gère la sélection + l'ordre des spectacles en vedette (HeroSection).
 * Save automatique après chaque drag / add / remove.
 */

'use client';

import { useMemo } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ShowRanking } from '@/lib/services/shows/ranking';
import type { UseShowsRankingReturn } from '@/hooks/useShowsRanking';
import { SortableRow } from './sortable-row';
import { AddFeaturedPopover } from './add-featured-popover';

interface FeaturedZoneProps {
  featured: ShowRanking[];
  nonFeatured: ShowRanking[];
  isLoading: boolean;
  canEdit: boolean;
  onSetFeatured: UseShowsRankingReturn['setFeatured'];
  onReorderFeatured: UseShowsRankingReturn['reorderFeatured'];
}

export function FeaturedZone({
  featured,
  nonFeatured,
  isLoading,
  canEdit,
  onSetFeatured,
  onReorderFeatured,
}: FeaturedZoneProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => featured.map((s) => s.id), [featured]);

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const nextOrder = arrayMove(ids, oldIndex, newIndex);
    const result = await onReorderFeatured(nextOrder);
    if (result.success) toast.success('Ordre des vedettes mis à jour');
    else toast.error(result.error ?? 'Erreur lors du réordonnement');
  };

  const handleRemove = async (id: string): Promise<void> => {
    const result = await onSetFeatured(id, false);
    if (result.success) toast.success('Spectacle retiré des vedettes');
    else toast.error(result.error ?? 'Erreur lors du retrait');
  };

  const handleAdd = async (id: string): Promise<void> => {
    const result = await onSetFeatured(id, true);
    if (result.success) toast.success('Spectacle ajouté aux vedettes');
    else toast.error(result.error ?? 'Erreur lors de l\'ajout');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-gold" fill="currentColor" />
            En vedette — Slider page d&apos;accueil
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Glissez-déposez pour réordonner. Seuls ces spectacles apparaissent
            dans le slider hero de la page d&apos;accueil. Si aucun n&apos;est
            sélectionné, le slider est masqué.
          </p>
        </div>
        {canEdit && (
          <AddFeaturedPopover candidates={nonFeatured} onSelect={handleAdd} />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : featured.length === 0 ? (
        <p className="text-sm text-muted-foreground italic border border-dashed rounded-md p-6 text-center">
          Aucun spectacle en vedette → le slider hero est masqué.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {featured.map((show) => (
                <SortableRow
                  key={show.id}
                  id={show.id}
                  title={show.title}
                  companyName={show.companyName}
                  imageUrl={show.imageUrl}
                  disabled={!canEdit}
                  extra={
                    canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => void handleRemove(show.id)}
                        aria-label={`Retirer ${show.title} des vedettes`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
