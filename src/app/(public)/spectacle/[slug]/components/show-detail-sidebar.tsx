/**
 * ShowDetailSidebar — Colonne gauche (image, infos, description)
 * Derviche Diffusion - Page spectacle
 */

import Image from 'next/image';
import { SafeHtml } from '@/components/ui/safe-html';
import { Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { PublicShow } from '@/lib/services/public-catalog';

import { ImagePlaceholder } from './image-placeholder';

// ============================================
// PROPS
// ============================================

interface ShowDetailSidebarProps {
  show: PublicShow;
  hasImage: boolean;
  onImageError: () => void;
  duration: string;
  period: string;
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
  period,
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/80 text-sm mb-1">{show.companyName}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{show.title}</h1>
        </div>
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

        {/* Periode */}
        <div>
          <p className="text-sm font-medium text-derviche">Période</p>
          <p className="text-sm text-foreground">{period}</p>
        </div>

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
      </div>
    </div>
  );
}
