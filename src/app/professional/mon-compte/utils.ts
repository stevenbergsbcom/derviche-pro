/**
 * Utilitaires — Mon Compte professionnel
 * Derviche Diffusion
 */

import type { PasswordData } from './types';

/** Valide le nouveau mot de passe et retourne un message d'erreur ou null */
export function validatePassword(data: PasswordData): string | null {
  if (!data.currentPassword) return 'Le mot de passe actuel est requis';
  if (!data.newPassword) return 'Le nouveau mot de passe est requis';
  if (data.newPassword.length < 10)
    return 'Le mot de passe doit contenir au moins 10 caractères';
  if (!/[A-Z]/.test(data.newPassword))
    return 'Le mot de passe doit contenir au moins une majuscule';
  if (!/[a-z]/.test(data.newPassword))
    return 'Le mot de passe doit contenir au moins une minuscule';
  if (!/[0-9]/.test(data.newPassword))
    return 'Le mot de passe doit contenir au moins un chiffre';
  if (data.newPassword !== data.confirmPassword)
    return 'Les mots de passe ne correspondent pas';
  if (data.newPassword === data.currentPassword)
    return "Le nouveau mot de passe doit être différent de l'actuel";
  return null;
}
