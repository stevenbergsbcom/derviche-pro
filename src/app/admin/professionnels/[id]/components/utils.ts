/**
 * Fonctions utilitaires pour la fiche professionnel
 */

import type { Professional } from '@/lib/services/professionals';

/** Formate une date ISO en format court français (ex: "16 mars 2026") */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formate une heure "HH:MM:SS" en "HH:MM" */
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/** Construit le nom complet à partir du profil */
export function getFullName(professional: Professional): string {
  return [professional.first_name, professional.last_name].filter(Boolean).join(' ');
}

/** Construit le nom d'affichage (nom complet ou email en fallback) */
export function getDisplayName(professional: Professional): string {
  return getFullName(professional) || professional.email || '...';
}

/** Construit l'adresse formatée complète */
export function getFormattedAddress(professional: Professional): string {
  return [
    professional.address,
    [professional.postal_code, professional.city].filter(Boolean).join(' '),
    professional.country && professional.country !== 'France' ? professional.country : null,
  ]
    .filter(Boolean)
    .join(', ');
}
