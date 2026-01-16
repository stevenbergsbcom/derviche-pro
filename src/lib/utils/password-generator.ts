/**
 * Générateur de mot de passe sécurisé
 * Derviche Diffusion
 * 
 * Respecte les règles Supabase Auth :
 * - Minimum 10 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 */

// ============================================
// TYPES
// ============================================

export interface PasswordOptions {
  /** Longueur du mot de passe (défaut: 12) */
  length?: number;
  /** Inclure des majuscules (défaut: true) */
  uppercase?: boolean;
  /** Inclure des minuscules (défaut: true) */
  lowercase?: boolean;
  /** Inclure des chiffres (défaut: true) */
  numbers?: boolean;
  /** Inclure des caractères spéciaux (défaut: true) */
  symbols?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I et O (confusion avec 1 et 0)
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz'; // Sans i, l, o (confusion)
const NUMBERS = '23456789'; // Sans 0 et 1 (confusion avec O et l)
const SYMBOLS = '!@#$%&*?';

/** Longueur minimale requise par Supabase Auth */
const MIN_LENGTH = 10;

/** Longueur par défaut */
const DEFAULT_LENGTH = 12;

// ============================================
// FONCTIONS
// ============================================

/**
 * Génère un mot de passe aléatoire sécurisé
 * 
 * @example
 * ```ts
 * // Mot de passe par défaut (12 caractères, tous types)
 * const password = generatePassword();
 * 
 * // Mot de passe personnalisé
 * const password = generatePassword({ length: 16, symbols: false });
 * ```
 */
export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = DEFAULT_LENGTH,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  // Valider la longueur minimale
  const finalLength = Math.max(length, MIN_LENGTH);

  // Construire le pool de caractères
  let pool = '';
  const requiredChars: string[] = [];

  if (uppercase) {
    pool += UPPERCASE;
    // Garantir au moins un caractère de ce type
    requiredChars.push(getRandomChar(UPPERCASE));
  }

  if (lowercase) {
    pool += LOWERCASE;
    requiredChars.push(getRandomChar(LOWERCASE));
  }

  if (numbers) {
    pool += NUMBERS;
    requiredChars.push(getRandomChar(NUMBERS));
  }

  if (symbols) {
    pool += SYMBOLS;
    requiredChars.push(getRandomChar(SYMBOLS));
  }

  // S'assurer qu'on a au moins un type de caractère
  if (pool.length === 0) {
    pool = LOWERCASE + NUMBERS;
    requiredChars.push(getRandomChar(LOWERCASE));
    requiredChars.push(getRandomChar(NUMBERS));
  }

  // Générer les caractères restants
  const remainingLength = finalLength - requiredChars.length;
  const randomChars: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(getRandomChar(pool));
  }

  // Mélanger tous les caractères
  const allChars = [...requiredChars, ...randomChars];
  return shuffleArray(allChars).join('');
}

/**
 * Obtient un caractère aléatoire d'une chaîne
 */
function getRandomChar(str: string): string {
  const randomIndex = Math.floor(Math.random() * str.length);
  return str[randomIndex];
}

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Vérifie si un mot de passe respecte les règles Supabase Auth
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcule la force d'un mot de passe (0-100)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'faible' | 'moyen' | 'fort' | 'très fort';
} {
  let score = 0;

  // Longueur
  if (password.length >= 8) score += 10;
  if (password.length >= 10) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Types de caractères
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  // Bonus diversité
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 10;

  // Plafonner à 100
  score = Math.min(score, 100);

  // Déterminer le label
  let label: 'faible' | 'moyen' | 'fort' | 'très fort';
  if (score < 40) label = 'faible';
  else if (score < 60) label = 'moyen';
  else if (score < 80) label = 'fort';
  else label = 'très fort';

  return { score, label };
}
