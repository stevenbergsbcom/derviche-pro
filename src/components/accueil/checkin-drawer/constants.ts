/**
 * Constantes - CheckinDrawer
 * Derviche Diffusion
 */

import { Check, Heart, Newspaper, X } from 'lucide-react';
import type { CheckinStatus } from '@/types/database';
import type { StatusButtonConfig } from './types';

// Ré-export getFullName depuis utils/guest pour rétrocompatibilité
export { getFullName } from '@/lib/utils/guest';

// ============================================
// CONFIGURATION DES BOUTONS DE STATUT
// ============================================

export const STATUS_BUTTONS: StatusButtonConfig[] = [
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

/**
 * Trouve la configuration d'un bouton de statut par son status
 */
export function getStatusButtonConfig(status: CheckinStatus | null): StatusButtonConfig | undefined {
  return STATUS_BUTTONS.find(b => b.status === status);
}
