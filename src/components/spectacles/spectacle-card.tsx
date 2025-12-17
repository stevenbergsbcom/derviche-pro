import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';

export interface Spectacle {
  id: number;
  title: string;
  company: string;
  venue: string;
  image: string;
  slug: string;
  genre: string;
  nextDate: string;
  remainingPlaces?: number;
}

interface SpectacleCardProps {
  spectacle: Spectacle;
  /** Mode d'affichage: 'carousel' pour le carousel de l'accueil, 'grid' pour la grille du catalogue */
  variant?: 'carousel' | 'grid';
}

export function SpectacleCard({ spectacle, variant = 'grid' }: SpectacleCardProps) {
  // Note: variant est accepté pour compatibilité mais n'affecte pas le rendu actuellement
  const isComplet = spectacle.remainingPlaces === 0;

  return (
    <Link
      href={`/spectacle/${spectacle.slug}`}
      className="block h-full"
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow bg-white rounded-xl p-0 gap-0 cursor-pointer h-full flex flex-col">
        {/* Image avec badge genre */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <Image
            src={spectacle.image}
            alt={spectacle.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badge genre */}
          <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
            {spectacle.genre}
          </span>
          {/* Badge complet si nécessaire */}
          {isComplet && (
            <span className="absolute top-2 right-2 bg-error text-white text-xs font-semibold px-2 py-1 rounded">
              Complet
            </span>
          )}
        </div>

        {/* Contenu de la card */}
        <CardContent className="px-4 pb-4 pt-3 md:px-5 md:pb-5 md:pt-4 flex flex-col flex-grow">
          {/* Date prochaine représentation */}
          <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Prochaine date : {spectacle.nextDate}
          </p>

          {/* Titre - 2 lignes max */}
          <h3 className="font-bold text-lg md:text-xl mb-2 line-clamp-2 min-h-[3rem] md:min-h-[3.5rem] text-derviche-dark leading-tight">
            {spectacle.title}
          </h3>

          {/* Compagnie - En gras */}
          <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
            {spectacle.company}
          </p>

          {/* Lieu - En italique avec icône */}
          <p className="text-sm text-muted-foreground italic mb-4 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {spectacle.venue}
          </p>

          {/* Places restantes si défini */}
          {spectacle.remainingPlaces !== undefined && !isComplet && (
            <p className="text-xs text-muted-foreground mb-2">
              {spectacle.remainingPlaces} place{spectacle.remainingPlaces > 1 ? 's' : ''} restante{spectacle.remainingPlaces > 1 ? 's' : ''}
            </p>
          )}

          {/* Bouton - pousse vers le bas avec mt-auto */}
          <div className="mt-auto">
            <Button
              className={`w-full font-medium ${isComplet
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-derviche-dark hover:bg-derviche text-white'
                }`}
              disabled={isComplet}
            >
              {isComplet ? 'Complet' : 'Réserver ma place'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
