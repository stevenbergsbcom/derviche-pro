/**
 * ShowDetailSidebar — Colonne gauche (image, infos, description)
 * Derviche Diffusion - Page spectacle
 */

import Image from 'next/image';
import { SafeHtml } from '@/components/ui/safe-html';
import { Clock, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { PublicShow } from '@/lib/services/public-catalog';
import { isSafeUrl } from '@/lib/services/email/html-helpers';

import { ImagePlaceholder } from './image-placeholder';
import { TeaserButtonWithDialog } from './teaser-dialog';

// ============================================
// PROPS
// ============================================

interface ShowDetailSidebarProps {
  show: PublicShow;
  hasImage: boolean;
  onImageError: () => void;
  duration: string;
  description: string;
  showFullDescription: boolean;
  onToggleDescription: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ShowDetailSidebar({
  show,
  hasImage,
  onImageError,
  duration,
  description,
  showFullDescription,
  onToggleDescription,
}: ShowDetailSidebarProps) {
  return (
    <div className="lg:border-r border-border">
      {/* Bandeau image du spectacle */}
      <div className="relative w-full aspect-video">
        {hasImage ? (
          <Image
            src={show.imageUrl!}
            alt={show.title}
            fill
            className="object-cover"
            priority
            onError={onImageError}
          />
        ) : (
          <ImagePlaceholder title={show.title} />
        )}

        {/* Badges catégories — haut gauche (style catalogue : bg-gold) */}
        {show.categories.length > 0 && (
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
            {show.categories.map((cat) => (
              <span
                key={cat}
                className="bg-gold text-white text-xs font-semibold px-2 py-1 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Badges publics cible — haut droite */}
        {show.targetAudiences.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 justify-end">
            {show.targetAudiences.map((aud) => (
              <span
                key={aud}
                className="bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded"
              >
                {aud}
              </span>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div
          className={`absolute bottom-4 left-4 right-4 ${
            show.teaserUrl ? 'pr-36 sm:pr-44' : ''
          }`}
        >
          <p className="text-white/80 text-sm mb-1">{show.companyName}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{show.title}</h1>
        </div>

        {/* Bouton teaser vidéo — overlay bas-droite (réserve d'espace via pr-* sur le titre) */}
        {show.teaserUrl && (
          <div className="absolute bottom-4 right-4 z-20">
            <TeaserButtonWithDialog
              teaserUrl={show.teaserUrl}
              showTitle={show.title}
            />
          </div>
        )}
      </div>

      {/* Infos sous l'image */}
      <div className="p-6 md:p-8 space-y-4">
        {/* Duree */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{duration}</span>
        </div>

        {/* Lieu(x) */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-derviche mt-0.5 shrink-0" />
          <div>
            {show.venues.length === 0 ? (
              <p className="font-semibold text-sm text-derviche-dark">Lieu à définir</p>
            ) : show.venues.length === 1 ? (
              <>
                <p className="font-semibold text-sm text-derviche-dark">{show.venues[0].name}</p>
                <p className="text-sm text-muted-foreground">{show.venues[0].city}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-derviche-dark mb-1">
                  {show.venues.length} lieux
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {show.venues.map((venue) => (
                    <li key={venue.id}>
                      • {venue.name}, {venue.city}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Compagnie */}
        <div>
          <p className="text-sm font-medium text-derviche">Compagnie</p>
          <p className="text-sm text-foreground">{show.companyName}</p>
        </div>

        {/* Période */}
        {show.period && (
          <div>
            <p className="text-sm font-medium text-derviche">Période</p>
            <p className="text-sm text-foreground">{show.period}</p>
          </div>
        )}

        {/* Dates de relâche */}
        {show.closureDates && (
          <div>
            <p className="text-sm font-medium text-derviche">Relâche</p>
            <p className="text-sm text-foreground">{show.closureDates}</p>
          </div>
        )}

        {/* Description avec "Lire la suite" */}
        <div className="pt-4 border-t border-border">
          <SafeHtml
            html={description}
            className={`text-sm text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3 [&_p]:m-0' : ''}`}
            disableProse={!showFullDescription}
          />
          <button
            onClick={onToggleDescription}
            className="flex items-center gap-1 text-sm font-medium text-derviche hover:text-derviche-dark mt-2 transition-colors cursor-pointer"
          >
            {showFullDescription ? (
              <>
                Voir moins
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Lire la suite
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* CTA page dervichediffusion.com */}
        {isSafeUrl(show.dervisheSiteUrl) && (
          <div className="pt-2">
            <a
              href={show.dervisheSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-derviche text-white hover:bg-derviche-dark px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-derviche"
              aria-label={`Découvrir le spectacle ${show.title} sur dervichediffusion.com (nouvel onglet)`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Découvrir le spectacle
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
