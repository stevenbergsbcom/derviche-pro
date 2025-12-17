/**
 * Types métier pour le parcours de réservation
 * Derviche Diffusion - Plateforme de réservation professionnelle
 * 
 * Ces types sont utilisés dans les composants React pour le parcours
 * de réservation. Ils peuvent inclure des données enrichies (jointures)
 * ou des transformations pour l'affichage.
 */

import type { 
  ShowRow, 
  SlotRow, 
  VenueRow, 
  CompanyRow, 
  ShowCategoryRow,
  ReservationRow,
  ProfileRow 
} from './database';

// ============================================
// STATUTS DE DISPONIBILITÉ (FRONTEND)
// ============================================

/**
 * Statut de disponibilité d'un spectacle pour les réservations.
 * Différent du status BDD (draft/published/archived) qui gère la publication.
 * 
 * - available : Réservations ouvertes, créneaux disponibles
 * - coming_soon : Spectacle publié mais réservations pas encore ouvertes
 * - closed : Réservations fermées (complet ou date passée)
 */
export type BookingAvailability = 'available' | 'coming_soon' | 'closed';

// ============================================
// TYPES ENRICHIS POUR L'AFFICHAGE
// ============================================

/**
 * Créneau enrichi avec les infos de la salle.
 * Utilisé pour l'affichage dans le sélecteur de créneaux.
 */
export interface SlotWithVenue extends SlotRow {
  venue: Pick<VenueRow, 'id' | 'name' | 'address' | 'city'>;
}

/**
 * Spectacle enrichi avec toutes les données nécessaires à l'affichage.
 * Utilisé sur les pages catalogue et détail spectacle.
 */
export interface ShowWithDetails extends ShowRow {
  /** Compagnie du spectacle */
  company: Pick<CompanyRow, 'id' | 'name'>;
  /** Salle principale (première venue des slots) */
  venue: Pick<VenueRow, 'id' | 'name' | 'address' | 'city'> | null;
  /** Catégories associées */
  categories: Pick<ShowCategoryRow, 'id' | 'name' | 'slug'>[];
  /** Créneaux disponibles */
  slots: SlotWithVenue[];
  /** Statut de disponibilité calculé (pas stocké en BDD) */
  bookingAvailability: BookingAvailability;
  /** Nombre de créneaux avec places disponibles */
  availableSlotsCount: number;
}

/**
 * Carte spectacle simplifiée pour le catalogue.
 * Version allégée de ShowWithDetails pour les listes.
 */
export interface ShowCard {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  shortDescription: string | null;
  durationMinutes: number | null;
  imageUrl: string | null;
  priceType: 'free' | 'paid_on_site';
  categoryName: string | null;
  venueName: string | null;
  bookingAvailability: BookingAvailability;
  /** Pour le badge "Dernières représentations" */
  availableSlotsCount: number;
  /** Période d'affichage (ex: "Du 5 au 26 juillet") */
  periodDisplay: string | null;
}

// ============================================
// TYPES POUR LE FORMULAIRE DE RÉSERVATION
// ============================================

/**
 * Données du formulaire de réservation (avant envoi).
 * Correspond aux champs du formulaire côté frontend.
 */
export interface ReservationFormData {
  /** Nom de famille */
  lastName: string;
  /** Prénom */
  firstName: string;
  /** Email principal */
  email: string;
  /** Email secondaire (optionnel) */
  emailSecondary: string;
  /** Téléphone principal */
  phone: string;
  /** Téléphone secondaire (optionnel) */
  phoneSecondary: string;
  /** Adresse (optionnel) */
  address: string;
  /** Code postal (optionnel) */
  postalCode: string;
  /** Ville (optionnel) */
  city: string;
  /** Structure / Organisation (optionnel) */
  organization: string;
  /** Fonction (optionnel) */
  function: string;
  /** Numéro AFC (optionnel) */
  afcNumber: string;
  /** Commentaire / Demande spéciale (optionnel) */
  comment: string;
}

/**
 * Données complètes d'une réservation (avant création).
 * Combine les infos du formulaire + la sélection créneau/participants.
 */
export interface ReservationCreateData {
  /** ID du créneau sélectionné */
  slotId: string;
  /** Nombre de participants */
  numPlaces: number;
  /** ID utilisateur si connecté */
  userId: string | null;
  /** Données du formulaire */
  formData: ReservationFormData;
}

// ============================================
// TYPES POUR LA CONFIRMATION DE RÉSERVATION
// ============================================

/**
 * Code de réservation formaté pour l'affichage.
 * Format : DD-XXXXXX (ex: DD-A7F3K9)
 */
export type ReservationCode = string;

/**
 * Données de confirmation de réservation.
 * Affichées sur la page de confirmation après création.
 */
export interface ReservationConfirmation {
  /** Code de réservation unique */
  code: ReservationCode;
  /** ID de la réservation en BDD */
  reservationId: string;
  /** Infos sur le spectacle */
  show: {
    title: string;
    slug: string;
    companyName: string;
    imageUrl: string | null;
    duration: string | null;
  };
  /** Infos sur le créneau */
  slot: {
    date: string; // Format ISO
    time: string; // Format HH:MM
    formattedDate: string; // Ex: "Samedi 5 juillet 2025"
    formattedTime: string; // Ex: "11h00"
  };
  /** Infos sur la salle */
  venue: {
    name: string;
    address: string;
    city: string;
  };
  /** Nombre de places réservées */
  numPlaces: number;
  /** Nom complet du réservant */
  guestFullName: string;
  /** Email du réservant */
  guestEmail: string;
  /** Date de création de la réservation */
  createdAt: string;
}

/**
 * Suggestion de spectacle pour la page de confirmation.
 * Spectacles similaires à recommander après une réservation.
 */
export interface ShowSuggestion {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  imageUrl: string | null;
  categoryName: string | null;
  bookingAvailability: BookingAvailability;
}

// ============================================
// TYPES POUR LE DASHBOARD PROGRAMMATEUR
// ============================================

/**
 * Réservation enrichie pour le dashboard programmateur.
 * Inclut les infos du spectacle et du créneau.
 */
export interface ReservationWithDetails extends ReservationRow {
  /** Infos du créneau */
  slot: SlotRow & {
    /** Infos du spectacle */
    show: Pick<ShowRow, 'id' | 'slug' | 'title' | 'image_url'> & {
      company: Pick<CompanyRow, 'name'>;
    };
    /** Infos de la salle */
    venue: Pick<VenueRow, 'name' | 'address' | 'city'>;
  };
}

/**
 * Statistiques du programmateur pour son dashboard.
 */
export interface ProgrammerStats {
  /** Nombre total de réservations */
  totalReservations: number;
  /** Réservations à venir */
  upcomingReservations: number;
  /** Réservations passées */
  pastReservations: number;
  /** Réservations annulées */
  cancelledReservations: number;
  /** Nombre de spectacles différents réservés */
  uniqueShowsBooked: number;
}

// ============================================
// HELPERS / UTILITAIRES
// ============================================

/**
 * Génère un code de réservation à partir de l'UUID.
 * Format : DD-XXXXXX (6 caractères alphanumériques majuscules)
 */
export function generateReservationCode(reservationId: string): ReservationCode {
  // Prend les 6 premiers caractères de l'UUID et les met en majuscules
  const shortCode = reservationId.replace(/-/g, '').substring(0, 6).toUpperCase();
  return `DD-${shortCode}`;
}

/**
 * Formate une date ISO en date française lisible.
 * @param isoDate - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée (ex: "Samedi 5 juillet 2025")
 */
export function formatDateFR(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une heure au format français.
 * @param time - Heure au format HH:MM:SS ou HH:MM
 * @returns Heure formatée (ex: "11h00")
 */
export function formatTimeFR(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}

/**
 * Calcule le statut de disponibilité d'un spectacle.
 * @param show - Spectacle avec ses créneaux
 * @returns Statut de disponibilité
 */
export function calculateBookingAvailability(
  show: Pick<ShowRow, 'status'>,
  slots: Pick<SlotRow, 'remaining_capacity' | 'date'>[]
): BookingAvailability {
  // Si le spectacle n'est pas publié
  if (show.status !== 'published') {
    return 'closed';
  }

  // Si pas de créneaux
  if (slots.length === 0) {
    return 'coming_soon';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filtrer les créneaux futurs avec des places
  const availableSlots = slots.filter((slot) => {
    const slotDate = new Date(slot.date);
    return slotDate >= today && slot.remaining_capacity > 0;
  });

  if (availableSlots.length === 0) {
    return 'closed';
  }

  return 'available';
}
