/**
 * TransferSlotDrawer - Drawer de transfert de réservation
 * Derviche Diffusion
 * 
 * Permet de transférer une réservation vers un autre créneau
 * du même spectacle, avec possibilité de modifier le nombre de places
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  AlertTriangle,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { 
  getTransferTargetSlots, 
  transferReservation,
  formatSlotDate,
  formatSlotTime,
  type CheckinSlot,
} from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { ReservationRowData } from './ReservationRow';

// ============================================
// CONSTANTES
// ============================================

/** Nombre maximum de places par réservation (cohérence avec AddReservationDrawer) */
const MAX_PLACES = 20;

// ============================================
// TYPES
// ============================================

export interface TransferSlotDrawerProps {
  /** Réservation à transférer */
  reservation: ReservationRowData | null;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après transfert réussi */
  onSuccess: (updatedReservation: ReservationRowData) => void;
}

// ============================================
// HELPERS
// ============================================

function getFullName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sans nom';
}

/**
 * Calcule les places restantes affichées
 * Gère les capacités illimitées (999999)
 */
function getDisplayRemaining(slot: CheckinSlot): string {
  if (slot.capacity >= 999999) {
    return '∞';
  }
  return String(slot.remainingCapacity);
}

/**
 * Détermine si un slot est dans le passé
 */
function isSlotPast(date: string, time: string): boolean {
  const slotDateTime = new Date(`${date}T${time}`);
  return slotDateTime < new Date();
}

/**
 * Détermine si un slot est aujourd'hui
 */
function isSlotToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

// ============================================
// COMPOSANT SLOT ITEM
// ============================================

interface SlotItemProps {
  slot: CheckinSlot;
  isSelected: boolean;
  onSelect: () => void;
  numPlaces: number;
  disabled: boolean;
}

function SlotItem({ slot, isSelected, onSelect, numPlaces, disabled }: SlotItemProps) {
  const isPast = isSlotPast(slot.date, slot.time);
  const isToday = isSlotToday(slot.date);
  const isUnlimited = slot.capacity >= 999999;
  
  // Calculer si overbooking potentiel
  const remainingAfterTransfer = slot.remainingCapacity - numPlaces;
  const wouldOverbook = !isUnlimited && remainingAfterTransfer < 0;
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed',
        isPast && !isSelected && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Infos principales */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className={cn(
              'font-medium',
              isToday && 'text-primary',
              isPast && 'text-muted-foreground'
            )}>
              {formatSlotDate(slot.date)}
            </span>
            {isToday && (
              <Badge variant="default" className="text-xs">Aujourd&apos;hui</Badge>
            )}
            {isPast && !isToday && (
              <Badge variant="secondary" className="text-xs">Passé</Badge>
            )}
          </div>
          
          {/* Heure */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatSlotTime(slot.time)}</span>
          </div>
          
          {/* Lieu */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{slot.venue.name}</span>
            {slot.venue.city && (
              <span className="text-xs">({slot.venue.city})</span>
            )}
          </div>
        </div>

        {/* Indicateurs à droite */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Indicateur de sélection */}
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Places restantes */}
          <div className={cn(
            'flex items-center gap-1.5 text-sm',
            wouldOverbook ? 'text-orange-600' : 'text-muted-foreground'
          )}>
            <Users className="w-4 h-4" />
            <span className="font-medium">
              {getDisplayRemaining(slot)}
            </span>
            <span className="text-xs">
              {isUnlimited ? '' : 'restantes'}
            </span>
          </div>
          
          {/* Warning overbooking */}
          {wouldOverbook && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Surbooking</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function TransferSlotDrawer({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: TransferSlotDrawerProps) {
  const { userId, role, companyId, isLoading: accessLoading } = useCheckinAccess();
  
  // États
  const [slots, setSlots] = useState<CheckinSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [numPlaces, setNumPlaces] = useState(1);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les slots cibles quand le drawer s'ouvre
  useEffect(() => {
    // Guard : ne rien faire si le drawer est fermé ou si les données manquent
    if (!open || !reservation || !userId || !role) {
      return;
    }

    // Capturer l'ID de la réservation au début pour détecter les changements
    const currentReservationId = reservation.id;
    let cancelled = false;

    setIsLoadingSlots(true);
    setError(null);
    setSelectedSlotId(null);
    setNumPlaces(reservation.numPlaces);
    
    void (async () => {
      try {
        const result = await getTransferTargetSlots(
          currentReservationId,
          userId,
          role,
          companyId
        );
        
        // Ignorer le résultat si annulé (drawer fermé ou réservation changée)
        if (cancelled) return;
        
        if (result.error) {
          setError(result.error);
          setSlots([]);
        } else {
          setSlots(result.data);
          if (result.data.length === 0) {
            setError('Aucun autre créneau disponible pour ce spectacle');
          }
        }
      } catch (err) {
        // Ignorer le résultat si annulé
        if (cancelled) return;
        
        logger.error('TransferSlotDrawer - Erreur chargement slots', err as Error);
        setError('Erreur lors du chargement des créneaux');
        setSlots([]);
      } finally {
        // Ignorer le résultat si annulé
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      }
    })();

    // Cleanup : marquer comme annulé si le drawer se ferme ou la réservation change
    return () => {
      cancelled = true;
    };
  }, [open, reservation, userId, role, companyId]);

  // Réinitialiser à la fermeture
  useEffect(() => {
    if (!open) {
      setSlots([]);
      setSelectedSlotId(null);
      setNumPlaces(1);
      setError(null);
    }
  }, [open]);

  // Handlers nombre de places
  const handleDecrease = useCallback(() => {
    setNumPlaces(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrease = useCallback(() => {
    setNumPlaces(prev => Math.min(MAX_PLACES, prev + 1));
  }, []);

  const handleNumPlacesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= MAX_PLACES) {
      setNumPlaces(value);
    }
  }, []);

  // Handler de transfert
  const handleTransfer = useCallback(async () => {
    if (!reservation || !selectedSlotId || !userId || !role) {
      toast.error('Données manquantes pour le transfert');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await transferReservation({
        reservationId: reservation.id,
        targetSlotId: selectedSlotId,
        newNumPlaces: numPlaces,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors du transfert');
        return;
      }

      // Message de succès
      const selectedSlot = slots.find(s => s.id === selectedSlotId);
      const slotInfo = selectedSlot 
        ? `${formatSlotDate(selectedSlot.date)} à ${formatSlotTime(selectedSlot.time)}`
        : 'nouveau créneau';
      
      // Avertissement overbooking si applicable
      if (result.data.targetSlotCapacity.isOverbooking) {
        toast.warning(
          `Transféré vers ${slotInfo} (attention: surbooking)`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Transféré vers ${slotInfo}`);
      }

      // Callback avec les données mises à jour
      onSuccess({
        ...reservation,
        numPlaces: result.data.reservation.numPlaces,
        checkinStatus: result.data.reservation.checkinStatus,
        checkinComment: result.data.reservation.checkinComment,
        checkinVenueNotes: result.data.reservation.checkinVenueNotes,
        checkinInternalNotes: result.data.reservation.checkinInternalNotes,
      });

      // Fermer le drawer
      onOpenChange(false);

    } catch (err) {
      logger.error('TransferSlotDrawer - Erreur transfert', err as Error);
      toast.error('Erreur lors du transfert');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, selectedSlotId, numPlaces, userId, role, companyId, slots, onSuccess, onOpenChange]);

  // Si pas de réservation, ne rien afficher
  if (!reservation) return null;

  // Nom affiché
  const displayName = getFullName(reservation.guestFirstName, reservation.guestLastName);
  
  // Slot sélectionné
  const selectedSlot = slots.find(s => s.id === selectedSlotId);
  
  // Calcul overbooking pour le slot sélectionné
  const wouldOverbook = selectedSlot 
    ? (selectedSlot.capacity < 999999 && (selectedSlot.remainingCapacity - numPlaces) < 0)
    : false;

  // Peut-on transférer ?
  const canTransfer = selectedSlotId !== null && !isSubmitting && !accessLoading && !isLoadingSlots;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <DrawerTitle className="text-xl flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Transférer la réservation
          </DrawerTitle>
          <DrawerDescription>
            {displayName} • {reservation.numPlaces} {reservation.numPlaces > 1 ? 'places' : 'place'}
          </DrawerDescription>
        </DrawerHeader>

        {/* Corps du drawer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Nombre de places */}
          <div className="p-4 border-b bg-muted/30">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Nombre de places
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrease}
                disabled={numPlaces <= 1 || isSubmitting}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={MAX_PLACES}
                value={numPlaces}
                onChange={handleNumPlacesChange}
                disabled={isSubmitting}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrease}
                disabled={numPlaces >= MAX_PLACES || isSubmitting}
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              {numPlaces !== reservation.numPlaces && (
                <Badge variant="secondary" className="ml-2">
                  {numPlaces > reservation.numPlaces ? '+' : ''}
                  {numPlaces - reservation.numPlaces}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Liste des créneaux */}
          <div className="p-4 pb-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Sélectionner le nouveau créneau
            </p>
          </div>

          {/* Zone scrollable pour les slots */}
          <div className="flex-1 overflow-y-auto px-4">
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {slots.map((slot) => (
                  <SlotItem
                    key={slot.id}
                    slot={slot}
                    isSelected={selectedSlotId === slot.id}
                    onSelect={() => setSelectedSlotId(slot.id)}
                    numPlaces={numPlaces}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer avec boutons d'action */}
        <DrawerFooter className="border-t pt-4">
          {/* Avertissement overbooking */}
          {wouldOverbook && selectedSlot && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Attention : surbooking</p>
                <p className="text-orange-700">
                  Ce créneau aura {Math.abs(selectedSlot.remainingCapacity - numPlaces)} place(s) 
                  en excès après le transfert.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="flex-1"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </DrawerClose>
            <Button
              onClick={() => void handleTransfer()}
              disabled={!canTransfer}
              className={cn(
                'flex-1',
                wouldOverbook && 'bg-orange-600 hover:bg-orange-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transfert...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Transférer
                </>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
