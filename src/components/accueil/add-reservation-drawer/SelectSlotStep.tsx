/**
 * SelectSlotStep — Sélection show + créneau
 * Derviche Diffusion
 *
 * Étape 1 du drawer quand aucun slotId n'est pré-fourni (FAB depuis /accueil).
 * Utilise getAccessibleShows + getAvailableSlotsForShow.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Theater, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { getAccessibleShows } from '@/lib/services/checkin';
import { getAvailableSlotsForShow } from '@/lib/services/admin-reservations';
import { logger } from '@/lib/logger';
import { formatDateFr } from '@/lib/utils/format-date';

// ============================================
// TYPES LOCAUX
// ============================================

interface ShowOption {
  id: string;
  title: string;
}

interface SlotOption {
  id: string;
  date: string;
  time: string;
  venueName: string;
  remainingCapacity: number | null;
}

export interface SelectSlotStepProps {
  onSlotSelected: (slotId: string) => void;
  disabled?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function SelectSlotStep({ onSlotSelected, disabled }: SelectSlotStepProps) {
  const { userId, role, companyId } = useCheckinAccess();

  const [shows, setShows] = useState<ShowOption[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);

  const [selectedShowId, setSelectedShowId] = useState('');
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');

  // Charger les spectacles au montage
  useEffect(() => {
    if (!userId || !role) return;

    let cancelled = false;
    setLoadingShows(true);

    void (async () => {
      try {
        const result = await getAccessibleShows(userId, role, companyId ?? null);
        if (!cancelled && !result.error) {
          setShows(result.data.map((s) => ({ id: s.id, title: s.title })));
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('[SelectSlotStep] Erreur chargement spectacles', { err: String(err) });
        }
      } finally {
        if (!cancelled) setLoadingShows(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, role, companyId]);

  // Charger les créneaux quand un spectacle est sélectionné
  const handleShowChange = useCallback(async (showId: string) => {
    setSelectedShowId(showId);
    setSelectedSlotId('');
    setSlots([]);
    if (!showId) return;

    setLoadingSlots(true);
    try {
      const result = await getAvailableSlotsForShow(showId);
      if (!result.error) {
        setSlots(
          result.data.map((s) => ({
            id: s.id,
            date: s.date,
            time: s.time,
            venueName: s.venue?.name ?? '',
            remainingCapacity: s.remainingCapacity,
          }))
        );
      }
    } catch (err) {
      logger.error('[SelectSlotStep] Erreur chargement créneaux', { err: String(err) });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const canContinue = !!selectedSlotId && !disabled;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Sélectionnez le spectacle et la représentation pour cette réservation.
      </p>

      {/* Sélecteur spectacle */}
      <div className="space-y-2">
        <Label htmlFor="select-show" className="flex items-center gap-1.5">
          <Theater className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          Spectacle
        </Label>
        {loadingShows ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <Select
            value={selectedShowId}
            onValueChange={(v) => void handleShowChange(v)}
            disabled={disabled || loadingShows}
          >
            <SelectTrigger id="select-show" aria-label="Choisir un spectacle">
              <SelectValue placeholder="Choisir un spectacle…" />
            </SelectTrigger>
            <SelectContent>
              {shows.map((show) => (
                <SelectItem key={show.id} value={show.id}>
                  {show.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sélecteur créneau */}
      {selectedShowId && (
        <div className="space-y-2">
          <Label htmlFor="select-slot" className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            Représentation
          </Label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune représentation disponible pour ce spectacle.
            </p>
          ) : (
            <Select
              value={selectedSlotId}
              onValueChange={setSelectedSlotId}
              disabled={disabled || loadingSlots}
            >
              <SelectTrigger id="select-slot" aria-label="Choisir une représentation">
                <SelectValue placeholder="Choisir une représentation…" />
              </SelectTrigger>
              <SelectContent>
                {slots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    <span className="flex items-center gap-2">
                      <span>
                        {formatDateFr(slot.date)}{slot.time ? ` à ${slot.time.slice(0, 5)}` : ''}
                      </span>
                      {slot.venueName && (
                        <span className="text-muted-foreground text-xs">
                          — {slot.venueName}
                        </span>
                      )}
                      {slot.remainingCapacity !== null && (
                        <span className="text-xs text-muted-foreground">
                          ({slot.remainingCapacity} pl.)
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* CTA */}
      <Button
        type="button"
        onClick={() => onSlotSelected(selectedSlotId)}
        disabled={!canContinue}
        className="w-full bg-derviche hover:bg-derviche/90"
      >
        Continuer
      </Button>
    </div>
  );
}
