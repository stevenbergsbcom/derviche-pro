/**
 * Liste des spectacles avec sections
 * Derviche Diffusion - PWA Check-in
 * 
 * Gère l'affichage des spectacles :
 * - Mode "upcoming" : sections "Aujourd'hui" et "Prochainement"
 * - Mode "past" : liste simple
 */

import { Calendar } from 'lucide-react';
import { ShowCard } from './ShowCard';
import type { ShowsListProps, EmptyTabMessageProps } from '../types';

/**
 * Liste des spectacles organisée en sections
 */
export function ShowsList({
  shows,
  displayMode,
  onShowClick,
  todayShows = [],
  laterShows = [],
}: ShowsListProps) {
  // Mode "upcoming" : affichage par sections
  if (displayMode === 'upcoming') {
    return (
      <div className="space-y-6" role="region" aria-label="Liste des spectacles à venir">
        {/* Section Aujourd'hui */}
        {todayShows.length > 0 && (
          <section aria-labelledby="today-heading">
            <h3
              id="today-heading"
              className="text-base font-semibold text-gold uppercase tracking-wide mb-3 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Aujourd&apos;hui
            </h3>
            <div className="space-y-3" role="list" aria-label="Spectacles d'aujourd'hui">
              {todayShows.map((show) => (
                <div key={show.id} role="listitem">
                  <ShowCard
                    show={show}
                    displayMode="upcoming"
                    onClick={() => onShowClick(show.slug)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Prochainement */}
        {laterShows.length > 0 && (
          <section aria-labelledby="upcoming-heading">
            <h3
              id="upcoming-heading"
              className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3"
            >
              Prochainement
            </h3>
            <div className="space-y-3" role="list" aria-label="Spectacles à venir">
              {laterShows.map((show) => (
                <div key={show.id} role="listitem">
                  <ShowCard
                    show={show}
                    displayMode="upcoming"
                    onClick={() => onShowClick(show.slug)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Mode "past" : liste simple
  return (
    <section role="region" aria-label="Liste des spectacles passés">
      <div className="space-y-3" role="list">
        {shows.map((show) => (
          <div key={show.id} role="listitem">
            <ShowCard
              show={show}
              displayMode="past"
              onClick={() => onShowClick(show.slug)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Message affiché quand l'onglet actif est vide
 * mais qu'il y a des spectacles dans l'autre onglet
 */
export function EmptyTabMessage({ displayMode }: EmptyTabMessageProps) {
  const message =
    displayMode === 'upcoming'
      ? 'Aucun spectacle avec des représentations à venir'
      : 'Aucun spectacle passé';

  return (
    <div className="text-center py-8 text-muted-foreground" role="status">
      {message}
    </div>
  );
}
