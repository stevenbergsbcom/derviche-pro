/**
 * Composant CheckinDialog pour la page des réservations admin
 * Dialog de check-in avec 4 options : A aimé, Presse, Neutre, Absent
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, Newspaper, Meh, XCircle, Loader2 } from 'lucide-react';
import type { CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface CheckinDialogReservation {
  id: string;
  firstName: string;
  lastName: string;
  numPlaces: number;
}

export interface CheckinDialogProps {
  /** Indique si le dialog est ouvert */
  open: boolean;
  /** Handler pour fermer/ouvrir le dialog */
  onOpenChange: (open: boolean) => void;
  /** Réservation sélectionnée */
  reservation: CheckinDialogReservation | null;
  /** Handler pour effectuer le check-in */
  onCheckin: (status: CheckinStatus) => void;
  /** Indique si une action est en cours */
  isProcessing: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const CHECKIN_OPTIONS = [
  {
    status: 'present_loved' as CheckinStatus,
    label: 'A aimé',
    icon: Heart,
    iconColor: 'text-pink-500',
    hoverBg: 'hover:bg-pink-50',
    hoverBorder: 'hover:border-pink-300',
  },
  {
    status: 'present_press' as CheckinStatus,
    label: 'Presse',
    icon: Newspaper,
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-blue-50',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    status: 'present_neutral' as CheckinStatus,
    label: 'Neutre',
    icon: Meh,
    iconColor: 'text-gray-500',
    hoverBg: 'hover:bg-gray-50',
    hoverBorder: 'hover:border-gray-300',
  },
  {
    status: 'absent' as CheckinStatus,
    label: 'Absent',
    icon: XCircle,
    iconColor: 'text-red-500',
    hoverBg: 'hover:bg-red-50',
    hoverBorder: 'hover:border-red-300',
  },
] as const;

// ============================================
// COMPOSANT
// ============================================

export function CheckinDialog({
  open,
  onOpenChange,
  reservation,
  onCheckin,
  isProcessing,
}: CheckinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in</DialogTitle>
          <DialogDescription>
            {reservation && (
              <span className="block mt-1">
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
                <br />
                {reservation.numPlaces} place{reservation.numPlaces > 1 ? 's' : ''}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {CHECKIN_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.status}
                variant="outline"
                className={`flex flex-col items-center gap-2 h-auto py-4 ${option.hoverBg} ${option.hoverBorder}`}
                onClick={() => onCheckin(option.status)}
                disabled={isProcessing}
              >
                <Icon className={`w-8 h-8 ${option.iconColor}`} />
                <span className="text-sm">{option.label}</span>
              </Button>
            );
          })}
        </div>

        {isProcessing && (
          <div className="flex justify-center pb-2">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
