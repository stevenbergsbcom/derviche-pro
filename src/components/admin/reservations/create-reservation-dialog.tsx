/**
 * Dialog de création d'une nouvelle réservation (admin)
 * Derviche Diffusion
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  AlertCircle,
  Plus,
  User,
  Building,
  MapPin,
  FileText,
} from 'lucide-react';
import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';
import { formatDateFr } from './reservation-helpers';
import { toast } from 'sonner';

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

interface ShowOption {
  id: string;
  title: string;
  status: string;
  max_reservations_per_booking: number;
}

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shows: ShowOption[];
  onGetSlots: (showId: string) => Promise<{ success: boolean; data?: AvailableSlot[]; error?: string }>;
  onCreate: (data: CreateAdminReservationData) => Promise<{ success: boolean; reservationId?: string; error?: string }>;
}

// ============================================
// ÉTAT INITIAL DU FORMULAIRE
// ============================================

const INITIAL_FORM_DATA: CreateAdminReservationData = {
  slotId: '',
  numPlaces: 1,
  firstName: '',
  lastName: '',
  email: '',
  phone: null,
  emailSecondary: null,
  phoneSecondary: null,
  address: null,
  postalCode: null,
  city: null,
  organization: null,
  function: null,
  afcNumber: null,
  comment: null,
  checkinComment: null,
  checkinVenueNotes: null,
  checkinInternalNotes: null,
};

// ============================================
// COMPOSANT DIALOG CRÉATION
// ============================================

export function CreateReservationDialog({ 
  open, 
  onOpenChange, 
  shows,
  onGetSlots, 
  onCreate,
}: CreateReservationDialogProps) {
  // États du formulaire
  const [formData, setFormData] = useState<CreateAdminReservationData>(INITIAL_FORM_DATA);
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [maxPlaces, setMaxPlaces] = useState<number>(10); // Limite par défaut
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Spectacles publiés uniquement
  const publishedShows = shows.filter(s => s.status === 'published');

  // Ref stable pour onGetSlots
  const onGetSlotsRef = useRef(onGetSlots);
  useEffect(() => {
    onGetSlotsRef.current = onGetSlots;
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedShowId('');
      setMaxPlaces(10);
      setAvailableSlots([]);
      setSlotsError(null);
      setValidationErrors([]);
    }
  }, [open]);

  // Charger les créneaux quand le spectacle change
  const loadSlots = useCallback(async (showId: string) => {
    if (!showId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setFormData(prev => ({ ...prev, slotId: '' }));

    try {
      const result = await onGetSlotsRef.current(showId);
      if (result.success && result.data) {
        setAvailableSlots(result.data);
        // Auto-sélection si un seul créneau
        if (result.data.length === 1) {
          setFormData(prev => ({ ...prev, slotId: result.data![0].id }));
        }
      } else if (result.error) {
        setSlotsError(result.error);
      }
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : 'Erreur lors du chargement des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleShowChange = (showId: string) => {
    setSelectedShowId(showId);
    // Récupérer la limite de places du spectacle sélectionné
    const selectedShow = publishedShows.find(s => s.id === showId);
    if (selectedShow) {
      setMaxPlaces(selectedShow.max_reservations_per_booking);
      // Réinitialiser le nombre de places si nécessaire
      if (formData.numPlaces > selectedShow.max_reservations_per_booking) {
        setFormData(prev => ({ ...prev, numPlaces: selectedShow.max_reservations_per_booking }));
      }
    }
    void loadSlots(showId);
  };

  const handleChange = (field: keyof CreateAdminReservationData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer les erreurs de validation
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validation côté client
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!selectedShowId) {
      errors.push('Veuillez sélectionner un spectacle');
    }
    if (!formData.slotId) {
      errors.push('Veuillez sélectionner un créneau');
    }
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
    } else if (formData.numPlaces > maxPlaces) {
      errors.push(`Le nombre de places ne peut pas dépasser ${maxPlaces}`);
    }

    // Vérifier la capacité disponible du créneau
    const selectedSlot = availableSlots.find(s => s.id === formData.slotId);
    if (selectedSlot && selectedSlot.capacity < 999999) {
      if (formData.numPlaces > selectedSlot.remainingCapacity) {
        errors.push(`Capacité insuffisante (${selectedSlot.remainingCapacity} places disponibles)`);
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onCreate(formData);
      
      if (result.success) {
        toast.success('Réservation créée avec succès');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle réservation
          </DialogTitle>
          <DialogDescription>
            Créez une réservation pour un professionnel depuis l&apos;interface admin.
          </DialogDescription>
        </DialogHeader>

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

        <div className="space-y-6 py-4">
          {/* Section: Spectacle et Créneau */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Spectacle et créneau
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Sélection spectacle */}
              <div className="space-y-2">
                <Label>Spectacle *</Label>
                <Select value={selectedShowId} onValueChange={handleShowChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un spectacle" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedShows.length === 0 ? (
                      <SelectItem value="_none" disabled>Aucun spectacle publié</SelectItem>
                    ) : (
                      publishedShows.map(show => (
                        <SelectItem key={show.id} value={show.id}>
                          {show.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection créneau */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Créneau *</Label>
                  {!selectedShowId ? (
                    <p className="text-sm text-muted-foreground">Sélectionnez d&apos;abord un spectacle</p>
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement des créneaux...
                    </div>
                  ) : slotsError ? (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      {slotsError}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun créneau disponible</p>
                  ) : (
                    <Select
                      value={formData.slotId}
                      onValueChange={(v) => handleChange('slotId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un créneau" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map(slot => {
                          const isUnlimited = slot.capacity >= 999999;
                          const available = isUnlimited ? '∞' : slot.remainingCapacity;
                          const isFull = !isUnlimited && slot.remainingCapacity <= 0;
                          return (
                            <SelectItem 
                              key={slot.id} 
                              value={slot.id}
                              disabled={isFull}
                            >
                              {formatDateFr(slot.date)} {slot.time} — {slot.venue?.name || 'Lieu ?'} 
                              {isFull ? ' (Complet)' : ` (${available} dispo)`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Nombre de places * (max: {maxPlaces})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxPlaces}
                    value={formData.numPlaces}
                    onChange={(e) => handleChange('numPlaces', parseInt(e.target.value) || 1)}
                    disabled={!formData.slotId}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Informations personnelles */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations personnelles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="jean.dupont@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value || null)}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label>Email secondaire</Label>
                <Input
                  type="email"
                  value={formData.emailSecondary || ''}
                  onChange={(e) => handleChange('emailSecondary', e.target.value || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tél. secondaire</Label>
                <Input
                  type="tel"
                  value={formData.phoneSecondary || ''}
                  onChange={(e) => handleChange('phoneSecondary', e.target.value || null)}
                />
              </div>
            </div>
          </div>

          {/* Section: Professionnel */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Building className="w-4 h-4" />
              Informations professionnelles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Structure / Organisation</Label>
                <Input
                  value={formData.organization || ''}
                  onChange={(e) => handleChange('organization', e.target.value || null)}
                  placeholder="Théâtre Municipal"
                />
              </div>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Input
                  value={formData.function || ''}
                  onChange={(e) => handleChange('function', e.target.value || null)}
                  placeholder="Directeur artistique"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Numéro AFC</Label>
                <Input
                  value={formData.afcNumber || ''}
                  onChange={(e) => handleChange('afcNumber', e.target.value || null)}
                  placeholder="AFC-12345"
                />
              </div>
            </div>
          </div>

          {/* Section: Adresse */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-3">
                <Label>Adresse</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value || null)}
                  placeholder="123 rue du Théâtre"
                />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value || null)}
                  placeholder="75001"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Ville</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value || null)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Demandes spéciales</Label>
                <Textarea
                  value={formData.comment || ''}
                  onChange={(e) => handleChange('comment', e.target.value || null)}
                  rows={2}
                  placeholder="Besoins particuliers, accessibilité..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notes check-in</Label>
                <Textarea
                  value={formData.checkinComment || ''}
                  onChange={(e) => handleChange('checkinComment', e.target.value || null)}
                  rows={2}
                  placeholder="Notes visibles lors du check-in..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notes lieu</Label>
                <Textarea
                  value={formData.checkinVenueNotes || ''}
                  onChange={(e) => handleChange('checkinVenueNotes', e.target.value || null)}
                  rows={2}
                  placeholder="Informations spécifiques au lieu..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notes internes</Label>
                <Textarea
                  value={formData.checkinInternalNotes || ''}
                  onChange={(e) => handleChange('checkinInternalNotes', e.target.value || null)}
                  rows={2}
                  placeholder="Notes confidentielles pour l'équipe..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSaving} 
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !formData.slotId} 
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Créer la réservation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
