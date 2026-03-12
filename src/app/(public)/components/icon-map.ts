/**
 * Icon Map — Mapping string → composant Lucide
 * Utilisé pour les cartes avantages de la homepage (icône stockée en string dans app_settings)
 */

import {
  Search,
  Calendar,
  MessageCircle,
  Star,
  Heart,
  Users,
  Shield,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  search: Search,
  calendar: Calendar,
  'message-circle': MessageCircle,
  star: Star,
  heart: Heart,
  users: Users,
  shield: Shield,
  zap: Zap,
};

/** Retourne l'icône correspondante, ou Search par défaut */
export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Search;
}
