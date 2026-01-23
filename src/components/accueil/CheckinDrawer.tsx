/**
 * CheckinDrawer - Drawer de pointage des invités
 * Derviche Diffusion
 * 
 * Permet de marquer le statut de présence d'un invité
 * avec 4 options : Présent, Coup de cœur, Presse, Absent
 * + commentaire optionnel
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Heart, 
  Newspaper, 
  X, 
  Users, 
  Building2, 
  Mail,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { updateCheckinStatus } from '@/lib/services/checkin';
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
}: CheckinDrawerProps) {
  const { userId, role, companyId, isLoading: accessLoading } = useCheckinAccess();
  
  // États locaux
  const [selectedStatus, setSelectedStatus] = useState<CheckinStatus | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser quand la réservation change
  useEffect(() => {
    if (reservation) {
      setSelectedStatus(reservation.checkinStatus);
      // Le commentaire n'est pas dans ReservationRowData, on le reset
      setComment('');
    }
  }, [reservation]);

  // Handler de sauvegarde
  const handleSave = useCallback(async () => {
    if (!reservation || !selectedStatus || !userId || !role) {
      toast.error('Données manquantes pour le pointage');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateCheckinStatus({
        reservationId: reservation.id,
        status: selectedStatus,
        comment: comment.trim() || null,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors du pointage');
        return;
      }

      // Succès
      const statusLabel = STATUS_BUTTONS.find(b => b.status === selectedStatus)?.label || 'Pointé';
      toast.success(`${getFullName(reservation.guestFirstName, reservation.guestLastName)} : ${statusLabel}`);

      // Callback avec les données mises à jour
      onSuccess({
        ...reservation,
        checkinStatus: result.data.checkinStatus,
      });

      // Fermer le drawer
      onOpenChange(false);

    } catch (error) {
      console.error('Erreur pointage:', error);
      toast.error('Erreur lors du pointage');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, selectedStatus, comment, userId, role, companyId, onSuccess, onOpenChange]);

  // Si pas de réservation, ne rien afficher
  if (!reservation) return null;

  const fullName = getFullName(reservation.guestFirstName, reservation.guestLastName);
  const hasChanges = selectedStatus !== reservation.checkinStatus;
  const canSave = selectedStatus !== null && !isSubmitting && !accessLoading;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <DrawerTitle className="text-xl">{fullName}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Pointage de la réservation de {fullName}
          </DrawerDescription>
          
          {/* Infos complémentaires */}
          <div className="mt-3 space-y-2">
            {reservation.guestStructure && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{reservation.guestStructure}</span>
              </div>
            )}
            {reservation.guestEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{reservation.guestEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1.5" />
                {reservation.numPlaces} {reservation.numPlaces > 1 ? 'places' : 'place'}
              </Badge>
            </div>
          </div>
        </DrawerHeader>

        {/* Corps du drawer */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Grille des boutons de statut */}
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

          {/* Champ commentaire */}
          <div>
            <label 
              htmlFor="checkin-comment" 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2"
            >
              <MessageSquare className="w-4 h-4" />
              Commentaire (optionnel)
            </label>
            <Textarea
              id="checkin-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Note sur l'invité..."
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
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
                Annuler
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSave}
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
          {hasChanges && selectedStatus && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Le statut sera mis à jour
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
