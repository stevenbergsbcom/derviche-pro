'use client';

import { getCapacityDisplay } from '../helpers';
import type { CapacityDisplayProps } from '../types';

/**
 * Affichage de la capacité avec barre de progression
 * Mutualisé entre le tableau desktop et les cartes mobile
 */
export function CapacityDisplay({ booked, capacity, compact = false }: CapacityDisplayProps) {
  const { percentage, isUnlimited, remaining, colorClass } = getCapacityDisplay(booked, capacity);

  if (isUnlimited) {
    return <span className="font-medium">∞ Illimité</span>;
  }

  if (compact) {
    return (
      <span className="font-medium">
        {remaining}/{capacity} places
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{remaining}/{capacity}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Version mobile avec texte "places restantes"
 */
export function CapacityDisplayMobile({ booked, capacity }: CapacityDisplayProps) {
  const { percentage, isUnlimited, remaining, colorClass } = getCapacityDisplay(booked, capacity);

  if (isUnlimited) {
    return <span className="text-sm font-medium">∞ Illimité</span>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{remaining}/{capacity} places restantes</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
