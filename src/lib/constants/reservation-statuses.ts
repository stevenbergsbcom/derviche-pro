/**
 * Constantes partagées — Statuts réservation & check-in
 * Derviche Diffusion — S185
 *
 * Labels + classes CSS pour les badges de statut.
 * Source unique de vérité : remplace les copies inline dans
 * admin/professionnels/[id] et accueil/checkin-drawer.
 */

import type { ReservationStatus, CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface StatusBadgeConfig {
  label: string;
  className: string;
}

// ============================================
// RESERVATION STATUS
// ============================================

export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, StatusBadgeConfig> = {
  confirmed: { label: 'Confirmée', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800 border-red-200' },
  no_show: { label: 'No show', className: 'bg-gray-100 text-gray-700 border-gray-200' },
} as const;

// ============================================
// CHECKIN STATUS
// ============================================

export const CHECKIN_STATUS_CONFIG: Record<CheckinStatus, StatusBadgeConfig> = {
  present_loved: {
    label: '❤️ Coup de cœur',
    className: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  present_press: {
    label: '📰 Presse',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  present_neutral: {
    label: '✓ Présent',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  absent: {
    label: 'Absent',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
} as const;
