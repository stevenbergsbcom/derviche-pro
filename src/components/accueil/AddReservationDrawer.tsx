/**
 * AddReservationDrawer - Formulaire d'ajout de réservation
 * Derviche Diffusion
 * 
 * Permet au staff d'accueil de créer une réservation sur place
 * avec tous les champs du formulaire public + options check-in
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  CreditCard,
  Users,
  MessageSquare,
  Lock,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Check,
  Heart,
  Newspaper,
  X,
} from 'lucide-react';
import {
  createReservationFromCheckin,
  checkDuplicateEmail,
  checkSlotCapacity,
  type CreateCheckinReservationData,
  type DuplicateCheckResult,
} from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { logger } from '@/lib/logger';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface AddReservationDrawerProps {
  /** ID du slot pour lequel créer la réservation */
  slotId: string;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après création réussie */
  onSuccess: () => void;
}

// ============================================
// VALIDATION SCHEMA
// ============================================

const formSchema = z.object({
  // Champs obligatoires
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide').max(255),
  numPlaces: z.number().min(1, 'Minimum 1 place').max(20, 'Maximum 20 places'),
  // Champs optionnels
  phone: z.string().max(20).optional(),
  emailSecondary: z.string().email('Email secondaire invalide').max(255).optional().or(z.literal('')),
  phoneSecondary: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  organization: z.string().max(255).optional(),
  function: z.string().max(100).optional(),
  afcNumber: z.string().max(50).optional(),
  specialRequests: z.string().max(1000).optional(),
  // Champs check-in
  checkinStatus: z.enum(['present_neutral', 'present_loved', 'present_press', 'absent']).optional(),
  checkinComment: z.string().max(1000).optional(),
  checkinVenueNotes: z.string().max(1000).optional(),
  checkinInternalNotes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// CONFIGURATION CHECK-IN STATUS
// ============================================

interface StatusOption {
  value: CheckinStatus;
  label: string;
  icon: typeof Check;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'present_neutral', label: 'Présent', icon: Check, color: 'text-green-600' },
  { value: 'present_loved', label: 'Coup de cœur', icon: Heart, color: 'text-pink-600' },
  { value: 'present_press', label: 'Presse', icon: Newspaper, color: 'text-blue-600' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-red-600' },
];

// ============================================
// COMPOSANT
// ============================================

export function AddReservationDrawer({
  slotId,
  open,
  onOpenChange,
  onSuccess,
}: AddReservationDrawerProps) {
  const { userId, role, companyId, isAdmin } = useCheckinAccess();

  // États
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(false);
  const [checkinFieldsOpen, setCheckinFieldsOpen] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<{ remaining: number; isUnlimited: boolean } | null>(null);
  
  // États pour la modale de doublon
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      numPlaces: 1,
      phone: '',
      emailSecondary: '',
      phoneSecondary: '',
      address: '',
      postalCode: '',
      city: '',
      organization: '',
      function: '',
      afcNumber: '',
      specialRequests: '',
      checkinStatus: undefined,
      checkinComment: '',
      checkinVenueNotes: '',
      checkinInternalNotes: '',
    },
  });

  // Charger la capacité du slot
  useEffect(() => {
    if (open && slotId) {
      void (async () => {
        const capacity = await checkSlotCapacity(slotId);
        if (capacity) {
          setCapacityInfo({ remaining: capacity.remaining, isUnlimited: capacity.isUnlimited });
        }
      })();
    }
  }, [open, slotId]);

  // Reset form quand le drawer s'ouvre
  useEffect(() => {
    if (open) {
      form.reset();
      setOptionalFieldsOpen(false);
      setCheckinFieldsOpen(false);
      setDuplicateInfo(null);
      setPendingFormData(null);
    }
  }, [open, form]);

  // Soumettre le formulaire
  const handleSubmit = useCallback(async (formData: FormData, skipDuplicateCheck = false) => {
    if (!userId || !role) {
      toast.error('Session expirée, veuillez vous reconnecter');
      return;
    }

    // Vérifier les doublons si pas déjà fait
    if (!skipDuplicateCheck) {
      const duplicate = await checkDuplicateEmail(slotId, formData.email);
      if (duplicate.hasDuplicate) {
        setDuplicateInfo(duplicate);
        setPendingFormData(formData);
        setShowDuplicateDialog(true);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const data: CreateCheckinReservationData = {
        slotId,
        numPlaces: formData.numPlaces,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        emailSecondary: formData.emailSecondary || undefined,
        phoneSecondary: formData.phoneSecondary || undefined,
        address: formData.address || undefined,
        postalCode: formData.postalCode || undefined,
        city: formData.city || undefined,
        organization: formData.organization || undefined,
        function: formData.function || undefined,
        afcNumber: formData.afcNumber || undefined,
        specialRequests: formData.specialRequests || undefined,
        checkinStatus: formData.checkinStatus as CheckinStatus | undefined,
        checkinComment: formData.checkinComment || undefined,
        checkinVenueNotes: formData.checkinVenueNotes || undefined,
        checkinInternalNotes: formData.checkinInternalNotes || undefined,
      };

      const result = await createReservationFromCheckin(data, userId, role, companyId);

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la création');
        return;
      }

      // Afficher le warning si doublon (mais création réussie)
      if (result.warning) {
        toast.warning(result.warning);
      }

      toast.success(`Réservation créée pour ${formData.firstName} ${formData.lastName}`);
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      logger.error('AddReservationDrawer - Erreur création réservation', { error });
      toast.error('Erreur lors de la création de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, role, companyId, slotId, onSuccess, onOpenChange]);

  // Confirmer malgré le doublon
  const handleConfirmDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    if (pendingFormData) {
      void handleSubmit(pendingFormData, true);
    }
  }, [pendingFormData, handleSubmit]);

  // Annuler après détection doublon
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    setPendingFormData(null);
  }, []);

  // Submit handler pour le form
  const onFormSubmit = form.handleSubmit((data) => {
    void handleSubmit(data);
  });

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5" />
              Nouvelle réservation
            </DrawerTitle>
            <DrawerDescription>
              Créer une réservation pour ce créneau
            </DrawerDescription>
            
            {/* Indicateur de capacité */}
            {capacityInfo && (
              <div className="mt-2">
                {capacityInfo.isUnlimited ? (
                  <Badge variant="secondary">Capacité illimitée</Badge>
                ) : (
                  <Badge variant={capacityInfo.remaining > 5 ? 'secondary' : 'destructive'}>
                    {capacityInfo.remaining} place{capacityInfo.remaining > 1 ? 's' : ''} restante{capacityInfo.remaining > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </DrawerHeader>

          {/* Corps du formulaire - scrollable */}
          <form onSubmit={onFormSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              
              {/* Section : Informations obligatoires */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Informations obligatoires
                </h3>
                
                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Prénom *
                    </Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      placeholder="Jean"
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm">Nom *</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      placeholder="Dupont"
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="jean.dupont@theatre.fr"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Nombre de places */}
                <div className="space-y-1.5">
                  <Label htmlFor="numPlaces" className="text-sm flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Nombre de places *
                  </Label>
                  <Input
                    id="numPlaces"
                    type="number"
                    min={1}
                    max={20}
                    {...form.register('numPlaces', { valueAsNumber: true })}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.numPlaces && (
                    <p className="text-xs text-destructive">{form.formState.errors.numPlaces.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section : Champs optionnels (dépliable) */}
              <Collapsible open={optionalFieldsOpen} onOpenChange={setOptionalFieldsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Informations complémentaires
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      optionalFieldsOpen && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  
                  {/* Téléphone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register('phone')}
                      placeholder="06 12 34 56 78"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Structure / Fonction */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="organization" className="text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Structure
                      </Label>
                      <Input
                        id="organization"
                        {...form.register('organization')}
                        placeholder="Théâtre Municipal"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="function" className="text-sm flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        Fonction
                      </Label>
                      <Input
                        id="function"
                        {...form.register('function')}
                        placeholder="Programmateur"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* N° AFC */}
                  <div className="space-y-1.5">
                    <Label htmlFor="afcNumber" className="text-sm flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      N° AFC
                    </Label>
                    <Input
                      id="afcNumber"
                      {...form.register('afcNumber')}
                      placeholder="AFC-123456"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Email / Téléphone secondaires */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="emailSecondary" className="text-sm">Email secondaire</Label>
                      <Input
                        id="emailSecondary"
                        type="email"
                        {...form.register('emailSecondary')}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phoneSecondary" className="text-sm">Tél. secondaire</Label>
                      <Input
                        id="phoneSecondary"
                        type="tel"
                        {...form.register('phoneSecondary')}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Adresse
                    </Label>
                    <Input
                      id="address"
                      {...form.register('address')}
                      placeholder="12 rue du Théâtre"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* CP / Ville */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode" className="text-sm">Code postal</Label>
                      <Input
                        id="postalCode"
                        {...form.register('postalCode')}
                        placeholder="75001"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="city" className="text-sm">Ville</Label>
                      <Input
                        id="city"
                        {...form.register('city')}
                        placeholder="Paris"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Demandes spéciales */}
                  <div className="space-y-1.5">
                    <Label htmlFor="specialRequests" className="text-sm flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Demandes spéciales
                    </Label>
                    <Textarea
                      id="specialRequests"
                      {...form.register('specialRequests')}
                      placeholder="PMR, placement particulier..."
                      rows={2}
                      disabled={isSubmitting}
                      className="resize-none"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Section : Check-in (dépliable) */}
              <Collapsible open={checkinFieldsOpen} onOpenChange={setCheckinFieldsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Pointage immédiat (optionnel)
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      checkinFieldsOpen && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  
                  {/* Statut de présence */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Statut de présence</Label>
                    <Select
                      value={form.watch('checkinStatus') || ''}
                      onValueChange={(value) => form.setValue('checkinStatus', value as CheckinStatus)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Non pointé" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={cn('flex items-center gap-2', option.color)}>
                                <Icon className="w-4 h-4" />
                                {option.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Commentaire check-in */}
                  <div className="space-y-1.5">
                    <Label htmlFor="checkinComment" className="text-sm">Commentaire</Label>
                    <Textarea
                      id="checkinComment"
                      {...form.register('checkinComment')}
                      placeholder="Note sur l'invité..."
                      rows={2}
                      disabled={isSubmitting}
                      className="resize-none"
                    />
                  </div>

                  {/* Notes venue */}
                  <div className="space-y-1.5">
                    <Label htmlFor="checkinVenueNotes" className="text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Notes sur le lieu
                    </Label>
                    <Textarea
                      id="checkinVenueNotes"
                      {...form.register('checkinVenueNotes')}
                      placeholder="Informations liées au lieu..."
                      rows={2}
                      disabled={isSubmitting}
                      className="resize-none"
                    />
                  </div>

                  {/* Notes internes - Admin uniquement */}
                  {isAdmin && (
                    <div className="space-y-1.5">
                      <Label htmlFor="checkinInternalNotes" className="text-sm flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Notes internes Derviche
                        <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
                      </Label>
                      <Textarea
                        id="checkinInternalNotes"
                        {...form.register('checkinInternalNotes')}
                        placeholder="Notes confidentielles..."
                        rows={2}
                        disabled={isSubmitting}
                        className="resize-none"
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

            </div>

            {/* Footer avec boutons */}
            <DrawerFooter className="border-t pt-4">
              <div className="flex gap-3">
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                </DrawerClose>
                <Button
                  type="submit"
                  className="flex-1 bg-gold hover:bg-gold/90 text-derviche-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer la réservation'
                  )}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Modale de confirmation doublon */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Réservation existante détectée
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  L&apos;email <strong>{pendingFormData?.email}</strong> a déjà une réservation
                  pour ce créneau :
                </p>
                {duplicateInfo?.existingReservation && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium">
                      {[
                        duplicateInfo.existingReservation.guestFirstName,
                        duplicateInfo.existingReservation.guestLastName,
                      ].filter(Boolean).join(' ') || 'Sans nom'}
                    </p>
                    <p className="text-muted-foreground">
                      {duplicateInfo.existingReservation.numPlaces} place(s) réservée(s)
                    </p>
                  </div>
                )}
                <p className="text-amber-600 font-medium">
                  Voulez-vous quand même créer une nouvelle réservation ?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDuplicate}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDuplicate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Créer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
