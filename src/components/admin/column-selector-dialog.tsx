'use client';

import { useState, useEffect } from 'react';
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
  RESERVATION_COLUMNS_CONFIG,
  DEFAULT_COLUMNS_ORDER,
  DEFAULT_VISIBLE_COLUMNS,
  type ReservationColumn,
  type ReservationColumnsPreference,
} from '@/hooks/useUserPreferences';

// ============================================
// COMPOSANT ITEM DRAGGABLE
// ============================================

interface SortableColumnItemProps {
  id: ReservationColumn;
  label: string;
  isVisible: boolean;
  onToggle: () => void;
}

function SortableColumnItem({ id, label, isVisible, onToggle }: SortableColumnItemProps) {
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
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Checkbox + Label */}
      <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
        <Checkbox
          checked={isVisible}
          onCheckedChange={onToggle}
        />
        <span className={`text-sm ${isVisible ? 'font-medium' : 'text-muted-foreground'}`}>
          {label}
        </span>
      </label>
    </div>
  );
}

// ============================================
// COMPOSANT DIALOG PRINCIPAL
// ============================================

interface ColumnSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preference: ReservationColumnsPreference;
  onSave: (preference: ReservationColumnsPreference) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export function ColumnSelectorDialog({
  open,
  onOpenChange,
  preference,
  onSave,
  isSaving,
}: ColumnSelectorDialogProps) {
  // État local pour l'édition
  const [order, setOrder] = useState<ReservationColumn[]>(preference.order);
  const [visible, setVisible] = useState<ReservationColumn[]>(preference.visible);

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
        const oldIndex = items.indexOf(active.id as ReservationColumn);
        const newIndex = items.indexOf(over.id as ReservationColumn);
        
        // Validation: éviter les indices invalides (-1)
        if (oldIndex === -1 || newIndex === -1) {
          return items; // Retourner le tableau inchangé
        }
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Toggle visibilité d'une colonne
  const toggleColumn = (col: ReservationColumn) => {
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
    setOrder(DEFAULT_COLUMNS_ORDER);
    setVisible(DEFAULT_VISIBLE_COLUMNS);
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
                  label={RESERVATION_COLUMNS_CONFIG[col].label}
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
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
