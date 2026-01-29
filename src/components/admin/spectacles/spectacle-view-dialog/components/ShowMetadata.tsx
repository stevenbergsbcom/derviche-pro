/**
 * Métadonnées du spectacle (catégories, statut, slug)
 * Derviche Diffusion - Session 110
 */

'use client';

import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin';
import type { ShowMetadataProps } from '../types';

export function ShowMetadata({
  showId,
  slug,
  status,
  categoryNames,
  audienceNames,
  copiedShowId,
  onCopyLink,
}: ShowMetadataProps) {
  const isCopied = copiedShowId === showId;

  return (
    <>
      {/* Catégories et Statut en ligne */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {categoryNames.map((cat) => (
          <Badge key={cat} className="bg-gold/10 text-gold border-gold/20">
            {cat}
          </Badge>
        ))}
        <StatusBadge status={status} />
      </div>

      {/* Publics cibles */}
      {audienceNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Publics :</span>
          {audienceNames.map((name) => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}

      {/* Slug avec bouton copier */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs text-muted-foreground font-mono">
          /{slug}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onCopyLink}
          aria-label={isCopied ? 'Lien copié' : 'Copier le lien du spectacle'}
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3 mr-1 text-green-600" aria-hidden="true" />
              <span className="text-green-600">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" aria-hidden="true" />
              Copier le lien
            </>
          )}
        </Button>
      </div>
    </>
  );
}
