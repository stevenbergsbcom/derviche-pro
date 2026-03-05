/**
 * ReservationFormStep — Étape 2 du drawer walk-in
 * Derviche Diffusion
 *
 * Formulaire complet de création de réservation on-the-spot :
 *   - Sélection spectacle + créneau + nombre de places
 *   - Informations personnelles et professionnelles
 *   - Statut de check-in optionnel à la création
 *   - Notes (venue, internes admin only)
 *   - Switches notification
 *   - Gestion avertissement capacité + override
 */

'use client';

import { useCallback } from 'react';
import {
  Calendar,
  User,
  Building,
  FileText,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationSwitches } from '@/components/admin/reservations/notification-switches';
import { formatDateFr } from '@/components/admin/reservations/reservation-helpers';
import { CHECKIN_STATUS_OPTIONS } from '../constants';
import type { WalkInFormData, SlotOption, ShowOption, CapacityWarning } from '../types';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// ============================================
// TYPES
// ============================================

interface ReservationFormStepProps {
  formData: WalkInFormData;
  onFieldChange: <K extends keyof WalkInFormData>(field: K, value: WalkInFormData[K]) => void;
  onShowChange: (showId: string) => Promise<void>;

  shows: ShowOption[];
  loadingShows: boolean;
  slots: SlotOption[];
  loadingSlots: boolean;

  isAdmin: boolean;
  isSubmitting: boolean;

  notifOptions: NotificationOptions;
  onNotifChange: (opts: NotificationOptions) => void;

  capacityWarning: CapacityWarning | null;
  onClearCapacityWarning: () => void;

  submitError: string | null;

  onBack: () => void;
  onSubmit: () => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

function formatSlotOption(slot: SlotOption): string {
  const date = formatDateFr(slot.date);
  const venue = slot.venueName || 'Lieu ?';
  if (slot.remainingCapacity <= 0) {
    return `${date} ${slot.time} — ${venue} (Complet)`;
  }
  return `${date} ${slot.time} — ${venue} (${slot.remainingCapacity} dispo)`;
}

// ============================================
// COMPOSANT
// ============================================

export function ReservationFormStep({
  formData,
  onFieldChange,
  onShowChange,
  shows,
  loadingShows,
  slots,
  loadingSlots,
  isAdmin,
  isSubmitting,
  notifOptions,
  onNotifChange,
  capacityWarning,
  onClearCapacityWarning,
  submitError,
  onBack,
  onSubmit,
}: ReservationFormStepProps) {
  const handleShowChange = useCallback(
    (showId: string) => {
      void onShowChange(showId);
    },
    [onShowChange]
  );

  const canSubmit =
    !isSubmitting &&
    !!formData.slotId &&
    !!formData.firstName.trim() &&
    !!formData.lastName.trim() &&
    !!formData.email.trim();

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────
          SECTION : Spectacle & Créneau
      ───────────────────────────────────────── */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          Spectacle et créneau
        </h4>

        {/* Spectacle */}
        <div className="space-y-2">
          <Label htmlFor="walkin-show">Spectacle *</Label>
          <Select
            value={formData.showId}
            onValueChange={handleShowChange}
            disabled={isSubmitting || loadingShows}
          >
            <SelectTrigger id="walkin-show" aria-label="Sélectionner un spectacle">
              <SelectValue placeholder={loadingShows ? 'Chargement…' : 'Sélectionner un spectacle'} />
            </SelectTrigger>
            <SelectContent>
              {shows.length === 0 ? (
                <SelectItem value="_none" disabled>
                  Aucun spectacle disponible
                </SelectItem>
              ) : (
                shows.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Créneau */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="walkin-slot">Créneau *</Label>
            {!formData.showId ? (
              <p className="text-sm text-muted-foreground py-2">
                Sélectionnez d&apos;abord un spectacle
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Chargement des créneaux…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Aucun créneau disponible</p>
            ) : (
              <Select
                value={formData.slotId}
                onValueChange={(v) => onFieldChange('slotId', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="walkin-slot" aria-label="Sélectionner un créneau">
                  <SelectValue placeholder="Sélectionner un créneau" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatSlotOption(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nombre de places */}
          <div className="space-y-2">
            <Label htmlFor="walkin-num-places">Nombre de places *</Label>
            <Input
              id="walkin-num-places"
              type="number"
              min={1}
              max={10}
              value={formData.numPlaces}
              onChange={(e) =>
                onFieldChange('numPlaces', Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              disabled={isSubmitting || !formData.slotId}
            />
          </div>
        </div>

        {/* Statut check-in optionnel */}
        <div className="space-y-2">
          <Label htmlFor="walkin-checkin-status">
            Statut de présence{' '}
            <span className="text-muted-foreground font-normal">(optionnel)</span>
          </Label>
          <Select
            value={formData.checkinStatus ?? '_none'}
            onValueChange={(v) =>
              onFieldChange('checkinStatus', v === '_none' ? null : (v as WalkInFormData['checkinStatus']))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="walkin-checkin-status" aria-label="Statut de présence">
              <SelectValue placeholder="Non pointé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Non pointé</SelectItem>
              {CHECKIN_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          SECTION : Informations personnelles
      ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          Informations personnelles
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="walkin-firstname">Prénom *</Label>
            <Input
              id="walkin-firstname"
              value={formData.firstName}
              onChange={(e) => onFieldChange('firstName', e.target.value)}
              placeholder="Jean"
              disabled={isSubmitting}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-lastname">Nom *</Label>
            <Input
              id="walkin-lastname"
              value={formData.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
              placeholder="Dupont"
              disabled={isSubmitting}
              autoComplete="family-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-email">Email *</Label>
            <Input
              id="walkin-email"
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="jean.dupont@theatre.fr"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-phone">Téléphone</Label>
            <Input
              id="walkin-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-email2">Email secondaire</Label>
            <Input
              id="walkin-email2"
              type="email"
              value={formData.emailSecondary}
              onChange={(e) => onFieldChange('emailSecondary', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-phone2">Tél. secondaire</Label>
            <Input
              id="walkin-phone2"
              type="tel"
              value={formData.phoneSecondary}
              onChange={(e) => onFieldChange('phoneSecondary', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ─────────────────────────────────────────
          SECTION : Informations professionnelles
      ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Building className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          Informations professionnelles
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="walkin-org">Structure / Organisation</Label>
            <Input
              id="walkin-org"
              value={formData.organization}
              onChange={(e) => onFieldChange('organization', e.target.value)}
              placeholder="Théâtre Municipal"
              disabled={isSubmitting}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="walkin-function">Fonction</Label>
            <Input
              id="walkin-function"
              value={formData.function}
              onChange={(e) => onFieldChange('function', e.target.value)}
              placeholder="Directeur artistique"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="walkin-afc">Numéro AFC</Label>
            <Input
              id="walkin-afc"
              value={formData.afcNumber}
              onChange={(e) => onFieldChange('afcNumber', e.target.value)}
              placeholder="AFC-12345"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ─────────────────────────────────────────
          SECTION : Notes
      ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          Notes
        </h4>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="walkin-venue-notes">Notes lieu</Label>
            <Textarea
              id="walkin-venue-notes"
              value={formData.checkinVenueNotes}
              onChange={(e) => onFieldChange('checkinVenueNotes', e.target.value)}
              placeholder="Informations spécifiques au lieu…"
              disabled={isSubmitting}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Notes internes : admin uniquement */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="walkin-internal-notes">
                Notes internes{' '}
                <span className="text-xs text-muted-foreground font-normal">(admin)</span>
              </Label>
              <Textarea
                id="walkin-internal-notes"
                value={formData.checkinInternalNotes}
                onChange={(e) => onFieldChange('checkinInternalNotes', e.target.value)}
                placeholder="Notes confidentielles pour l'équipe…"
                disabled={isSubmitting}
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ─────────────────────────────────────────
          SECTION : Notifications
      ───────────────────────────────────────── */}
      <NotificationSwitches
        value={notifOptions}
        onChange={onNotifChange}
        disabled={isSubmitting}
        label="Notifications"
      />

      {/* ─────────────────────────────────────────
          AVERTISSEMENT CAPACITÉ
      ───────────────────────────────────────── */}
      {capacityWarning && (
        <div
          role="alert"
          className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-orange-800">
              Capacité insuffisante
            </span>
          </div>
          <p className="text-sm text-orange-700 pl-6">
            Il reste{' '}
            <strong>{capacityWarning.remaining}</strong> place
            {capacityWarning.remaining > 1 ? 's' : ''} sur ce créneau,
            mais vous demandez{' '}
            <strong>{capacityWarning.requested}</strong> place
            {capacityWarning.requested > 1 ? 's' : ''}.
          </p>
          {isAdmin ? (
            <div className="flex gap-2 pl-6">
              <Button
                size="sm"
                variant="outline"
                onClick={onClearCapacityWarning}
                disabled={isSubmitting}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onFieldChange('overrideCapacity', true);
                  void onSubmit();
                }}
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Forcer quand même
              </Button>
            </div>
          ) : (
            <p className="text-xs text-orange-600 pl-6">
              Seul un admin peut forcer la création sur un créneau complet.
            </p>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────
          ERREUR SOUMISSION
      ───────────────────────────────────────── */}
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* ─────────────────────────────────────────
          BOUTONS D'ACTION
      ───────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-none"
          aria-label="Retour à la recherche email"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Retour
        </Button>
        <Button
          onClick={() => void onSubmit()}
          disabled={!canSubmit || !!capacityWarning}
          className="flex-1 bg-derviche hover:bg-derviche/90"
          aria-label="Créer la réservation"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Création…
            </>
          ) : (
            'Créer la réservation'
          )}
        </Button>
      </div>
    </div>
  );
}
