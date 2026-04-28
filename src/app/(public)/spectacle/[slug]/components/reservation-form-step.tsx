/**
 * ReservationFormStep — Formulaire complet de reservation
 * Derviche Diffusion - Page spectacle
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, MapPin, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { isSlotTimePast } from '@/lib/utils/timezone';

import type { TimeSlot, ReservationFormData } from '../types';

// ============================================
// HELPERS
// ============================================

/**
 * Convertit le `TimeSlot` interne (Date + "11h00") au format attendu par
 * `isSlotTimePast` (YYYY-MM-DD + "11:00").
 */
function isTimeSlotInPast(slot: TimeSlot): boolean {
  const y = slot.date.getFullYear();
  const m = String(slot.date.getMonth() + 1).padStart(2, '0');
  const d = String(slot.date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const timeStr = slot.time.replace('h', ':');
  return isSlotTimePast(dateStr, timeStr);
}

// ============================================
// PROPS
// ============================================

interface ReservationFormStepProps {
  selectedSlot: TimeSlot | null;
  participantCount: number;
  formData: ReservationFormData;
  isSubmitting: boolean;
  submitError: string | null;
  onFormDataChange: (updates: Partial<ReservationFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  /**
   * Mode « saisie par une compagnie pour un professionnel » (migration 113).
   * Modifie uniquement le libellé du CTA pour lever l'ambiguïté visuelle —
   * les champs guest restent les mêmes.
   */
  isCompanyMode?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ReservationFormStep({
  selectedSlot,
  participantCount,
  formData,
  isSubmitting,
  submitError,
  onFormDataChange,
  onSubmit,
  isCompanyMode = false,
}: ReservationFormStepProps) {
  const slotInPast = selectedSlot ? isTimeSlotInPast(selectedSlot) : false;

  return (
    <>
      {/* Bandeau « créneau passé » — affiché si l'heure du slot est antérieure
          à maintenant. Le code DB autorise déjà la réservation pour la date
          du jour même si l'heure est passée ; ce bandeau prévient
          l'utilisateur pour éviter une réservation par erreur. */}
      {slotInPast && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">
                Cette représentation a déjà commencé
              </p>
              <p className="text-muted-foreground">
                L&apos;horaire du créneau sélectionné est passé. Vous pouvez
                tout de même confirmer la réservation — une confirmation vous
                sera demandée avant l&apos;envoi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recapitulatif */}
      {selectedSlot && (
        <Card className="bg-muted mb-6">
          <CardContent className="px-4 py-1.5">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-derviche" />
                <span>
                  {selectedSlot.date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  à {selectedSlot.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-derviche" />
                <span>
                  {participantCount} personne{participantCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-derviche" />
                <span>{selectedSlot.venueName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => onFormDataChange({ lastName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              required
              value={formData.firstName}
              onChange={(e) => onFormDataChange({ firstName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormDataChange({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSecondary">Email secondaire</Label>
            <Input
              id="emailSecondary"
              type="email"
              value={formData.emailSecondary}
              onChange={(e) => onFormDataChange({ emailSecondary: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => onFormDataChange({ phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneSecondary">Téléphone secondaire</Label>
            <Input
              id="phoneSecondary"
              type="tel"
              value={formData.phoneSecondary}
              onChange={(e) => onFormDataChange({ phoneSecondary: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => onFormDataChange({ address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => onFormDataChange({ postalCode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFormDataChange({ city: e.target.value })}
            />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => onFormDataChange({ country: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Structure / Organisation</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => onFormDataChange({ organization: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="function">Fonction</Label>
            <Input
              id="function"
              value={formData.function}
              onChange={(e) => onFormDataChange({ function: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="afcNumber">Numéro AFC</Label>
          <Input
            id="afcNumber"
            value={formData.afcNumber}
            onChange={(e) => onFormDataChange({ afcNumber: e.target.value })}
            placeholder="Ex: 12345"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Demandes spéciales</Label>
          <p className="text-xs text-muted-foreground">
            PMR, placement particulier, besoin spécifique…
          </p>
          <Textarea
            id="comment"
            rows={4}
            value={formData.comment}
            onChange={(e) => onFormDataChange({ comment: e.target.value })}
          />
        </div>

        {/* Affichage de l'erreur si presente */}
        {submitError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-derviche hover:bg-derviche-dark text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Réservation en cours...
            </>
          ) : isCompanyMode ? (
            'Réserver pour ce professionnel'
          ) : (
            'Confirmer ma réservation'
          )}
        </Button>
      </form>
    </>
  );
}
