/**
 * Dialog de changement de créneau pour l'espace professionnel
 * Affiche les créneaux disponibles du même spectacle (hors créneau actuel)
 *
 * @module professional/reservations/components/ProChangeSlotDialog
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MapPin, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getProAvailableSlotsForShow, type ProAvailableSlot } from '@/lib/services/pro-reservations';

// ============================================
// HELPERS
// ============================================

function formatDateLong(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5).replace(':', 'h');
}

// ============================================
// TYPES
// ============================================

interface ProChangeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre du spectacle (affiché dans le header) */
  showTitle: string;
  /** UUID du spectacle (pour charger les créneaux) */
  showId: string;
  /** UUID du créneau actuel (exclu de la liste) */
  currentSlotId: string;
  /** Nombre de places de la réservation (filtre sur remaining_capacity) */
  numPlaces: number;
  /** Callback appelé quand le pro confirme un nouveau créneau */
  onConfirm: (newSlotId: string) => Promise<void>;
  /** Indique si la modification est en cours */
  isChanging: boolean;
}

// ============================================
// SOUS-COMPOSANT : carte créneau
// ============================================

interface SlotItemProps {
  slot: ProAvailableSlot;
  selected: boolean;
  onSelect: () => void;
}

function SlotItem({ slot, selected, onSelect }: SlotItemProps) {
  const venue = [slot.venue_name, slot.venue_city].filter(Boolean).join(', ') || 'Lieu non renseigné';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left rounded-lg border p-4 transition-all
        ${selected
          ? 'border-derviche bg-derviche/5 ring-1 ring-derviche'
          : 'border-border bg-card hover:border-derviche/40 hover:bg-muted/30'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          {/* Date + heure */}
          <div className="flex items-center gap-2 text-sm font-semibold text-derviche-dark">
            <CalendarDays className="size-4 shrink-0 text-derviche" />
            <span>{formatDateLong(slot.date)}</span>
            <span className="text-muted-foreground font-normal">à {formatTime(slot.time)}</span>
          </div>
          {/* Lieu */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{venue}</span>
          </div>

        </div>

        {/* Indicateur sélection */}
        <div
          className={`
            mt-0.5 size-5 rounded-full border-2 shrink-0 flex items-center justify-center
            ${selected ? 'border-derviche bg-derviche' : 'border-muted-foreground/30'}
          `}
        >
          {selected && (
            <div className="size-2 rounded-full bg-white" />
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ProChangeSlotDialog({
  open,
  onOpenChange,
  showTitle,
  showId,
  currentSlotId,
  numPlaces,
  onConfirm,
  isChanging,
}: ProChangeSlotDialogProps) {
  const [slots, setSlots] = useState<ProAvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Charger les créneaux à l'ouverture
  const loadSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedSlotId(null);

    const result = await getProAvailableSlotsForShow(showId, currentSlotId, numPlaces);

    if (result.error) {
      setError(result.error);
    } else {
      setSlots(result.data ?? []);
    }

    setIsLoading(false);
  }, [showId, currentSlotId, numPlaces]);

  useEffect(() => {
    if (open) {
      void loadSlots();
    }
  }, [open, loadSlots]);

  const handleConfirm = async () => {
    if (!selectedSlotId) return;
    await onConfirm(selectedSlotId);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isChanging) return; // bloquer la fermeture pendant la modification
    if (!isOpen) {
      setSelectedSlotId(null);
      setSlots([]);
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-derviche-dark">Modifier la réservation</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">{showTitle}</span> — choisissez un autre créneau disponible
          </p>
        </DialogHeader>

        {/* Contenu */}
        <div className="py-2">
          {/* Chargement */}
          {isLoading && (
            <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Chargement des créneaux…</span>
            </div>
          )}

          {/* Erreur */}
          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Impossible de charger les créneaux</p>
                <p className="text-destructive/80 mt-0.5">{error}</p>
                <button
                  type="button"
                  onClick={loadSlots}
                  className="mt-2 underline font-medium"
                  aria-label="Réessayer le chargement des créneaux"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Aucun créneau disponible */}
          {!isLoading && !error && slots.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <CalendarDays className="size-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucun autre créneau disponible
              </p>
              <p className="text-xs text-muted-foreground/70">
                Il n&apos;y a pas d&apos;autre créneau avec {numPlaces} place{numPlaces > 1 ? 's' : ''} disponible{numPlaces > 1 ? 's' : ''} pour ce spectacle.
              </p>
            </div>
          )}

          {/* Liste des créneaux */}
          {!isLoading && !error && slots.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <SlotItem
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlotId === slot.id}
                  onSelect={() => setSelectedSlotId(slot.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isChanging}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlotId || isChanging}
            className="bg-derviche hover:bg-derviche-dark"
          >
            {isChanging ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Modification…
              </>
            ) : (
              'Confirmer le changement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
