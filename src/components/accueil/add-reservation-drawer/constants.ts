/**
 * Constantes pour AddReservationDrawer
 * Derviche Diffusion - Session 82
 */

import { z } from 'zod';
import { Check, Heart, Newspaper, X } from 'lucide-react';
import type { StatusOption } from './types';

// ============================================
// SCHEMA DE VALIDATION ZOD
// ============================================

export const addReservationSchema = z.object({
  // Champs obligatoires
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide').max(255),
  numPlaces: z.number().min(1, 'Minimum 1 place').max(20, 'Maximum 20 places'),
  // Champs optionnels
  // NB : structure / code postal / ville sont obligatoires sur le formulaire
  // public et l'inscription pro (mig 123 / 124), mais RESTENT optionnels
  // dans le walk-in PWA pour ne pas freiner l'accueil rapide en salle —
  // le staff peut compléter ces infos plus tard via l'édition admin.
  phone: z.string().max(20).optional(),
  emailSecondary: z.string().email('Email secondaire invalide').max(255).optional().or(z.literal('')),
  phoneSecondary: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
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

// ============================================
// VALEURS PAR DÉFAUT DU FORMULAIRE
// ============================================

export const DEFAULT_FORM_VALUES = {
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
  country: 'France',
  organization: '',
  function: '',
  afcNumber: '',
  specialRequests: '',
  checkinStatus: undefined,
  checkinComment: '',
  checkinVenueNotes: '',
  checkinInternalNotes: '',
} as const;

// ============================================
// OPTIONS DE STATUT CHECK-IN
// ============================================

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'present_neutral', label: 'Présent', icon: Check, color: 'text-green-600' },
  { value: 'present_loved', label: 'Coup de cœur', icon: Heart, color: 'text-pink-600' },
  { value: 'present_press', label: 'Presse', icon: Newspaper, color: 'text-blue-600' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-red-600' },
];
