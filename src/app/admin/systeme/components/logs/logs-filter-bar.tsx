/**
 * LogsFilterBar — Barre de filtres du tableau de logs
 * Derviche Diffusion
 *
 * Trois sélecteurs : catégorie, niveau et statut.
 */

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LogCategory, LogLevel, LogStatus } from '../systeme-content';

/** Props du composant LogsFilterBar */
interface LogsFilterBarProps {
  /** Catégorie sélectionnée */
  category: LogCategory;
  /** Niveau sélectionné */
  level: LogLevel;
  /** Statut sélectionné */
  status: LogStatus;
  /** Callback changement de catégorie */
  onCategoryChange: (val: LogCategory) => void;
  /** Callback changement de niveau */
  onLevelChange: (val: LogLevel) => void;
  /** Callback changement de statut */
  onStatusChange: (val: LogStatus) => void;
}

/** Barre de filtres catégorie / niveau / statut */
export function LogsFilterBar({
  category,
  level,
  status,
  onCategoryChange,
  onLevelChange,
  onStatusChange,
}: LogsFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Select value={category} onValueChange={v => onCategoryChange(v as LogCategory)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes catégories</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="calendar">Calendar</SelectItem>
          <SelectItem value="reservation">Réservation</SelectItem>
          <SelectItem value="show">Spectacle</SelectItem>
          <SelectItem value="system">Système</SelectItem>
        </SelectContent>
      </Select>

      <Select value={level} onValueChange={v => onLevelChange(v as LogLevel)}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Niveau" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous niveaux</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Attention</SelectItem>
          <SelectItem value="error">Erreur</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={v => onStatusChange(v as LogStatus)}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="success">Succès</SelectItem>
          <SelectItem value="error">Erreur</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
