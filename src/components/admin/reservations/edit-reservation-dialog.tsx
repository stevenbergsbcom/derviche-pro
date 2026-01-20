/**
 * Dialog de modification d'une réservation
 * Derviche Diffusion
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  AlertTriangle,
  Calendar,
  Ban,
  AlertCircle,
} from 'lucide-react';
import type { AdminReservation, UpdateReservationData } from '@/lib/services/admin-reservations';
import { formatDateFr, formatDateTimeFr } from './reservation-helpers';

// ============================================
// TYPES
// ============================================

interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  venue: { id: string; name: string; city: string } | null;
}

interface EditReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: AdminReservation | null;
  onSave: (data: UpdateReservationData) => Promise<void>;
  onCancel: (reservation: AdminReservation) => void;
  onGetSlots: (showId: string) => Promise<{ success: boolean; data?: AvailableSlot[]; error?: string }>;
  isSaving: boolean;
}

// ============================================
// COMPOSANT DIALOG MODIFICATION
// ============================================

export function EditReservationDialog({ 
  open, 
  onOpenChange, 
  reservation, 
  onSave, 
  onCancel, 
  onGetSlots, 
  isSaving 
}: EditReservationDialogProps) {
  // Initialiser à null pour éviter la soumission avec données incomplètes
  const [formData, setFormData] = useState<UpdateReservationData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Le formulaire est prêt uniquement quand formData est peuplé
  const isFormReady = formData !== null;

  // Ref stable pour onGetSlots afin d'éviter les re-exécutions inutiles du useEffect principal
  const onGetSlotsRef = useRef(onGetSlots);
  useEffect(() => {
    onGetSlotsRef.current = onGetSlots;
  });

  // Reset form when reservation changes
  useEffect(() => {
    if (reservation && open) {
      // Reset les erreurs de validation
      setValidationErrors([]);
      setFormData({
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        email: reservation.email,
        phone: reservation.phone,
        emailSecondary: reservation.emailSecondary,
        phoneSecondary: reservation.phoneSecondary,
        address: reservation.address,
        postalCode: reservation.postalCode,
        city: reservation.city,
        organization: reservation.organization,
        function: reservation.function,
        afcNumber: reservation.afcNumber,
        numPlaces: reservation.numPlaces,
        slotId: reservation.slotId,
        specialRequests: reservation.specialRequests,
        checkinComment: reservation.checkinComment,
        checkinVenueNotes: reservation.checkinVenueNotes,
        checkinInternalNotes: reservation.checkinInternalNotes,
      });

      // Charger les créneaux disponibles via la ref stable
      if (reservation.slot?.show?.id) {
        setLoadingSlots(true);
        setSlotsError(null);
        onGetSlotsRef.current(reservation.slot.show.id)
          .then(result => {
            if (result.success && result.data) {
              setAvailableSlots(result.data);
            } else if (result.error) {
              setSlotsError(result.error);
            }
          })
          .catch((err: Error) => {
            setSlotsError(err.message || 'Erreur lors du chargement des créneaux');
          })
          .finally(() => {
            setLoadingSlots(false);
          });
      }
    }
  }, [reservation, open]);

  const handleChange = (field: keyof UpdateReservationData, value: string | number | null) => {
    if (!formData) return;
    
    setFormData({ ...formData, [field]: value });
    // Effacer les erreurs de validation quand l'utilisateur modifie un champ
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validation côté client des champs requis
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData) return ['Formulaire non initialisé'];
    
    if (!formData.firstName?.trim()) {
      errors.push('Le prénom est requis');
    }
    if (!formData.lastName?.trim()) {
      errors.push('Le nom est requis');
    }
    if (!formData.email?.trim()) {
      errors.push('L\'email est requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('L\'email n\'est pas valide');
    }
    if (!formData.numPlaces || formData.numPlaces < 1) {
      errors.push('Le nombre de places doit être au moins 1');
    }
    if (!formData.slotId) {
      errors.push('Un créneau doit être sélectionné');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (!formData) return;
    await onSave(formData);
  };

  const handleCancelReservation = () => {
    if (reservation) {
      onOpenChange(false);
      onCancel(reservation);
    }
  };

  // Reset le formulaire quand le dialog se ferme
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData(null);
      setValidationErrors([]);
      setAvailableSlots([]);
      setSlotsError(null);
    }
    onOpenChange(open);
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réservation</DialogTitle>
          <DialogDescription>
            {reservation.slot?.show?.title} — {reservation.slot?.date ? formatDateFr(reservation.slot.date) : ''} à {reservation.slot?.time}
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur réservation annulée */}
        {reservation.status === 'cancelled' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <Ban className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Réservation annulée</p>
              {reservation.cancelledAt && (
                <p className="text-red-600">Annulée le {formatDateTimeFr(reservation.cancelledAt)}</p>
              )}
              {reservation.cancellationReason && (
                <p className="mt-1 text-red-600/80">Motif : {reservation.cancellationReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Avertissement anomalie de données */}
        {reservation.hasDataAnomaly && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Anomalie de données détectée</p>
              <p>Certains champs requis sont vides dans la base de données. Veuillez les compléter avant d&apos;enregistrer.</p>
            </div>
          </div>
        )}

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Erreurs de validation</p>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Indicateur de chargement du formulaire */}
        {!isFormReady && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-derviche" />
            <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
          </div>
        )}

        {isFormReady && <div className="space-y-6 py-4">
          {/* Section: Créneau et places */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Créneau et places
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créneau</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </div>
                ) : slotsError ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {slotsError}
                  </div>
                ) : (
                  <Select
                    value={formData.slotId || ''}
                    onValueChange={(v) => handleChange('slotId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un créneau" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map(slot => {
                        const isUnlimited = slot.capacity >= 999999;
                        const available = isUnlimited ? '∞' : slot.remainingCapacity;
                        return (
                          <SelectItem key={slot.id} value={slot.id}>
                            {formatDateFr(slot.date)} {slot.time} — {slot.venue?.name || 'Lieu ?'} ({available} dispo)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nombre de places</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.numPlaces || 1}
                  onChange={(e) => handleChange('numPlaces', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              La modification du créneau ou du nombre de places met à jour automatiquement les capacités disponibles.
            </p>
          </div>

          {/* Section: Informations personnelles */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations personnelles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email secondaire</Label>
                <Input
                  type="email"
                  value={formData.emailSecondary || ''}
                  onChange={(e) => handleChange('emailSecondary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tél. secondaire</Label>
                <Input
                  type="tel"
                  value={formData.phoneSecondary || ''}
                  onChange={(e) => handleChange('phoneSecondary', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Professionnel */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations professionnelles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Structure / Organisation</Label>
                <Input
                  value={formData.organization || ''}
                  onChange={(e) => handleChange('organization', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Input
                  value={formData.function || ''}
                  onChange={(e) => handleChange('function', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Numéro AFC</Label>
                <Input
                  value={formData.afcNumber || ''}
                  onChange={(e) => handleChange('afcNumber', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Adresse */}
          <div className="space-y-4">
            <h4 className="font-medium">Adresse</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-3">
                <Label>Adresse</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Ville</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h4 className="font-medium">Notes</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Demandes spéciales</Label>
                <Textarea
                  value={formData.specialRequests || ''}
                  onChange={(e) => handleChange('specialRequests', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes check-in</Label>
                <Textarea
                  value={formData.checkinComment || ''}
                  onChange={(e) => handleChange('checkinComment', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes lieu</Label>
                <Textarea
                  value={formData.checkinVenueNotes || ''}
                  onChange={(e) => handleChange('checkinVenueNotes', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes internes</Label>
                <Textarea
                  value={formData.checkinInternalNotes || ''}
                  onChange={(e) => handleChange('checkinInternalNotes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {reservation.status !== 'cancelled' && (
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation} 
              disabled={isSaving} 
              className="w-full sm:w-auto sm:mr-auto"
            >
              <Ban className="w-4 h-4 mr-2" />
              Annuler la réservation
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">
            Fermer
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
