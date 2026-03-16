/**
 * Configuration visuelle et helpers pour le tableau de logs
 * Derviche Diffusion
 *
 * Constantes de rendu (catégories, niveaux, rôles) et fonctions utilitaires
 * partagées entre les sous-composants du tableau de logs.
 */

import {
  Mail,
  Calendar,
  BookOpen,
  Server,
  Film,
} from 'lucide-react';
import type { AppLog } from '@/app/api/admin/logs/route';

// ============================================
// CONFIG VISUELS
// ============================================

export const CATEGORY_CONFIG: Record<
  AppLog['category'],
  { label: string; icon: React.ElementType; className: string }
> = {
  email:       { label: 'Email',        icon: Mail,     className: 'text-blue-600    bg-blue-50    dark:bg-blue-950/30'    },
  calendar:    { label: 'Calendar',     icon: Calendar, className: 'text-purple-600  bg-purple-50  dark:bg-purple-950/30'  },
  reservation: { label: 'Réservation',  icon: BookOpen, className: 'text-amber-600   bg-amber-50   dark:bg-amber-950/30'   },
  show:        { label: 'Spectacle',    icon: Film,     className: 'text-pink-600    bg-pink-50    dark:bg-pink-950/30'    },
  system:      { label: 'Système',      icon: Server,   className: 'text-slate-600   bg-slate-100  dark:bg-slate-800/50'   },
};

export const LEVEL_CONFIG: Record<AppLog['level'], { label: string; className: string }> = {
  info:    { label: 'Info',        className: 'text-muted-foreground' },
  warning: { label: 'Attention',   className: 'text-orange-600' },
  error:   { label: 'Erreur',      className: 'text-red-600 font-semibold' },
};

export const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super-admin',
  'admin': 'Admin',
  'externe': 'Externe',
  'company': 'Compagnie',
  'professional': 'Pro',
};

// ============================================
// HELPERS
// ============================================

/** Formate une date ISO en chaîne lisible fr-FR */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Formate un identifiant d'action en libellé lisible */
export function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
