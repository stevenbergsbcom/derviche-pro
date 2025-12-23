'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type Spectacle, type SpectacleStatus } from '@/components/spectacles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUp } from 'lucide-react';
import {
  mockShows,
  mockRepresentations,
  mockVenues,
  type MockShow,
  type MockRepresentation,
} from '@/lib/mock-data';

// ============================================
// HELPERS
// ============================================

/**
 * Formater une date ISO en format français lisible
 */
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDate();
  const months = [
    'jan.',
    'fév.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Extraire le mois d'une date au format "15 jan. 2025"
 */
function getMonthFromDateFr(dateStr: string): string {
  const monthMap: Record<string, string> = {
    'jan.': 'Janvier',
    'fév.': 'Février',
    'mars': 'Mars',
    'avr.': 'Avril',
    'mai': 'Mai',
    'juin': 'Juin',
    'juil.': 'Juillet',
    'août': 'Août',
    'sept.': 'Septembre',
    'oct.': 'Octobre',
    'nov.': 'Novembre',
    'déc.': 'Décembre',
  };

  const parts = dateStr.split(' ');
  const monthKey = parts[1];
  return monthMap[monthKey] || '';
}

/**
 * Transformer les données MockShow en Spectacle pour le composant SpectacleCard
 */
function transformShowToSpectacle(show: MockShow, representations: MockRepresentation[]): Spectacle {
  // Filtrer les représentations de ce spectacle
  const showReps = representations.filter((rep) => rep.showId === show.id);

  // Trier par date croissante
  const sortedReps = [...showReps].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Trouver la prochaine représentation (date >= aujourd'hui)
  // Utiliser une comparaison de chaînes ISO pour éviter les problèmes de timezone
  const todayISO = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  const futureReps = sortedReps.filter((rep) => {
    return rep.date >= todayISO; // Comparaison de chaînes ISO
  });

  const nextRep = futureReps[0];

  // Calculer le nombre de créneaux avec places disponibles
  const availableSlots = futureReps.filter((rep) => {
    if (rep.capacity === null) return true; // Illimité = toujours disponible
    return rep.booked < rep.capacity;
  }).length;

  // Déterminer le statut
  let status: SpectacleStatus = 'available';
  if (show.status === 'draft') {
    status = 'coming_soon';
  } else if (show.status === 'archived' || (futureReps.length === 0 && showReps.length > 0)) {
    status = 'closed';
  } else if (availableSlots === 0 && futureReps.length > 0) {
    status = 'closed';
  }

  // Trouver le lieu de la prochaine représentation
  // Pour coming_soon : on n'affiche pas de lieu spécifique
  let venue = 'Lieu à définir';
  if (status !== 'coming_soon') {
    venue = nextRep
      ? mockVenues.find((v) => v.id === nextRep.venueId)?.name || nextRep.venueName
      : sortedReps[0]
        ? mockVenues.find((v) => v.id === sortedReps[0].venueId)?.name || sortedReps[0].venueName
        : 'Lieu à définir';
  }

  // Pour coming_soon : pas de nextDate (le composant affichera "Dates à venir")
  // Pour closed : pas de nextDate non plus
  let nextDate = '';
  if (status === 'available' && nextRep) {
    nextDate = formatDateFr(nextRep.date);
  }

  return {
    id: parseInt(show.id.replace('show-', '')) || 0,
    title: show.title,
    company: show.companyName,
    venue: venue,
    image: show.imageUrl || '/images/spectacles/placeholder.jpg',
    slug: show.slug,
    genre: show.categories[0] || 'Spectacle',
    nextDate: nextDate,
    remainingSlots: availableSlots,
    status: status,
  };
}

// ============================================
// COMPOSANT PAGE
// ============================================

export default function CataloguePage() {
  // État pour éviter les erreurs d'hydratation SSR/Client
  const [isMounted, setIsMounted] = useState(false);

  const [genreFilter, setGenreFilter] = useState<string>('Tous');
  const [moisFilter, setMoisFilter] = useState<string>('Tous');
  const [lieuFilter, setLieuFilter] = useState<string>('Tous');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Fix d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Détecter le scroll pour afficher le bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Transformer les MockShow en Spectacle
  const spectacles = useMemo(() => {
    return mockShows.map((show) => transformShowToSpectacle(show, mockRepresentations));
  }, []);

  // Options pour les filtres - basées sur les données réelles
  const genres = useMemo(() => {
    const uniqueGenres = new Set<string>();
    mockShows.forEach((show) => {
      show.categories.forEach((cat) => uniqueGenres.add(cat));
    });
    return ['Tous', ...Array.from(uniqueGenres).sort()];
  }, []);

  const lieux = useMemo(() => {
    const uniqueVenues = new Set<string>();
    mockRepresentations.forEach((rep) => {
      uniqueVenues.add(rep.venueName);
    });
    return ['Tous', ...Array.from(uniqueVenues).sort()];
  }, []);

  const mois = [
    'Tous',
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setGenreFilter('Tous');
    setMoisFilter('Tous');
    setLieuFilter('Tous');
    setOnlyAvailable(false);
    setSearchQuery('');
  };

  // Filtrer les spectacles selon les critères actifs
  const filteredSpectacles = useMemo(() => {
    return spectacles.filter((spectacle) => {
      // Filtre par genre
      if (genreFilter !== 'Tous' && spectacle.genre !== genreFilter) {
        return false;
      }

      // Filtre par mois
      if (moisFilter !== 'Tous') {
        const spectacleMonth = getMonthFromDateFr(spectacle.nextDate);
        if (spectacleMonth !== moisFilter) {
          return false;
        }
      }

      // Filtre par lieu
      if (lieuFilter !== 'Tous' && spectacle.venue !== lieuFilter) {
        return false;
      }

      // Filtre "Seulement disponibles" (exclut les 'coming_soon' et les spectacles sans créneaux)
      if (onlyAvailable) {
        if (spectacle.status === 'coming_soon') return false;
        if (spectacle.status === 'closed') return false;
        if (spectacle.remainingSlots !== undefined && spectacle.remainingSlots === 0) return false;
      }

      // Filtre par recherche (title et company, insensible à la casse)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = spectacle.title.toLowerCase().includes(query);
        const matchesCompany = spectacle.company.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany) {
          return false;
        }
      }

      return true;
    });
  }, [spectacles, genreFilter, moisFilter, lieuFilter, onlyAvailable, searchQuery]);

  // Attendre que le composant soit monté pour éviter les erreurs d'hydratation
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* Section Hero */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-derviche-dark">
            Nos spectacles disponibles
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {filteredSpectacles.length} spectacle{filteredSpectacles.length > 1 ? 's' : ''} à découvrir
          </p>
        </div>
      </section>

      {/* Barre de filtres */}
      <section className="py-6 md:py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Select Genre */}
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={genreFilter} onValueChange={setGenreFilter}>
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Mois */}
                <div className="space-y-2">
                  <Label htmlFor="mois">Mois</Label>
                  <Select value={moisFilter} onValueChange={setMoisFilter}>
                    <SelectTrigger id="mois">
                      <SelectValue placeholder="Mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {mois.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Lieu */}
                <div className="space-y-2">
                  <Label htmlFor="lieu">Lieu</Label>
                  <Select value={lieuFilter} onValueChange={setLieuFilter}>
                    <SelectTrigger id="lieu">
                      <SelectValue placeholder="Lieu" />
                    </SelectTrigger>
                    <SelectContent>
                      {lieux.map((lieu) => (
                        <SelectItem key={lieu} value={lieu}>
                          {lieu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox Seulement disponibles */}
                <div className="flex items-end space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={onlyAvailable}
                      onCheckedChange={(checked) => setOnlyAvailable(checked === true)}
                    />
                    <Label
                      htmlFor="available"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Seulement disponibles
                    </Label>
                  </div>
                </div>

                {/* Input Recherche */}
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Rechercher un spectacle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton Réinitialiser */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="text-sm"
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Grille de spectacles */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          {filteredSpectacles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Aucun spectacle ne correspond à vos critères de recherche.
              </p>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSpectacles.map((spectacle) => (
                <SpectacleCard key={spectacle.id} spectacle={spectacle} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-derviche hover:bg-derviche-dark text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
