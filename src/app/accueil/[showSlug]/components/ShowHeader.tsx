/**
 * ShowHeader - En-tête du spectacle avec image, titre et compteur
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Theater } from 'lucide-react';
import type { ShowHeaderProps } from '../types';

export function ShowHeader({
  title,
  imageUrl,
  slotsCount,
  isLoading,
  activeTab,
  showFullHistory,
  pastDaysLimit,
}: ShowHeaderProps) {
  // État pour gérer l'erreur de chargement d'image
  const [imageLoadError, setImageLoadError] = useState(false);

  // Reset l'erreur quand l'image change (changement de spectacle)
  useEffect(() => {
    setImageLoadError(false);
  }, [imageUrl]);

  // Construire le label du compteur
  const buildLabel = (): string => {
    const plural = slotsCount > 1;
    
    if (activeTab === 'upcoming') {
      return `${slotsCount} représentation${plural ? 's' : ''} à venir`;
    }
    
    const suffix = showFullHistory 
      ? '(historique complet)' 
      : `(${pastDaysLimit} derniers jours)`;
    
    return `${slotsCount} représentation${plural ? 's' : ''} passée${plural ? 's' : ''} ${suffix}`;
  };

  // Détermine si on doit afficher le placeholder
  const showPlaceholder = !imageUrl || imageLoadError;

  return (
    <header className="bg-white border-b">
      {/* Image du spectacle */}
      <div className="relative w-full h-40 bg-muted">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : showPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-derviche/10 to-derviche/30">
            <Theater 
              className="w-16 h-16 text-derviche/40" 
              aria-hidden="true" 
            />
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={`Photo du spectacle ${title}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            onError={() => setImageLoadError(true)}
          />
        )}
        {/* Overlay gradient pour lisibilité du titre */}
        {!isLoading && !showPlaceholder && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
      </div>

      {/* Titre et compteur */}
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-derviche-dark line-clamp-2">
              {title}
            </h1>
            <p 
              className="text-base text-muted-foreground mt-0.5"
              aria-live="polite"
            >
              {buildLabel()}
            </p>
          </>
        )}
      </div>
    </header>
  );
}
