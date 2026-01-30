/**
 * Dialog de sélection des colonnes - Version Compagnie
 * Derviche Diffusion
 * 
 * Permet de choisir et réorganiser les colonnes du tableau des réservations
 * EXCLUT: checkinInternalNotes (notes internes réservées à l'admin)
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { GripVertical, Loader2 } from 'lucide-react';
import {
  COMPANY_RESERVATION_COLUMNS_CONFIG,
  DEFAULT_COMPANY_COLUMNS_ORDER,
  DEFAULT_COMPANY_VISIBLE_COLUMNS,
  type CompanyReservationColumn,
  type CompanyReservationColumnsPreference,
} from '@/hooks/useUserPreferences';

// ============================================
// COMPOSANT ITEM DRAGGABLE
// ============================================

interface SortableColumnItemProps {
  id: CompanyReservationColumn;
  label: string;
  isVisible: boolean;
  onToggle: () => void;
}

const SortableColumnItem = React.memo(function SortableColumnItem({ 
  id, 
  label, 
  isVisible, 
  onToggle 
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-2 rounded-md border bg-background
        ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
        ${isVisible ? 'border-derviche/30 bg-derviche/5' : 'border-border'}
      `}
    >
      {/* Handle de drag */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        aria-label={`Réorganiser la colonne ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Checkbox + Label */}
      <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
        <Checkbox
          checked={isVisible}
          onCheckedChange={onToggle}
          aria-label={`Afficher la colonne ${label}`}
        />
        <span className={`text-sm ${isVisible ? 'font-medium' : 'text-muted-foreground'}`}>
          {label}
        </span>
      </label>
    </div>
  );
});

SortableColumnItem.displayName = 'SortableColumnItem';

// ============================================
// COMPOSANT DIALOG PRINCIPAL
// ============================================

interface CompanyColumnSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preference: CompanyReservationColumnsPreference;
  onSave: (preference: CompanyReservationColumnsPreference) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export const CompanyColumnSelectorDialog = React.memo(function CompanyColumnSelectorDialog({
  open,
  onOpenChange,
  preference,
  onSave,
  isSaving,
}: CompanyColumnSelectorDialogProps) {
  // État local pour l'édition
  const [order, setOrder] = useState<CompanyReservationColumn[]>(preference.order);
  const [visible, setVisible] = useState<CompanyReservationColumn[]>(preference.visible);

  // Reset quand la modale s'ouvre
  useEffect(() => {
    if (open) {
      setOrder(preference.order);
      setVisible(preference.visible);
    }
  }, [open, preference]);

  // Sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Évite les clics accidentels
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler de fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.indexOf(active.id as CompanyReservationColumn);
        const newIndex = items.indexOf(over.id as CompanyReservationColumn);
        
        // Validation: éviter les indices invalides (-1)
        if (oldIndex === -1 || newIndex === -1) {
          return items;
        }
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Toggle visibilité d'une colonne
  const toggleColumn = (col: CompanyReservationColumn) => {
    setVisible((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  // Sauvegarder
  const handleSave = async () => {
    await onSave({ order, visible });
  };

  // Réinitialiser à l'ordre par défaut
  const handleReset = () => {
    setOrder(DEFAULT_COMPANY_COLUMNS_ORDER);
    setVisible(DEFAULT_COMPANY_VISIBLE_COLUMNS);
  };

  // Nombre de colonnes visibles
  const visibleCount = visible.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Colonnes du tableau</DialogTitle>
          <DialogDescription>
            Cochez les colonnes à afficher et glissez pour réorganiser.
            <br />
            <span className="text-xs">{visibleCount} colonne{visibleCount > 1 ? 's' : ''} visible{visibleCount > 1 ? 's' : ''}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto py-2 space-y-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {order.map((col) => (
                <SortableColumnItem
                  key={col}
                  id={col}
                  label={COMPANY_RESERVATION_COLUMNS_CONFIG[col].label}
                  isVisible={visible.includes(col)}
                  onToggle={() => toggleColumn(col)}
                />
              ))}
            </SortableContext>
          </DndContext>
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
          <Button onClick={handleSave} disabled={isSaving || visibleCount === 0}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CompanyColumnSelectorDialog.displayName = 'CompanyColumnSelectorDialog';
