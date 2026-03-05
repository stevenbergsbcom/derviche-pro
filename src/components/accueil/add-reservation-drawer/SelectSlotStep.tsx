/**
 * SelectSlotStep — Sélection show + créneau
 * Derviche Diffusion
 *
 * Étape 1 du drawer quand aucun slotId n'est pré-fourni (FAB depuis /accueil).
 * Utilise getAccessibleShows + getAvailableSlotsForShow.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Theater, Calendar, Check as CheckIcon } from 'lucide-react';
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
  const [showListOpen, setShowListOpen] = useState(true);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slotListOpen, setSlotListOpen] = useState(true);

  // Charger les spectacles au montage
  useEffect(() => {
    if (!userId || !role) return;

    let cancelled = false;
    setLoadingShows(true);

    void (async () => {
      try {
        const result = await getAccessibleShows(userId, role, companyId ?? null);
        if (!cancelled && !result.error) {
          // Filtrer : uniquement les spectacles avec au moins un créneau futur
          setShows(
            result.data
              .filter((s) => s.upcomingSlotsCount > 0)
              .map((s) => ({ id: s.id, title: s.title }))
          );
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
    setShowListOpen(false);
    setSelectedSlotId('');
    setSlotListOpen(true);
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
    <div className="space-y-6">

      {/* Spectacles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Theater className="w-4 h-4" aria-hidden="true" />
            Spectacle
          </p>
          {/* Bouton Changer — visible seulement quand liste fermée et spectacle sélectionné */}
          {!showListOpen && selectedShowId && (
            <button
              type="button"
              onClick={() => setShowListOpen(true)}
              className="text-sm text-derviche underline underline-offset-2 hover:text-derviche/80"
            >
              Changer
            </button>
          )}
        </div>

        {loadingShows ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : shows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Aucun spectacle disponible.</p>
        ) : showListOpen ? (
          /* Liste complète */
          <div className="space-y-2" role="radiogroup" aria-label="Choisir un spectacle">
            {shows.map((show) => {
              const isSelected = selectedShowId === show.id;
              return (
                <button
                  key={show.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => void handleShowChange(show.id)}
                  disabled={disabled}
                  className={[
                    'w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-derviche',
                    isSelected
                      ? 'border-derviche bg-derviche/5'
                      : 'border-border hover:border-derviche/40 hover:bg-muted/50',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className={`text-base font-medium ${isSelected ? 'text-derviche' : ''}`}>
                      {show.title}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-derviche flex items-center justify-center shrink-0">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Carte résumé — spectacle sélectionné */
          <div className="rounded-xl border-2 border-derviche bg-derviche/5 px-4 py-3.5">
            <span className="flex items-center justify-between gap-3">
              <span className="text-base font-medium text-derviche">
                {shows.find((s) => s.id === selectedShowId)?.title}
              </span>
              <span className="w-5 h-5 rounded-full bg-derviche flex items-center justify-center shrink-0">
                <CheckIcon className="w-3 h-3 text-white" />
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Créneaux */}
      {selectedShowId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Représentation
            </p>
            {!slotListOpen && selectedSlotId && (
              <button
                type="button"
                onClick={() => setSlotListOpen(true)}
                className="text-sm text-derviche underline underline-offset-2 hover:text-derviche/80"
              >
                Changer
              </button>
            )}
          </div>

          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune représentation disponible.
            </p>
          ) : slotListOpen ? (
            /* Liste complète */
            <div className="space-y-2" role="radiogroup" aria-label="Choisir une représentation">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const label = `${formatDateFr(slot.date)}${slot.time ? ` à ${slot.time.slice(0, 5)}` : ''}`;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedSlotId(slot.id);
                      setSlotListOpen(false);
                    }}
                    disabled={disabled}
                    className={[
                      'w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-derviche',
                      isSelected
                        ? 'border-derviche bg-derviche/5'
                        : 'border-border hover:border-derviche/40 hover:bg-muted/50',
                      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="space-y-0.5">
                        <span className={`block text-base font-medium ${isSelected ? 'text-derviche' : ''}`}>
                          {label}
                        </span>
                        {slot.venueName && (
                          <span className="block text-sm text-muted-foreground">
                            {slot.venueName}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-derviche flex items-center justify-center shrink-0">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Carte résumé — créneau sélectionné */
            (() => {
              const slot = slots.find((s) => s.id === selectedSlotId);
              const label = slot ? `${formatDateFr(slot.date)}${slot.time ? ` à ${slot.time.slice(0, 5)}` : ''}` : '';
              return (
                <div className="rounded-xl border-2 border-derviche bg-derviche/5 px-4 py-3.5">
                  <span className="flex items-center justify-between gap-3">
                    <span className="space-y-0.5">
                      <span className="block text-base font-medium text-derviche">{label}</span>
                      {slot?.venueName && (
                        <span className="block text-sm text-muted-foreground">{slot.venueName}</span>
                      )}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-derviche flex items-center justify-center shrink-0">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </span>
                  </span>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* CTA */}
      <Button
        type="button"
        onClick={() => onSlotSelected(selectedSlotId)}
        disabled={!canContinue}
        className="w-full h-12 text-base bg-derviche hover:bg-derviche/90"
      >
        Continuer
      </Button>
    </div>
  );
}
