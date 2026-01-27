/**
 * Contenu de carte spectacle (partagé entre grid et mobile)
 */

'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Eye, Copy, Check, Calendar } from 'lucide-react';
import { getStatusConfig } from '../constants';
import type { SpectacleCardContentProps } from '../types';

export function SpectacleCardContent({
  show,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
  onNavigateToRepresentations,
  copiedShowId,
  hasFullAccess,
  variant,
}: SpectacleCardContentProps) {
  const statusConfig = getStatusConfig(show.status);
  const isGrid = variant === 'grid';

  return (
    <Card
      className={`overflow-hidden p-0 gap-0 ${
        isGrid
          ? 'group hover:shadow-lg transition-shadow bg-white rounded-xl h-full flex flex-col'
          : ''
      }`}
    >
      {/* Image */}
      <div className={`overflow-hidden relative ${isGrid ? 'aspect-4/3' : 'aspect-video'}`}>
        {show.imageUrl ? (
          <Image
            src={show.imageUrl}
            alt={show.title}
            fill
            sizes={isGrid ? '(max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw' : '100vw'}
            className={`object-cover ${isGrid ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}
            unoptimized={show.imageUrl.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Pas d&apos;image</span>
          </div>
        )}
        {show.categories[0] && (
          <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
            {show.categories[0]}
          </span>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${statusConfig.bgClass} ${statusConfig.textClass}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Contenu */}
      <CardContent className={`${isGrid ? 'px-4 pb-4 pt-3 flex flex-col grow' : 'p-4'}`}>
        <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {show.period || 'Période non définie'}
        </p>
        <h3
          className={`font-bold text-lg mb-${isGrid ? '2' : '1'} ${isGrid ? 'line-clamp-2 min-h-12' : ''} text-derviche-dark leading-tight cursor-pointer hover:text-derviche hover:underline`}
          onClick={() => onView(show)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onView(show);
            }
          }}
        >
          {show.title}
        </h3>
        <p className={`text-sm font-semibold text-foreground mb-1 ${isGrid ? 'line-clamp-1' : ''}`}>
          {show.companyName}
        </p>
        <div className={isGrid ? 'mb-4' : 'mb-2'}>
          <Badge
            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
            onClick={() => onNavigateToRepresentations(show.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateToRepresentations(show.id);
              }
            }}
          >
            <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
            {show.representationsCount} représentation{show.representationsCount > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center gap-1 pt-3 border-t ${isGrid ? 'mt-auto' : 'mt-3'}`}
          role="group"
          aria-label={`Actions pour ${show.title}`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9"
            onClick={() => void onCopyLink(show)}
            aria-label={`Copier le lien de réservation pour ${show.title}`}
            title="Copier le lien"
          >
            {copiedShowId === show.id ? (
              <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {copiedShowId === show.id ? 'Lien copié' : 'Copier le lien'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9"
            onClick={() => onView(show)}
            aria-label={`Voir les détails de ${show.title}`}
            title="Voir"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Voir</span>
          </Button>
          {hasFullAccess && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-9"
              onClick={() => onEdit(show)}
              aria-label={`Modifier ${show.title}`}
              title="Modifier"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Modifier</span>
            </Button>
          )}
          {hasFullAccess && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => void onDelete(show)}
              aria-label={`Supprimer ${show.title}`}
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Supprimer</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
