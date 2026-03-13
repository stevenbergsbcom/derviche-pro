/**
 * Types — Page detail spectacle public
 * Derviche Diffusion
 */

/** TimeSlot interne avec date en objet Date (pour le calendrier) */
export interface TimeSlot {
  id: string;
  date: Date;
  time: string; // Format "11h00"
  /** null = illimite */
  remainingCapacity: number | null;
  /** null = illimite */
  totalCapacity: number | null;
  venueId: string;
  venueName: string;
  venueCity: string;
}

export type Step = 'calendar' | 'time' | 'participants' | 'form';

/** Valeur par defaut si le spectacle n'a pas de max defini */
export const DEFAULT_MAX_RESERVATIONS = 3;

/** Donnees du formulaire de reservation */
export interface ReservationFormData {
  lastName: string;
  firstName: string;
  email: string;
  emailSecondary: string;
  phone: string;
  phoneSecondary: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  organization: string;
  function: string;
  afcNumber: string;
  comment: string;
}

/** Valeur initiale du formulaire */
export const INITIAL_FORM_DATA: ReservationFormData = {
  lastName: '',
  firstName: '',
  email: '',
  emailSecondary: '',
  phone: '',
  phoneSecondary: '',
  address: '',
  postalCode: '',
  city: '',
  country: 'France',
  organization: '',
  function: '',
  afcNumber: '',
  comment: '',
};
