/**
 * Types et interfaces pour le service Check-in
 * Derviche Diffusion
 */

import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy, CheckinStatus } from '@/types/database';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';

// ============================================
// TYPES DE BASE
// ============================================

/** Spectacle accessible pour le check-in */
export interface CheckinShow {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  company: {
    id: string;
    name: string;
  };
  /** Nombre de représentations à venir (aujourd'hui inclus) */
  upcomingSlotsCount: number;
  /** Nombre de représentations passées */
  pastSlotsCount: number;
  /** Prochaine représentation (ou null si aucune à venir) */
  nextSlot: {
    id: string;
    date: string;
    time: string;
    venueName: string;
  } | null;
  /** Dernière représentation passée (ou null si aucune passée) */
  lastSlot: {
    id: string;
    date: string;
    time: string;
    venueName: string;
  } | null;
}

/** Représentation accessible pour le check-in */
export interface CheckinSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  hostedBy: SlotHostedBy;
  hostedById: string | null;
  venue: {
    id: string;
    name: string;
    city: string;
  };
  show: {
    id: string;
    slug: string;
    title: string;
  };
  /** Nombre de réservations confirmées */
  confirmedCount: number;
  /** Nombre de personnes présentes (check-in fait) */
  checkedInCount: number;
}

/** Réservation pour le check-in */
export interface CheckinReservation {
  id: string;
  /** ID de l'utilisateur connecté (null pour les réservations invité) */
  userId: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestEmailSecondary: string | null;
  guestPhone: string | null;
  guestPhoneSecondary: string | null;
  guestFunction: string | null;
  guestStructure: string | null;
  guestAddress: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestCountry: string | null;
  guestAfcNumber: string | null;
  numPlaces: number;
  status: 'confirmed' | 'cancelled' | 'no_show';
  checkinStatus: CheckinStatus | null;
  checkinComment: string | null;
  /** Notes sur le lieu (visibles par tous) */
  checkinVenueNotes: string | null;
  /** Notes internes Derviche (visibles uniquement par admin) */
  checkinInternalNotes: string | null;
  specialRequests: string | null;
  createdAt: string;
  /** ID de l'événement Google Calendar (null si jamais créé) */
  googleCalendarEventId: string | null;
  /** Emails post-checkin déjà envoyés pour cette réservation */
  checkinFollowupEmails: { templateKey: CheckinFollowupTemplateKey; sentAt: string }[];
}

// ============================================
// TYPES DE RÉSULTAT
// ============================================

/** Résultat de la récupération des spectacles */
export interface CheckinShowsResult {
  data: CheckinShow[];
  error: string | null;
}

/** Résultat de la récupération des représentations */
export interface CheckinSlotsResult {
  data: CheckinSlot[];
  error: string | null;
}

/** Résultat de la récupération des réservations */
export interface CheckinReservationsResult {
  data: CheckinReservation[];
  error: string | null;
}

// ============================================
// OPTIONS ET PARAMÈTRES
// ============================================

/** Options pour filtrer les slots lors de la récupération */
export interface GetSlotsOptions {
  /** Limite en jours pour les slots passés (par défaut: 30) */
  pastDaysLimit?: number;
  /** Charger uniquement les slots à venir (ignorer les passés) */
  upcomingOnly?: boolean;
  /** Charger tout l'historique (ignorer pastDaysLimit) */
  includeAllPast?: boolean;
}

/** Paramètres pour mettre à jour le statut de check-in et/ou les infos guest */
export interface UpdateCheckinParams {
  reservationId: string;
  /** Statut de check-in (optionnel - si absent, seules les infos guest sont mises à jour) */
  status?: CheckinStatus | null;
  comment?: string | null;
  /** Notes sur le lieu (visibles par tous les rôles) */
  venueNotes?: string | null;
  /** Notes internes Derviche (visibles uniquement par super-admin/admin) */
  internalNotes?: string | null;
  userId: string;
  role: UserRole;
  companyId: string | null;
  // Champs guest (optionnels - pour modification des infos du professionnel)
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestEmailSecondary?: string | null;
  guestPhone?: string | null;
  guestPhoneSecondary?: string | null;
  guestStructure?: string | null;
  guestFunction?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestCountry?: string | null;
  guestAfcNumber?: string | null;
  specialRequests?: string | null;
}

/** Résultat de la mise à jour du check-in */
export interface UpdateCheckinResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

/** Paramètres pour mettre à jour les infos d'un guest (fonctionne même si annulée) */
export interface UpdateGuestInfoParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
  // Champs guest
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestEmailSecondary?: string | null;
  guestPhone?: string | null;
  guestPhoneSecondary?: string | null;
  guestStructure?: string | null;
  guestFunction?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestCountry?: string | null;
  guestAfcNumber?: string | null;
  specialRequests?: string | null;
  // Notes (pas de checkin_status car réservation peut être annulée)
  checkinComment?: string | null;
  checkinVenueNotes?: string | null;
  checkinInternalNotes?: string | null;
}

/** Résultat de la mise à jour des infos guest */
export interface UpdateGuestInfoResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

// ============================================
// CRÉATION DE RÉSERVATION
// ============================================

/** Données du formulaire de création de réservation depuis le check-in */
export interface CreateCheckinReservationData {
  // Champs obligatoires
  slotId: string;
  numPlaces: number;
  firstName: string;
  lastName: string;
  email: string;
  // Champs optionnels du guest
  phone?: string;
  emailSecondary?: string;
  phoneSecondary?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  organization?: string;  // -> guest_structure
  function?: string;      // -> guest_function
  afcNumber?: string;
  // Commentaire / demandes
  specialRequests?: string;
  // Champs check-in (optionnels)
  checkinStatus?: CheckinStatus;
  checkinComment?: string;
  checkinVenueNotes?: string;
  checkinInternalNotes?: string;
}

/** Résultat de la création de réservation depuis le check-in */
export interface CreateCheckinReservationResult {
  success: boolean;
  reservationId?: string;
  /** Avertissement (ex: doublon email) - ne bloque pas la création */
  warning?: string;
  error?: string;
}

/** Résultat de la vérification de doublon */
export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  existingReservation?: {
    id: string;
    guestFirstName: string | null;
    guestLastName: string | null;
    numPlaces: number;
  };
}

// ============================================
// TRANSFERT DE RÉSERVATION
// ============================================

/** Paramètres pour transférer une réservation vers un autre créneau */
export interface TransferReservationParams {
  reservationId: string;
  targetSlotId: string;
  /** Nouveau nombre de places (optionnel - si absent, garde le nombre actuel) */
  newNumPlaces?: number;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Informations sur la capacité d'un slot après transfert */
export interface SlotCapacityInfo {
  capacity: number;
  remainingAfterTransfer: number;
  isUnlimited: boolean;
  isOverbooking: boolean;
}

/** Résultat du transfert de réservation */
export interface TransferReservationResult {
  success: boolean;
  data: {
    reservation: CheckinReservation;
    targetSlotCapacity: SlotCapacityInfo;
  } | null;
  error: string | null;
}

/** Résultat étendu pour les slots de transfert (inclut info doublon) */
export interface TransferTargetSlot extends CheckinSlot {
  /** True si l'invité a déjà une réservation confirmée sur ce créneau */
  hasExistingGuestReservation: boolean;
}

/** Résultat de la récupération des slots de transfert */
export interface TransferTargetSlotsResult {
  data: TransferTargetSlot[];
  error: string | null;
}

// ============================================
// ANNULATION ET RÉACTIVATION
// ============================================

/** Paramètres pour annuler une réservation */
export interface CancelReservationParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Résultat de l'annulation */
export interface CancelReservationResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

/** Paramètres pour réactiver une réservation annulée */
export interface ReactivateReservationParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Résultat de la réactivation */
export interface ReactivateReservationResult {
  success: boolean;
  data: {
    reservation: CheckinReservation;
    /** True si la réactivation a causé un overbooking */
    isOverbooking: boolean;
  } | null;
  error: string | null;
}
