/**
 * SelectSlotStep — Sélection show + créneau
 * Derviche Diffusion
 *
 * Étape 1 du drawer quand aucun slotId n'est pré-fourni (FAB depuis /accueil).
 * Utilise getAccessibleShows + getAvailableSlotsForShow.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Theater, Calendar, Check as CheckIcon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  /** True quand la date/heure du slot est antérieure à maintenant. */
  isPast: boolean;
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

  // Case "Inclure représentations passées" — réservée super-admin/admin
  // pour du rattrapage a posteriori (résa oubliée sur J-1 par exemple).
  // Le service applique la même règle côté serveur en défense en profondeur.
  const canIncludePast = role === 'super-admin' || role === 'admin';
  const [includePast, setIncludePast] = useState(false);

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

  // Charger les créneaux d'un show. Extrait comme fonction utilitaire pour
  // pouvoir être réappelée à la bascule de "Inclure représentations passées"
  // sans réinitialiser la sélection de spectacle.
  const loadSlotsForShow = useCallback(async (showId: string, withPast: boolean) => {
    if (!showId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const options: { hostedBy?: 'company'; includePast?: boolean } = {};
      if (role === 'company') options.hostedBy = 'company';
      if (withPast) options.includePast = true;
      const result = await getAvailableSlotsForShow(showId, options);
      if (!result.error) {
        setSlots(
          result.data.map((s) => ({
            id: s.id,
            date: s.date,
            time: s.time,
            venueName: s.venue?.name ?? '',
            remainingCapacity: s.remainingCapacity,
            isPast: s.isPast,
          }))
        );
      }
    } catch (err) {
      logger.error('[SelectSlotStep] Erreur chargement créneaux', { err: String(err) });
    } finally {
      setLoadingSlots(false);
    }
  }, [role]);

  // Charger les créneaux quand un spectacle est sélectionné
  // Pour le rôle company : filtre hosted_by='company' pour ne voir
  // que les créneaux dont elle est responsable de l'accueil.
  const handleShowChange = useCallback(async (showId: string) => {
    setSelectedShowId(showId);
    setShowListOpen(false);
    setSelectedSlotId('');
    setSlotListOpen(true);
    setSlots([]);
    if (!showId) return;
    await loadSlotsForShow(showId, includePast);
  }, [loadSlotsForShow, includePast]);

  // Bascule "Inclure représentations passées" — recharge les slots du show
  // courant avec la nouvelle option et réinitialise la sélection.
  const handleIncludePastToggle = useCallback(async (value: boolean) => {
    setIncludePast(value);
    setSelectedSlotId('');
    setSlotListOpen(true);
    if (selectedShowId) {
      await loadSlotsForShow(selectedShowId, value);
    }
  }, [selectedShowId, loadSlotsForShow]);

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

          {/*
            Case "Inclure les représentations passées" — visible uniquement
            pour super-admin/admin. Pour rattraper une résa oubliée sur la
            représentation d'hier. Email + Google Calendar sont décochés
            automatiquement à la sélection d'un slot passé (voir
            useAddReservation).
          */}
          {canIncludePast && (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-3">
              <Checkbox
                id="include-past-slots-pwa"
                checked={includePast}
                onCheckedChange={(checked) => void handleIncludePastToggle(checked === true)}
                disabled={disabled || loadingSlots}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="include-past-slots-pwa"
                  className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" aria-hidden="true" />
                  Inclure les représentations passées
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rattrapage d&apos;une réservation oubliée. Email et sync
                  Google Calendar seront désactivés automatiquement.
                </p>
              </div>
            </div>
          )}

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
                          {slot.isPast && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning align-middle">
                              Passée
                            </span>
                          )}
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
                      <span className="block text-base font-medium text-derviche">
                        {label}
                        {slot?.isPast && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning align-middle">
                            Passée
                          </span>
                        )}
                      </span>
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
