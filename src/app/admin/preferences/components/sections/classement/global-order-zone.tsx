/**
 * GlobalOrderZone — Zone 2 de l'onglet Classement
 * Derviche Diffusion — Migration 111
 *
 * Permet à l'admin de définir `display_order` pour l'ensemble des spectacles
 * (tous statuts confondus). Piloté à la fois par drag&drop et par input
 * numérique. Save automatique.
 *
 * Le drag&drop est DÉSACTIVÉ tant qu'un filtre (search ou status) est actif,
 * pour éviter les corruptions d'ordre sur liste filtrée.
 */

'use client';

import { useMemo, useState } from 'react';
import { ListOrdered, Search, Star, RotateCcw } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShowRanking } from '@/lib/services/shows/ranking';
import type { UseShowsRankingReturn } from '@/hooks/useShowsRanking';
import type { ShowStatus } from '@/types/database';
import { SortableRow } from './sortable-row';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | ShowStatus;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface GlobalOrderZoneProps {
  shows: ShowRanking[];
  isLoading: boolean;
  canEdit: boolean;
  onReorderAll: UseShowsRankingReturn['reorderAll'];
  onSetDisplayOrder: UseShowsRankingReturn['setDisplayOrder'];
  onResetGlobalOrder: UseShowsRankingReturn['resetGlobalOrder'];
}

export function GlobalOrderZone({
  shows,
  isLoading,
  canEdit,
  onReorderAll,
  onSetDisplayOrder,
  onResetGlobalOrder,
}: GlobalOrderZoneProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filterActive = search.trim() !== '' || statusFilter !== 'all';

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return shows.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (q && !norm(s.title).includes(q) && !norm(s.companyName).includes(q))
        return false;
      return true;
    });
  }, [shows, search, statusFilter]);

  const ids = useMemo(() => filtered.map((s) => s.id), [filtered]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Reorder sur la liste complète (ids vient de filtered, mais filterActive
    // est bloqué plus haut → ids === shows.map(s=>s.id)).
    const fullIds = shows.map((s) => s.id);
    const oldIndex = fullIds.indexOf(active.id as string);
    const newIndex = fullIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const nextOrder = arrayMove(fullIds, oldIndex, newIndex);
    const result = await onReorderAll(nextOrder);
    if (result.success) toast.success('Ordre global mis à jour');
    else toast.error(result.error ?? 'Erreur lors du réordonnement');
  };

  const handleOrderBlur = async (
    id: string,
    raw: string,
    currentOrder: number | null,
  ): Promise<void> => {
    const trimmed = raw.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && (Number.isNaN(parsed) || parsed === null || parsed < 0)) {
      toast.error('Rang invalide (entier positif ou vide)');
      return;
    }
    if (parsed === currentOrder) return;
    const result = await onSetDisplayOrder(id, parsed);
    if (result.success) toast.success('Rang mis à jour');
    else toast.error(result.error ?? 'Erreur lors de la mise à jour');
  };

  const handleReset = async (): Promise<void> => {
    if (!window.confirm('Réinitialiser tous les rangs (retour au tri alphabétique) ?')) {
      return;
    }
    const result = await onResetGlobalOrder();
    if (result.success) toast.success('Ordre réinitialisé');
    else toast.error(result.error ?? 'Erreur lors de la réinitialisation');
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-1.5">
          <ListOrdered className="h-4 w-4 text-muted-foreground" />
          Ordre global — Catalogue &amp; carousel page d&apos;accueil
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez l&apos;ordre d&apos;affichage éditorial. Les spectacles
          sont triés d&apos;abord par statut (disponibles en premier), puis par
          cet ordre, puis par titre en tie-break.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un spectacle ou une compagnie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterActive && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
          Filtres actifs : le drag&amp;drop est désactivé pour éviter les conflits. Effacez les filtres pour réordonner.
        </p>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          Aucun spectacle ne correspond aux filtres.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filtered.map((show) => (
                <SortableRow
                  key={show.id}
                  id={show.id}
                  title={show.title}
                  companyName={show.companyName}
                  imageUrl={show.imageUrl}
                  disabled={!canEdit || filterActive}
                  disabledTooltip={
                    filterActive
                      ? 'Effacez les filtres pour réordonner'
                      : undefined
                  }
                  extra={
                    <>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider',
                          show.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : show.status === 'draft'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-orange-100 text-orange-700',
                        )}
                      >
                        {show.status === 'published'
                          ? 'Publié'
                          : show.status === 'draft'
                            ? 'Brouillon'
                            : 'Archivé'}
                      </span>
                      {show.isFeatured && (
                        <Star
                          className="h-3.5 w-3.5 text-gold"
                          fill="currentColor"
                          aria-label="En vedette"
                        />
                      )}
                      <DisplayOrderInput
                        key={`${show.id}-${show.displayOrder ?? 'null'}`}
                        show={show}
                        canEdit={canEdit}
                        onBlur={handleOrderBlur}
                      />
                    </>
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {canEdit && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleReset()}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser l&apos;ordre
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-component : input numérique "Rang"
// ============================================

interface DisplayOrderInputProps {
  show: ShowRanking;
  canEdit: boolean;
  onBlur: (id: string, raw: string, currentOrder: number | null) => Promise<void>;
}

function DisplayOrderInput({ show, canEdit, onBlur }: DisplayOrderInputProps) {
  const [value, setValue] = useState<string>(
    show.displayOrder === null ? '' : String(show.displayOrder),
  );

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      placeholder="—"
      title="Rang (vide = fin de liste)"
      disabled={!canEdit}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void onBlur(show.id, value, show.displayOrder)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className="w-16 h-8 text-xs"
    />
  );
}
