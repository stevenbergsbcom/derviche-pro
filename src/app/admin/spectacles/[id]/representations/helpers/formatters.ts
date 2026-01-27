/**
 * Fonctions utilitaires de formatage pour les représentations
 */

import {
  DAYS_FR,
  MONTHS_FR,
  MONTHS_FR_CAPITALIZED,
  CAPACITY_COLORS,
  CAPACITY_THRESHOLDS,
  UNLIMITED_CAPACITY,
} from '../constants';
import type { MockRepresentation, MockVenue, MockUser } from '../types';
import type { SlotWithRelations } from '@/lib/services/representations';
import type { VenueRow, InternalUser } from '@/types/database';

// ============================================
// FORMATAGE DES DATES
// ============================================

/**
 * Formate une date ISO en format lisible français
 * @example formatDate('2025-03-15') => 'Sam. 15 mars 2025'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return `${DAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Extrait le mois d'une date au format YYYY-MM
 * @example getMonthFromDate('2025-03-15') => '2025-03'
 */
export function getMonthFromDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formate un mois YYYY-MM en format lisible
 * @example formatMonth('2025-03') => 'Mars 2025'
 */
export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-');
  return `${MONTHS_FR_CAPITALIZED[parseInt(month) - 1]} ${year}`;
}

// ============================================
// CALCULS DE CAPACITÉ
// ============================================

/**
 * Calcule le pourcentage de remplissage
 * @returns Le pourcentage (0-100) ou null si capacité illimitée
 */
export function getCapacityPercentage(booked: number, capacity: number | null): number | null {
  if (capacity === null) return null;
  return Math.round((booked / capacity) * 100);
}

/**
 * Retourne la classe CSS de couleur pour la barre de capacité
 */
export function getCapacityColor(percentage: number | null): string {
  if (percentage === null) return CAPACITY_COLORS.EMPTY;
  if (percentage >= CAPACITY_THRESHOLDS.HIGH) return CAPACITY_COLORS.HIGH;
  if (percentage >= CAPACITY_THRESHOLDS.MEDIUM) return CAPACITY_COLORS.MEDIUM;
  return CAPACITY_COLORS.LOW;
}

/**
 * Calcule les données d'affichage de la capacité
 */
export function getCapacityDisplay(booked: number, capacity: number | null): {
  percentage: number | null;
  isUnlimited: boolean;
  remaining: number | null;
  colorClass: string;
} {
  const isUnlimited = capacity === null;
  const percentage = getCapacityPercentage(booked, capacity);
  const remaining = isUnlimited ? null : (capacity ?? 0) - booked;
  const colorClass = getCapacityColor(percentage);

  return { percentage, isUnlimited, remaining, colorClass };
}

// ============================================
// FORMATAGE DU BADGE HOSTED BY
// ============================================

/**
 * Formate le texte du badge "Accueil"
 * @returns Le texte à afficher (ex: "Derviche - Jean D.", "Externe - Jean D." ou "Compagnie")
 */
export function formatHostedByText(
  hostedBy: 'derviche' | 'company' | 'externe',
  hostedById: string | null,
  internalUsers: MockUser[]
): string {
  if (hostedBy === 'company') {
    return 'Compagnie';
  }

  // Pour 'derviche' ou 'externe', afficher le nom de l'utilisateur si disponible
  const label = hostedBy === 'externe' ? 'Externe' : 'Derviche';

  if (!hostedById) {
    return label;
  }

  const user = internalUsers.find((u) => u.id === hostedById);
  if (!user) {
    return label;
  }

  return `${label} - ${user.firstName} ${user.lastName.charAt(0)}.`;
}

// ============================================
// MAPPERS SUPABASE → MOCK
// ============================================

/**
 * Convertit un SlotWithRelations en MockRepresentation
 * Note: capacity >= UNLIMITED_CAPACITY est considéré comme "illimité" (null)
 */
export function slotToMockRepresentation(
  slot: SlotWithRelations,
  showTitle: string,
  companyName: string
): MockRepresentation {
  // Calculer booked à partir des valeurs brutes de la BDD
  // Protéger contre les valeurs négatives
  const booked = Math.max(0, slot.capacity - slot.remaining_capacity);
  
  // Convertir capacity >= UNLIMITED_CAPACITY en null (illimité) pour l'affichage
  const capacity = slot.capacity >= UNLIMITED_CAPACITY ? null : slot.capacity;

  return {
    id: slot.id,
    showId: slot.show_id,
    showTitle,
    companyName,
    date: slot.date,
    time: slot.time.slice(0, 5), // Convertir HH:MM:SS → HH:MM
    venueId: slot.venue_id,
    venueName: slot.venue?.name || 'Lieu inconnu',
    capacity,
    booked,
    hostedBy: slot.hosted_by,
    hostedById: slot.hosted_by_id,
  };
}

/**
 * Convertit un VenueRow en MockVenue
 */
export function venueToMockVenue(venue: VenueRow): MockVenue {
  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
  };
}

/**
 * Convertit un InternalUser en MockUser
 */
export function internalUserToMockUser(user: InternalUser): MockUser {
  return {
    id: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email,
    role: user.role,
  };
}
