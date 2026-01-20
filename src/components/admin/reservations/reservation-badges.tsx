/**
 * Badges pour les réservations (statut et check-in)
 * Derviche Diffusion
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, Newspaper, Meh, XCircle } from 'lucide-react';
import type { ReservationStatus, CheckinStatus } from '@/types/database';

// ============================================
// BADGE STATUT RÉSERVATION
// ============================================

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const variants: Record<ReservationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    confirmed: { label: 'Confirmée', variant: 'default' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
    no_show: { label: 'No-show', variant: 'secondary' },
  };
  const { label, variant } = variants[status] || { label: status, variant: 'outline' };
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

// ============================================
// BADGE CHECK-IN
// ============================================

interface ReservationCheckinBadgeProps {
  status: CheckinStatus | null;
}

export function ReservationCheckinBadge({ status }: ReservationCheckinBadgeProps) {
  if (!status) return <span className="text-muted-foreground text-xs">Non pointé</span>;

  const variants: Record<CheckinStatus, { label: string; icon: React.ReactNode; className: string }> = {
    present_loved: { label: 'A aimé', icon: <Heart className="w-3 h-3" />, className: 'bg-pink-100 text-pink-700' },
    present_press: { label: 'Presse', icon: <Newspaper className="w-3 h-3" />, className: 'bg-blue-100 text-blue-700' },
    present_neutral: { label: 'Neutre', icon: <Meh className="w-3 h-3" />, className: 'bg-gray-100 text-gray-700' },
    absent: { label: 'Absent', icon: <XCircle className="w-3 h-3" />, className: 'bg-red-100 text-red-700' },
  };

  const { label, icon, className } = variants[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}
