'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Drama } from 'lucide-react';

export type SpectacleStatus = 'available' | 'coming_soon' | 'closed';

export interface Spectacle {
  id: number;
  title: string;
  company: string;
  venues: string[]; // Liste des noms de lieux
  image: string;
  slug: string;
  genre: string;
  nextDate: string;
  remainingSlots?: number; // Nombre de créneaux avec places disponibles
  status?: SpectacleStatus; // Statut du spectacle
}

interface SpectacleCardProps {
  spectacle: Spectacle;
}

/**
 * Composant placeholder pour les images manquantes
 */
function ImagePlaceholder({ title, genre }: { title: string; genre: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-derviche/20 to-derviche/40 flex flex-col items-center justify-center p-4">
      <Drama className="w-12 h-12 text-muted-foreground/50 mb-2" />
      <p className="text-derviche-dark/80 text-sm font-medium text-center line-clamp-2">
        {title}
      </p>
      {/* Badge genre intégré au placeholder */}
      <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
        {genre}
      </span>
    </div>
  );
}

export function SpectacleCard({ spectacle }: SpectacleCardProps) {
  // État pour gérer les erreurs de chargement d'image
  const [imageError, setImageError] = useState(false);
  
  const isComingSoon = spectacle.status === 'coming_soon';
  const isClosed = spectacle.status === 'closed';
  const isLastRepresentations = !isComingSoon && !isClosed && spectacle.remainingSlots !== undefined && spectacle.remainingSlots > 0 && spectacle.remainingSlots < 2;
  const isNotBookable = isComingSoon || isClosed;

  // Déterminer si on doit afficher le placeholder
  const showPlaceholder = imageError || !spectacle.image || spectacle.image.includes('placeholder');

  // Contenu de la card (réutilisé avec ou sans lien)
  const cardContent = (
    <Card className={`overflow-hidden group transition-shadow bg-white rounded-xl p-0 gap-0 h-full flex flex-col ${
      isNotBookable 
        ? 'opacity-75 cursor-default' 
        : 'hover:shadow-lg cursor-pointer'
    }`}>
      {/* Image avec badge genre */}
      <div className="aspect-[4/3] overflow-hidden relative">
        {showPlaceholder ? (
          <ImagePlaceholder title={spectacle.title} genre={spectacle.genre} />
        ) : (
          <>
            <Image
              src={spectacle.image}
              alt={spectacle.title}
              width={400}
              height={300}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isNotBookable ? '' : 'group-hover:scale-105'
              }`}
              onError={() => setImageError(true)}
            />
            {/* Badge genre */}
            <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
              {spectacle.genre}
            </span>
          </>
        )}
        {/* Badge Dernières représentations */}
        {isLastRepresentations && (
          <span className="absolute top-2 right-2 bg-error text-white text-xs font-semibold px-2 py-1 rounded">
            Dernières représentations
          </span>
        )}
        {/* Badge Coming Soon */}
        {isComingSoon && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Bientôt
          </span>
        )}
      </div>

      {/* Contenu de la card */}
      <CardContent className="px-4 pb-4 pt-3 md:px-5 md:pb-5 md:pt-4 flex flex-col grow">
        {/* Date prochaine représentation */}
        <p className={`text-xs font-medium mb-2 flex items-center gap-1 ${
          isNotBookable ? 'text-muted-foreground' : 'text-gold'
        }`}>
          <Calendar className="w-3 h-3" />
          {isComingSoon 
            ? 'Dates à venir' 
            : isClosed 
              ? 'Aucune date disponible'
              : `Prochaine date : ${spectacle.nextDate}`}
        </p>

        {/* Titre - 2 lignes max */}
        <h3 className="font-bold text-lg md:text-xl mb-2 line-clamp-2 min-h-12 md:min-h-14 text-derviche-dark leading-tight">
          {spectacle.title}
        </h3>

        {/* Compagnie - En gras */}
        <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
          {spectacle.company}
        </p>

        {/* Lieu(x) - En italique avec icône */}
        <p className="text-sm text-muted-foreground italic mb-4 line-clamp-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          {spectacle.venues.length === 0
            ? 'Lieu à définir'
            : spectacle.venues.length === 1
              ? spectacle.venues[0]
              : `${spectacle.venues.length} lieux`}
        </p>

        {/* Bouton - pousse vers le bas avec mt-auto */}
        <div className="mt-auto">
          <Button
            className={`w-full font-medium ${isNotBookable
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-derviche-dark hover:bg-derviche text-white'
              }`}
            disabled={isNotBookable}
          >
            {isComingSoon 
              ? 'Bientôt disponible' 
              : isClosed 
                ? 'Indisponible' 
                : 'Réserver ma place'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Si non réservable, pas de lien - juste la card
  if (isNotBookable) {
    return <div className="block h-full">{cardContent}</div>;
  }

  // Sinon, card cliquable avec lien
  return (
    <Link
      href={`/spectacle/${spectacle.slug}`}
      className="block h-full"
    >
      {cardContent}
    </Link>
  );
}
