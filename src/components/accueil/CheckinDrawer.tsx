/**
 * CheckinDrawer - Drawer de pointage des invités
 * Derviche Diffusion
 * 
 * Permet de marquer le statut de présence d'un invité
 * avec 4 options : Présent, Coup de cœur, Presse, Absent
 * + commentaire, notes venue, notes internes (admin only)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Check, 
  Heart, 
  Newspaper, 
  X, 
  Users, 
  Building2, 
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  MapPin,
  Lock,
  Loader2,
  ChevronDown,
  AlertCircle,
  User,
  Home,
  CreditCard,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { updateCheckinStatus, updateGuestInfo, reactivateReservation, cancelReservation } from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { CheckinStatus } from '@/types/database';
import type { ReservationRowData } from './ReservationRow';

// ============================================
// TYPES
// ============================================

export interface CheckinDrawerProps {
  /** Réservation à pointer */
  reservation: ReservationRowData | null;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après sauvegarde réussie */
  onSuccess: (updatedReservation: ReservationRowData) => void;
  /** Callback pour ouvrir le drawer de transfert (optionnel) */
  onTransferClick?: () => void;
}

// ============================================
// CONFIGURATION DES BOUTONS
// ============================================

interface StatusButtonConfig {
  status: CheckinStatus;
  label: string;
  shortLabel: string;
  icon: typeof Check;
  color: string;
  bgColor: string;
  borderColor: string;
  activeColor: string;
}

const STATUS_BUTTONS: StatusButtonConfig[] = [
  {
    status: 'present_neutral',
    label: 'Présent',
    shortLabel: 'Présent',
    icon: Check,
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
    activeColor: 'bg-green-500 text-white border-green-600',
  },
  {
    status: 'present_loved',
    label: 'Coup de cœur',
    shortLabel: '❤️ Aimé',
    icon: Heart,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    borderColor: 'border-pink-200',
    activeColor: 'bg-pink-500 text-white border-pink-600',
  },
  {
    status: 'present_press',
    label: 'Presse',
    shortLabel: '📰 Presse',
    icon: Newspaper,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
    activeColor: 'bg-blue-500 text-white border-blue-600',
  },
  {
    status: 'absent',
    label: 'Absent',
    shortLabel: 'Absent',
    icon: X,
    color: 'text-red-700',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200',
    activeColor: 'bg-red-500 text-white border-red-600',
  },
];

// ============================================
// HELPERS
// ============================================

function getFullName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sans nom';
}

// ============================================
// COMPOSANT
// ============================================

export function CheckinDrawer({
  reservation,
  open,
  onOpenChange,
  onSuccess,
  onTransferClick,
}: CheckinDrawerProps) {
  const { userId, role, companyId, isAdmin, isLoading: accessLoading } = useCheckinAccess();
  
  // États locaux - Check-in
  const [selectedStatus, setSelectedStatus] = useState<CheckinStatus | null>(null);
  const [comment, setComment] = useState('');
  const [venueNotes, setVenueNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  
  // États locaux - Infos guest (éditables)
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailSecondary, setGuestEmailSecondary] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPhoneSecondary, setGuestPhoneSecondary] = useState('');
  const [guestStructure, setGuestStructure] = useState('');
  const [guestFunction, setGuestFunction] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestPostalCode, setGuestPostalCode] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestAfcNumber, setGuestAfcNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // États UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** True si la réservation vient d'être réactivée dans cette session */
  const [justReactivated, setJustReactivated] = useState(false);
  /** Statut local de la réservation (peut changer après réactivation) */
  const [localStatus, setLocalStatus] = useState<'confirmed' | 'cancelled' | 'no_show'>('confirmed');

  // Réinitialiser quand la réservation change
  useEffect(() => {
    if (reservation) {
      // Check-in
      setSelectedStatus(reservation.checkinStatus);
      setComment(reservation.checkinComment || '');
      setVenueNotes(reservation.checkinVenueNotes || '');
      setInternalNotes(reservation.checkinInternalNotes || '');
      // Infos guest
      setGuestFirstName(reservation.guestFirstName || '');
      setGuestLastName(reservation.guestLastName || '');
      setGuestEmail(reservation.guestEmail || '');
      setGuestEmailSecondary(reservation.guestEmailSecondary || '');
      setGuestPhone(reservation.guestPhone || '');
      setGuestPhoneSecondary(reservation.guestPhoneSecondary || '');
      setGuestStructure(reservation.guestStructure || '');
      setGuestFunction(reservation.guestFunction || '');
      setGuestAddress(reservation.guestAddress || '');
      setGuestPostalCode(reservation.guestPostalCode || '');
      setGuestCity(reservation.guestCity || '');
      setGuestAfcNumber(reservation.guestAfcNumber || '');
      setSpecialRequests(reservation.specialRequests || '');
      // UI
      setDetailsOpen(false);
      setJustReactivated(false);
      setLocalStatus(reservation.status);
    }
  }, [reservation]);

  // Détermine si la réservation est annulée (et pas encore réactivée dans cette session)
  const isCancelled = localStatus === 'cancelled';

  // Handler de sauvegarde
  const handleSave = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la sauvegarde');
      return;
    }

    // Validation basique
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires');
      return;
    }
    if (!guestEmail.trim()) {
      toast.error('L\'email est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      // Si annulée, utiliser updateGuestInfo (pas de check-in possible)
      // Sinon, utiliser updateCheckinStatus
      if (isCancelled) {
        const result = await updateGuestInfo({
          reservationId: reservation.id,
          userId,
          role,
          companyId,
          // Champs guest
          guestFirstName: guestFirstName.trim(),
          guestLastName: guestLastName.trim(),
          guestEmail: guestEmail.trim(),
          guestEmailSecondary: guestEmailSecondary.trim() || null,
          guestPhone: guestPhone.trim() || null,
          guestPhoneSecondary: guestPhoneSecondary.trim() || null,
          guestStructure: guestStructure.trim() || null,
          guestFunction: guestFunction.trim() || null,
          guestAddress: guestAddress.trim() || null,
          guestPostalCode: guestPostalCode.trim() || null,
          guestCity: guestCity.trim() || null,
          guestAfcNumber: guestAfcNumber.trim() || null,
          specialRequests: specialRequests.trim() || null,
          // Notes
          checkinComment: comment.trim() || null,
          checkinVenueNotes: venueNotes.trim() || null,
          checkinInternalNotes: isAdmin ? (internalNotes.trim() || null) : undefined,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors de la mise à jour');
          return;
        }

        toast.success(`${getFullName(result.data.guestFirstName, result.data.guestLastName)} : Informations mises à jour`);

        // Callback avec les données mises à jour
        onSuccess({
          ...reservation,
          status: result.data.status,
          checkinStatus: result.data.checkinStatus,
          checkinComment: result.data.checkinComment,
          checkinVenueNotes: result.data.checkinVenueNotes,
          checkinInternalNotes: result.data.checkinInternalNotes,
          guestFirstName: result.data.guestFirstName,
          guestLastName: result.data.guestLastName,
          guestEmail: result.data.guestEmail,
          guestEmailSecondary: result.data.guestEmailSecondary,
          guestPhone: result.data.guestPhone,
          guestPhoneSecondary: result.data.guestPhoneSecondary,
          guestStructure: result.data.guestStructure,
          guestFunction: result.data.guestFunction,
          guestAddress: result.data.guestAddress,
          guestPostalCode: result.data.guestPostalCode,
          guestCity: result.data.guestCity,
          guestAfcNumber: result.data.guestAfcNumber,
          specialRequests: result.data.specialRequests,
        });

        // Fermer le drawer
        onOpenChange(false);

      } else {
        // Réservation confirmée : utiliser updateCheckinStatus
        const result = await updateCheckinStatus({
          reservationId: reservation.id,
          status: selectedStatus ?? undefined,
          comment: comment.trim() || null,
          venueNotes: venueNotes.trim() || null,
          internalNotes: isAdmin ? (internalNotes.trim() || null) : undefined,
          userId,
          role,
          companyId,
          // Champs guest
          guestFirstName: guestFirstName.trim(),
          guestLastName: guestLastName.trim(),
          guestEmail: guestEmail.trim(),
          guestEmailSecondary: guestEmailSecondary.trim() || null,
          guestPhone: guestPhone.trim() || null,
          guestPhoneSecondary: guestPhoneSecondary.trim() || null,
          guestStructure: guestStructure.trim() || null,
          guestFunction: guestFunction.trim() || null,
          guestAddress: guestAddress.trim() || null,
          guestPostalCode: guestPostalCode.trim() || null,
          guestCity: guestCity.trim() || null,
          guestAfcNumber: guestAfcNumber.trim() || null,
          specialRequests: specialRequests.trim() || null,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors du pointage');
          return;
        }

        // Succès - message adapté selon si on a changé le statut ou juste les infos
        if (selectedStatus) {
          const statusLabel = STATUS_BUTTONS.find(b => b.status === selectedStatus)?.label || 'Pointé';
          toast.success(`${getFullName(result.data.guestFirstName, result.data.guestLastName)} : ${statusLabel}`);
        } else {
          toast.success(`${getFullName(result.data.guestFirstName, result.data.guestLastName)} : Informations mises à jour`);
        }

        // Callback avec les données mises à jour
        onSuccess({
          ...reservation,
          status: result.data.status,
          checkinStatus: result.data.checkinStatus,
          checkinComment: result.data.checkinComment,
          checkinVenueNotes: result.data.checkinVenueNotes,
          checkinInternalNotes: result.data.checkinInternalNotes,
          guestFirstName: result.data.guestFirstName,
          guestLastName: result.data.guestLastName,
          guestEmail: result.data.guestEmail,
          guestEmailSecondary: result.data.guestEmailSecondary,
          guestPhone: result.data.guestPhone,
          guestPhoneSecondary: result.data.guestPhoneSecondary,
          guestStructure: result.data.guestStructure,
          guestFunction: result.data.guestFunction,
          guestAddress: result.data.guestAddress,
          guestPostalCode: result.data.guestPostalCode,
          guestCity: result.data.guestCity,
          guestAfcNumber: result.data.guestAfcNumber,
          specialRequests: result.data.specialRequests,
        });

        // Fermer le drawer
        onOpenChange(false);
      }

    } catch (error) {
      logger.error('CheckinDrawer - Erreur sauvegarde', error as Error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    reservation, 
    selectedStatus, 
    comment, 
    venueNotes, 
    internalNotes, 
    isAdmin, 
    userId, 
    role, 
    companyId, 
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
    isCancelled,
    onSuccess, 
    onOpenChange
  ]);

  // Handler de réactivation
  const handleReactivate = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la réactivation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reactivateReservation({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de la réactivation');
        return;
      }

      // Succès
      const guestName = getFullName(
        result.data.reservation.guestFirstName,
        result.data.reservation.guestLastName
      );

      if (result.data.isOverbooking) {
        toast.warning(`${guestName} : Réservation réactivée (attention: overbooking)`);
      } else {
        toast.success(`${guestName} : Réservation réactivée`);
      }

      // Mettre à jour l'état local pour afficher les boutons de statut
      setLocalStatus('confirmed');
      setJustReactivated(true);

      // NE PAS fermer le drawer pour permettre le check-in immédiat
      // Mais notifier le parent pour mettre à jour la liste
      onSuccess({
        ...reservation,
        status: 'confirmed',
        checkinStatus: result.data.reservation.checkinStatus,
        checkinComment: result.data.reservation.checkinComment,
        checkinVenueNotes: result.data.reservation.checkinVenueNotes,
        checkinInternalNotes: result.data.reservation.checkinInternalNotes,
        guestFirstName: result.data.reservation.guestFirstName,
        guestLastName: result.data.reservation.guestLastName,
        guestEmail: result.data.reservation.guestEmail,
        guestEmailSecondary: result.data.reservation.guestEmailSecondary,
        guestPhone: result.data.reservation.guestPhone,
        guestPhoneSecondary: result.data.reservation.guestPhoneSecondary,
        guestStructure: result.data.reservation.guestStructure,
        guestFunction: result.data.reservation.guestFunction,
        guestAddress: result.data.reservation.guestAddress,
        guestPostalCode: result.data.reservation.guestPostalCode,
        guestCity: result.data.reservation.guestCity,
        guestAfcNumber: result.data.reservation.guestAfcNumber,
        specialRequests: result.data.reservation.specialRequests,
      });

    } catch (error) {
      logger.error('CheckinDrawer - Erreur réactivation', error as Error);
      toast.error('Erreur lors de la réactivation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess]);

  // Handler d'annulation
  const handleCancel = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour l\'annulation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await cancelReservation({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de l\'annulation');
        return;
      }

      // Succès
      const guestName = getFullName(
        result.data.guestFirstName,
        result.data.guestLastName
      );

      toast.success(`${guestName} : Réservation annulée`);

      // Mettre à jour l'état local
      setLocalStatus('cancelled');
      setSelectedStatus(null); // Reset le statut de check-in

      // Notifier le parent pour mettre à jour la liste
      onSuccess({
        ...reservation,
        status: 'cancelled',
        checkinStatus: result.data.checkinStatus,
        checkinComment: result.data.checkinComment,
        checkinVenueNotes: result.data.checkinVenueNotes,
        checkinInternalNotes: result.data.checkinInternalNotes,
        guestFirstName: result.data.guestFirstName,
        guestLastName: result.data.guestLastName,
        guestEmail: result.data.guestEmail,
        guestEmailSecondary: result.data.guestEmailSecondary,
        guestPhone: result.data.guestPhone,
        guestPhoneSecondary: result.data.guestPhoneSecondary,
        guestStructure: result.data.guestStructure,
        guestFunction: result.data.guestFunction,
        guestAddress: result.data.guestAddress,
        guestPostalCode: result.data.guestPostalCode,
        guestCity: result.data.guestCity,
        guestAfcNumber: result.data.guestAfcNumber,
        specialRequests: result.data.specialRequests,
      });

      // Fermer le drawer
      onOpenChange(false);

    } catch (error) {
      logger.error('CheckinDrawer - Erreur annulation', error as Error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess, onOpenChange]);

  // Si pas de réservation, ne rien afficher
  if (!reservation) return null;

  // Nom affiché (dynamique si modifié)
  const displayName = getFullName(guestFirstName, guestLastName);
  
  // Détection des changements
  const hasChanges = 
    // Check-in
    selectedStatus !== reservation.checkinStatus ||
    comment !== (reservation.checkinComment || '') ||
    venueNotes !== (reservation.checkinVenueNotes || '') ||
    (isAdmin && internalNotes !== (reservation.checkinInternalNotes || '')) ||
    // Infos guest
    guestFirstName !== (reservation.guestFirstName || '') ||
    guestLastName !== (reservation.guestLastName || '') ||
    guestEmail !== (reservation.guestEmail || '') ||
    guestEmailSecondary !== (reservation.guestEmailSecondary || '') ||
    guestPhone !== (reservation.guestPhone || '') ||
    guestPhoneSecondary !== (reservation.guestPhoneSecondary || '') ||
    guestStructure !== (reservation.guestStructure || '') ||
    guestFunction !== (reservation.guestFunction || '') ||
    guestAddress !== (reservation.guestAddress || '') ||
    guestPostalCode !== (reservation.guestPostalCode || '') ||
    guestCity !== (reservation.guestCity || '') ||
    guestAfcNumber !== (reservation.guestAfcNumber || '') ||
    specialRequests !== (reservation.specialRequests || '');
  
  // On peut sauvegarder si :
  // - Un statut est sélectionné (check-in)
  // - OU des modifications ont été faites sur les infos guest/notes
  const canSave = (selectedStatus !== null || hasChanges) && !isSubmitting && !accessLoading;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <DrawerTitle className="text-xl">{displayName}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Pointage de la réservation de {displayName}
          </DrawerDescription>
          
          {/* Badge nombre de places */}
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1.5" />
              {reservation.numPlaces} {reservation.numPlaces > 1 ? 'places' : 'place'}
            </Badge>
            
            {/* Bouton Transférer - masqué si annulée */}
            {onTransferClick && !isCancelled && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTransferClick}
                disabled={isSubmitting}
                className="text-sm"
              >
                <ArrowRight className="w-4 h-4 mr-1.5" />
                Transférer
              </Button>
            )}
          </div>
        </DrawerHeader>

        {/* Corps du drawer - scrollable */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Bandeau réservation annulée */}
          {isCancelled && (
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Cette réservation est annulée</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleReactivate()}
                  disabled={isSubmitting}
                  className="ml-3 border-red-300 hover:bg-red-100 text-red-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                  )}
                  Réactiver
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Message après réactivation */}
          {justReactivated && (
            <Alert className="border-green-300 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Réservation réactivée ! Vous pouvez maintenant pointer cette personne.
              </AlertDescription>
            </Alert>
          )}

          {/* Grille des boutons de statut - masquée si annulée */}
          {!isCancelled && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Statut de présence
              </p>
              <div className="grid grid-cols-2 gap-3">
                {STATUS_BUTTONS.map((config) => {
                  const Icon = config.icon;
                  const isActive = selectedStatus === config.status;
                  
                  return (
                    <button
                      key={config.status}
                      type="button"
                      onClick={() => setSelectedStatus(config.status)}
                      disabled={isSubmitting}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-4',
                        'rounded-xl border-2 transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        isActive
                          ? config.activeColor
                          : cn(config.bgColor, config.borderColor, config.color),
                        isSubmitting && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className={cn('w-6 h-6', isActive && 'text-white')} />
                      <span className={cn('text-sm font-medium', isActive && 'text-white')}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Section dépliable - Informations du professionnel */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground -mx-2 px-2">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations du professionnel
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  detailsOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-first-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                    Prénom *
                  </label>
                  <Input
                    id="guest-first-name"
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    placeholder="Prénom"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="guest-last-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                    Nom *
                  </label>
                  <Input
                    id="guest-last-name"
                    value={guestLastName}
                    onChange={(e) => setGuestLastName(e.target.value)}
                    placeholder="Nom"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="guest-email" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  Email *
                </label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email secondaire */}
              <div>
                <label htmlFor="guest-email-secondary" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  Email secondaire
                </label>
                <Input
                  id="guest-email-secondary"
                  type="email"
                  value={guestEmailSecondary}
                  onChange={(e) => setGuestEmailSecondary(e.target.value)}
                  placeholder="autre@exemple.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="guest-phone" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  Téléphone
                </label>
                <Input
                  id="guest-phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={isSubmitting}
                />
              </div>

              {/* Téléphone secondaire */}
              <div>
                <label htmlFor="guest-phone-secondary" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  Téléphone secondaire
                </label>
                <Input
                  id="guest-phone-secondary"
                  type="tel"
                  value={guestPhoneSecondary}
                  onChange={(e) => setGuestPhoneSecondary(e.target.value)}
                  placeholder="01 23 45 67 89"
                  disabled={isSubmitting}
                />
              </div>

              {/* Structure */}
              <div>
                <label htmlFor="guest-structure" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Structure / Organisation
                </label>
                <Input
                  id="guest-structure"
                  value={guestStructure}
                  onChange={(e) => setGuestStructure(e.target.value)}
                  placeholder="Théâtre, Centre culturel..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Fonction */}
              <div>
                <label htmlFor="guest-function" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  Fonction
                </label>
                <Input
                  id="guest-function"
                  value={guestFunction}
                  onChange={(e) => setGuestFunction(e.target.value)}
                  placeholder="Programmateur, Directeur..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Adresse */}
              <div>
                <label htmlFor="guest-address" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Home className="w-3.5 h-3.5" />
                  Adresse
                </label>
                <Input
                  id="guest-address"
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  placeholder="12 rue du Théâtre"
                  disabled={isSubmitting}
                />
              </div>

              {/* Code postal et Ville */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="guest-postal-code" className="text-xs font-medium text-muted-foreground mb-1 block">
                    Code postal
                  </label>
                  <Input
                    id="guest-postal-code"
                    value={guestPostalCode}
                    onChange={(e) => setGuestPostalCode(e.target.value)}
                    placeholder="75001"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="guest-city" className="text-xs font-medium text-muted-foreground mb-1 block">
                    Ville
                  </label>
                  <Input
                    id="guest-city"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                    placeholder="Paris"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Numéro AFC */}
              <div>
                <label htmlFor="guest-afc-number" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Numéro AFC
                </label>
                <Input
                  id="guest-afc-number"
                  value={guestAfcNumber}
                  onChange={(e) => setGuestAfcNumber(e.target.value)}
                  placeholder="Numéro d'adhérent AFC"
                  disabled={isSubmitting}
                />
              </div>

              {/* Demandes spéciales */}
              <div>
                <label htmlFor="guest-special-requests" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Demandes spéciales
                </label>
                <Textarea
                  id="guest-special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Accessibilité, accompagnant, etc."
                  rows={2}
                  disabled={isSubmitting}
                  className="resize-none"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Champ commentaire */}
          <div>
            <label 
              htmlFor="checkin-comment" 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
            >
              <MessageSquare className="w-4 h-4" />
              Commentaire
            </label>
            <Textarea
              id="checkin-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Note sur l'invité..."
              rows={2}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* Notes venue */}
          <div>
            <label 
              htmlFor="checkin-venue-notes" 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
            >
              <MapPin className="w-4 h-4" />
              Notes sur le lieu
            </label>
            <Textarea
              id="checkin-venue-notes"
              value={venueNotes}
              onChange={(e) => setVenueNotes(e.target.value)}
              placeholder="Informations liées au lieu, à l'accueil..."
              rows={2}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* Notes internes - Admin uniquement */}
          {isAdmin && (
            <div>
              <label 
                htmlFor="checkin-internal-notes" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
              >
                <Lock className="w-4 h-4" />
                Notes internes Derviche
                <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
              </label>
              <Textarea
                id="checkin-internal-notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notes confidentielles (non visibles par externes/compagnies)..."
                rows={2}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer avec boutons d'action */}
        <DrawerFooter className="border-t pt-4">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="flex-1"
                disabled={isSubmitting}
              >
                Fermer
              </Button>
            </DrawerClose>
            <Button
              onClick={() => void handleSave()}
              disabled={!canSave}
              className={cn(
                'flex-1',
                selectedStatus === 'absent' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
          
          {/* Indicateur de changement */}
          {hasChanges && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Modifications non enregistrées
            </p>
          )}

          {/* Bouton annuler la réservation - uniquement si confirmée */}
          {!isCancelled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleCancel()}
              disabled={isSubmitting}
              className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1.5" />
              Annuler cette réservation
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
