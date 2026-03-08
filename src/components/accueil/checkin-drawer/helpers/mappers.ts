/**
 * Mappers - Transformations de données CheckinDrawer
 * Derviche Diffusion
 * 
 * Fonctions pures pour :
 * - Initialiser les états depuis une reservation
 * - Construire les payloads API
 * - Fusionner les résultats avec les données existantes
 */

import type { ReservationRowData } from '../../ReservationRow';
import type { GuestFormState, CheckinFormState } from '../types';
import type { CheckinStatus, ReservationStatus } from '@/types/database';

// ============================================
// TYPES LOCAUX
// ============================================

/** Payload guest pour les services API */
export interface GuestPayload {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestEmailSecondary: string | null;
  guestPhone: string | null;
  guestPhoneSecondary: string | null;
  guestStructure: string | null;
  guestFunction: string | null;
  guestAddress: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestCountry: string | null;
  guestAfcNumber: string | null;
  specialRequests: string | null;
}

/** Données guest retournées par l'API */
export interface GuestResultData {
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestEmailSecondary: string | null;
  guestPhone: string | null;
  guestPhoneSecondary: string | null;
  guestStructure: string | null;
  guestFunction: string | null;
  guestAddress: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestCountry: string | null;
  guestAfcNumber: string | null;
  specialRequests: string | null;
}

/** Données checkin retournées par l'API */
export interface CheckinResultData {
  status: ReservationStatus;
  checkinStatus: CheckinStatus | null;
  checkinComment: string | null;
  checkinVenueNotes: string | null;
  checkinInternalNotes: string | null;
}

// ============================================
// INITIALISATION DEPUIS RESERVATION
// ============================================

/**
 * Initialise l'état du formulaire guest depuis une reservation
 */
export function mapReservationToGuestState(reservation: ReservationRowData): GuestFormState {
  return {
    firstName: reservation.guestFirstName || '',
    lastName: reservation.guestLastName || '',
    email: reservation.guestEmail || '',
    emailSecondary: reservation.guestEmailSecondary || '',
    phone: reservation.guestPhone || '',
    phoneSecondary: reservation.guestPhoneSecondary || '',
    structure: reservation.guestStructure || '',
    function: reservation.guestFunction || '',
    address: reservation.guestAddress || '',
    postalCode: reservation.guestPostalCode || '',
    city: reservation.guestCity || '',
    country: reservation.guestCountry || '',
    afcNumber: reservation.guestAfcNumber || '',
    specialRequests: reservation.specialRequests || '',
  };
}

/**
 * Initialise l'état du formulaire check-in depuis une reservation
 */
export function mapReservationToCheckinState(reservation: ReservationRowData): CheckinFormState {
  return {
    selectedStatus: reservation.checkinStatus,
    comment: reservation.checkinComment || '',
    venueNotes: reservation.checkinVenueNotes || '',
    internalNotes: reservation.checkinInternalNotes || '',
  };
}

// ============================================
// CONSTRUCTION DES PAYLOADS API
// ============================================

/**
 * Construit le payload guest pour l'API
 * - Applique trim() sur tous les champs
 * - Convertit les chaînes vides en null
 */
export function buildGuestPayload(guest: GuestFormState): GuestPayload {
  return {
    guestFirstName: guest.firstName.trim(),
    guestLastName: guest.lastName.trim(),
    guestEmail: guest.email.trim(),
    guestEmailSecondary: guest.emailSecondary.trim() || null,
    guestPhone: guest.phone.trim() || null,
    guestPhoneSecondary: guest.phoneSecondary.trim() || null,
    guestStructure: guest.structure.trim() || null,
    guestFunction: guest.function.trim() || null,
    guestAddress: guest.address.trim() || null,
    guestPostalCode: guest.postalCode.trim() || null,
    guestCity: guest.city.trim() || null,
    guestCountry: guest.country.trim() || null,
    guestAfcNumber: guest.afcNumber.trim() || null,
    specialRequests: guest.specialRequests.trim() || null,
  };
}

// ============================================
// FUSION DES RÉSULTATS
// ============================================

/**
 * Fusionne les données de l'API avec la reservation existante
 * Utilisé après save/reactivate/cancel pour mettre à jour la liste
 */
export function mapResultToReservationUpdate(
  originalReservation: ReservationRowData,
  guestData: GuestResultData,
  checkinData: CheckinResultData
): ReservationRowData {
  return {
    ...originalReservation,
    status: checkinData.status,
    checkinStatus: checkinData.checkinStatus,
    checkinComment: checkinData.checkinComment,
    checkinVenueNotes: checkinData.checkinVenueNotes,
    checkinInternalNotes: checkinData.checkinInternalNotes,
    guestFirstName: guestData.guestFirstName,
    guestLastName: guestData.guestLastName,
    guestEmail: guestData.guestEmail,
    guestEmailSecondary: guestData.guestEmailSecondary,
    guestPhone: guestData.guestPhone,
    guestPhoneSecondary: guestData.guestPhoneSecondary,
    guestStructure: guestData.guestStructure,
    guestFunction: guestData.guestFunction,
    guestAddress: guestData.guestAddress,
    guestPostalCode: guestData.guestPostalCode,
    guestCity: guestData.guestCity,
    guestCountry: guestData.guestCountry,
    guestAfcNumber: guestData.guestAfcNumber,
    specialRequests: guestData.specialRequests,
  };
}

// ============================================
// COMPARAISONS
// ============================================

/**
 * Vérifie si les données guest ont changé
 */
export function hasGuestChanges(
  current: GuestFormState,
  original: ReservationRowData
): boolean {
  return (
    current.firstName !== (original.guestFirstName || '') ||
    current.lastName !== (original.guestLastName || '') ||
    current.email !== (original.guestEmail || '') ||
    current.emailSecondary !== (original.guestEmailSecondary || '') ||
    current.phone !== (original.guestPhone || '') ||
    current.phoneSecondary !== (original.guestPhoneSecondary || '') ||
    current.structure !== (original.guestStructure || '') ||
    current.function !== (original.guestFunction || '') ||
    current.address !== (original.guestAddress || '') ||
    current.postalCode !== (original.guestPostalCode || '') ||
    current.city !== (original.guestCity || '') ||
    current.country !== (original.guestCountry || '') ||
    current.afcNumber !== (original.guestAfcNumber || '') ||
    current.specialRequests !== (original.specialRequests || '')
  );
}

/**
 * Vérifie si les données checkin ont changé
 */
export function hasCheckinChanges(
  current: CheckinFormState,
  original: ReservationRowData
): boolean {
  return (
    current.selectedStatus !== original.checkinStatus ||
    current.comment !== (original.checkinComment || '') ||
    current.venueNotes !== (original.checkinVenueNotes || '') ||
    current.internalNotes !== (original.checkinInternalNotes || '')
  );
}
