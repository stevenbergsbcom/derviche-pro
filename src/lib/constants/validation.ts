/**
 * Constantes de validation centralisées
 * Derviche Diffusion - Session 104
 * 
 * Ce fichier centralise tous les patterns de validation
 * pour garantir la cohérence à travers l'application.
 */

// ============================================
// PATTERNS DE VALIDATION
// ============================================

/**
 * Pattern de validation email
 * Format: xxx@xxx.xxx (au moins un caractère avant/après @ et .)
 * Utilisé dans : user-form-dialog, create-reservation-dialog, etc.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pattern de validation code postal français
 * Format: 5 chiffres (ex: 75001, 69000)
 */
export const POSTAL_CODE_REGEX = /^\d{5}$/;

/**
 * Pattern de validation téléphone français
 * Format: 10 chiffres avec ou sans espaces (ex: 0612345678, 06 12 34 56 78)
 */
export const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

// ============================================
// FONCTIONS DE VALIDATION
// ============================================

/**
 * Valide le format d'un email
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Valide le format d'un code postal français
 */
export function isValidPostalCode(postalCode: string): boolean {
  return POSTAL_CODE_REGEX.test(postalCode.trim());
}

/**
 * Valide le format d'un téléphone français
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim().replace(/\s/g, ''));
}
