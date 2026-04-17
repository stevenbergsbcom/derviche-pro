/**
 * Service Public Catalog - Types
 * Derviche Diffusion
 */

import type { ShowStatus, ShowPriceType, SlotHostedBy } from '@/types/database';

/** Lieu public simplifié */
export interface PublicVenue {
  id: string;
  name: string;
  city: string;
}

/** Représentation publique (slot) avec infos lieu */
export interface PublicSlot {
  id: string;
  date: string; // Format YYYY-MM-DD
  time: string; // Format HH:MM
  venueId: string;
  venueName: string;
  venueCity: string;
  /** null = illimité */
  capacity: number | null;
  /** Places restantes (null si illimité) */
  remainingCapacity: number | null;
  /** Places réservées */
  booked: number;
  hostedBy: SlotHostedBy;
}

/** Spectacle public avec ses représentations */
export interface PublicShow {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  companyName: string;
  shortDescription: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  durationMinutes: number | null;
  status: ShowStatus;
  priceType: ShowPriceType;
  /** Nombre max de participants par réservation (défaut: 3) */
  maxReservationsPerBooking: number;
  /** Catégories du spectacle */
  categories: string[];
  /** Publics cibles */
  targetAudiences: string[];
  /** Lieux distincts où se joue le spectacle */
  venues: PublicVenue[];
  /** Représentations futures */
  slots: PublicSlot[];
  /** Nombre total de créneaux avec places disponibles */
  availableSlotsCount: number;
  /** Prochaine date disponible (format français) */
  nextDate: string | null;
  /** Lieu de la prochaine représentation */
  nextVenue: string | null;
  /** Période du spectacle (texte libre, ex: "Janvier - Mars 2026") */
  period: string | null;
  /** Dates de relâche */
  closureDates: string | null;
  /** Politique d'invitation (ex: "1 invitation + détaxe, sur réservation") */
  invitationPolicy: string | null;
  /** URL du teaser vidéo (YouTube ou Vimeo). Null si non renseigné. */
  teaserUrl: string | null;
  /** Responsable Derviche — prénom + nom + tél + email */
  dervisheManager: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;
}

/** Résultat de la récupération du catalogue */
export interface PublicCatalogResult {
  data: PublicShow[];
  error: string | null;
}

/** Résultat de la récupération d'un spectacle */
export interface PublicShowResult {
  data: PublicShow | null;
  error: string | null;
}
