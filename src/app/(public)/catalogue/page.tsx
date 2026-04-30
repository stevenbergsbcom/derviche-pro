'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type SpectacleStatus } from '@/components/spectacles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2, AlertTriangle } from 'lucide-react';
import { searchMatch } from '@/lib/utils';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import { transformShowToSpectacle } from '@/lib/utils/shows';
import { CatalogueFiltersForm } from './components/CatalogueFiltersForm';
import { CatalogueMobileFilters } from './components/CatalogueMobileFilters';

// ============================================
// HELPERS
// ============================================

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

// ============================================
// COMPOSANT PAGE
// ============================================

export default function CataloguePage() {
  // État pour éviter les erreurs d'hydratation SSR/Client
  const [isMounted, setIsMounted] = useState(false);

  const [genreFilter, setGenreFilter] = useState<string>('Tous');
  const [audienceFilter, setAudienceFilter] = useState<string>('Tous');
  const [moisFilter, setMoisFilter] = useState<string>('Tous');
  const [lieuFilter, setLieuFilter] = useState<string>('Tous');
  const [villeFilter, setVilleFilter] = useState<string>('Toutes');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Hook Supabase pour les données
  const { shows: publicShows, venues, isLoading, error, refresh } = usePublicCatalog();

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

  // Transformer les PublicShow en Spectacle
  const spectacles = useMemo(() => {
    return publicShows.map(transformShowToSpectacle);
  }, [publicShows]);

  // Options pour les filtres - basées sur les données réelles
  const genres = useMemo(() => {
    const uniqueGenres = new Set<string>();
    publicShows.forEach((show) => {
      show.categories.forEach((cat) => uniqueGenres.add(cat));
    });
    return ['Tous', ...Array.from(uniqueGenres).sort()];
  }, [publicShows]);

  // Liste dédupliquée des publics cibles présents sur les shows publiés.
  // Tri alphabétique français pour stabilité visuelle.
  const audiences = useMemo(() => {
    const unique = new Set<string>();
    publicShows.forEach((show) => {
      show.targetAudiences.forEach((a) => unique.add(a));
    });
    return ['Tous', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [publicShows]);

  const lieux = useMemo(() => {
    // Utiliser les lieux récupérés du hook (lieux avec représentations futures)
    return ['Tous', ...venues.map((v) => (v.city ? `${v.name} - ${v.city}` : v.name)).sort()];
  }, [venues]);

  // Villes distinctes tirées des lieux chargés par le hook.
  // Évite d'introduire une 3ᵉ source de données : même périmètre que la liste
  // des lieux (représentations futures uniquement).
  const villes = useMemo(() => {
    const uniqueCities = new Set<string>();
    venues.forEach((v) => {
      if (v.city) uniqueCities.add(v.city);
    });
    return ['Toutes', ...Array.from(uniqueCities).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [venues]);

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
    setAudienceFilter('Tous');
    setMoisFilter('Tous');
    setLieuFilter('Tous');
    setVilleFilter('Toutes');
    setOnlyAvailable(false);
    setSearchQuery('');
  };

  // Filtrer et trier les spectacles selon les critères actifs
  const filteredSpectacles = useMemo(() => {
    const statusOrder: Record<SpectacleStatus, number> = {
      available: 0,
      coming_soon: 1,
      closed: 2,
    };

    return spectacles
      .filter((spectacle) => {
        // Filtre par genre
        if (genreFilter !== 'Tous' && !spectacle.genres.includes(genreFilter)) {
          return false;
        }

        // Filtre par public cible
        if (
          audienceFilter !== 'Tous' &&
          !(spectacle.targetAudiences ?? []).includes(audienceFilter)
        ) {
          return false;
        }

        // Filtre par mois
        if (moisFilter !== 'Tous') {
          const spectacleMonth = getMonthFromDateFr(spectacle.nextDate);
          if (spectacleMonth !== moisFilter) {
            return false;
          }
        }

        // Filtre par lieu (vérifie si le lieu est dans la liste des lieux du spectacle)
        if (lieuFilter !== 'Tous' && !spectacle.venues.includes(lieuFilter)) {
          return false;
        }

        // Filtre par ville (vérifie si la ville fait partie des villes distinctes du spectacle)
        if (
          villeFilter !== 'Toutes' &&
          !(spectacle.cities ?? []).includes(villeFilter)
        ) {
          return false;
        }

        // Filtre "En tournée uniquement" (exclut les 'coming_soon' et les spectacles sans créneaux)
        if (onlyAvailable) {
          if (spectacle.status === 'coming_soon') return false;
          if (spectacle.status === 'closed') return false;
          if (spectacle.remainingSlots !== undefined && spectacle.remainingSlots === 0)
            return false;
        }

        // Filtre par recherche (title et company, insensible aux accents et à la casse)
        if (searchQuery.trim() !== '') {
          const query = searchQuery.trim();
          const matchesTitle = searchMatch(spectacle.title, query);
          const matchesCompany = searchMatch(spectacle.company, query);
          if (!matchesTitle && !matchesCompany) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Tri (cohérent avec le slider du hero et /admin/preferences?tab=classement) :
        //   1. display_order asc (l'ordre admin PRIME toujours, quel que soit le statut)
        //   2. statut en tie-break (available → coming_soon → closed) si les deux ont display_order NULL
        //   3. titre en dernier tie-break
        const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const statusDiff =
          (statusOrder[a.status ?? 'closed'] ?? 2) -
          (statusOrder[b.status ?? 'closed'] ?? 2);
        if (statusDiff !== 0) return statusDiff;
        return a.title.localeCompare(b.title, 'fr');
      });
  }, [
    spectacles,
    genreFilter,
    audienceFilter,
    moisFilter,
    lieuFilter,
    villeFilter,
    onlyAvailable,
    searchQuery,
  ]);

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

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-muted/30">
          <div className="container mx-auto px-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des spectacles...</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-12 md:py-16 bg-gradient-to-b from-white to-muted/30">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">Erreur : {error}</p>
            <Button onClick={() => void refresh()} variant="outline">
              Réessayer
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* Section Hero — padding bottom resserré sur mobile pour rapprocher
          la zone de filtres du bandeau titre. */}
      <section className="pt-12 pb-6 md:py-16 bg-gradient-to-b from-white to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-derviche-dark">
            Nos spectacles en tournée
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {filteredSpectacles.length} spectacle{filteredSpectacles.length > 1 ? 's' : ''} à découvrir
          </p>
        </div>
      </section>

      {/* Barre de filtres — padding mobile resserré (juste un bouton)
          vs desktop (Card avec 6 filtres inline). */}
      <section className="py-3 md:py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          {/* Mobile (< md) : bouton Filtres → Sheet, barre compacte */}
          <CatalogueMobileFilters
            value={{
              genre: genreFilter,
              audience: audienceFilter,
              mois: moisFilter,
              lieu: lieuFilter,
              ville: villeFilter,
              onlyAvailable,
              searchQuery,
            }}
            options={{ genres, audiences, mois, lieux, villes }}
            resultsCount={filteredSpectacles.length}
            onGenreChange={setGenreFilter}
            onAudienceChange={setAudienceFilter}
            onMoisChange={setMoisFilter}
            onLieuChange={setLieuFilter}
            onVilleChange={setVilleFilter}
            onAvailableChange={setOnlyAvailable}
            onSearchChange={setSearchQuery}
            onReset={resetFilters}
          />

          {/* Desktop (≥ md) : filtres inline dans une Card */}
          <Card className="hidden md:block">
            <CardContent className="px-4 md:px-6">
              <CatalogueFiltersForm
                layout="grid"
                value={{
                  genre: genreFilter,
                  audience: audienceFilter,
                  mois: moisFilter,
                  lieu: lieuFilter,
                  ville: villeFilter,
                  onlyAvailable,
                  searchQuery,
                }}
                options={{ genres, audiences, mois, lieux, villes }}
                onGenreChange={setGenreFilter}
                onAudienceChange={setAudienceFilter}
                onMoisChange={setMoisFilter}
                onLieuChange={setLieuFilter}
                onVilleChange={setVilleFilter}
                onAvailableChange={setOnlyAvailable}
                onSearchChange={setSearchQuery}
              />

              {/* Bouton Réinitialiser */}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={resetFilters} className="text-sm">
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Grille de spectacles — padding top resserré sur mobile pour
          rapprocher les cards du bouton Filtres. */}
      <section className="pt-4 pb-8 md:py-12 bg-muted/30">
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
                <SpectacleCard key={spectacle.slug} spectacle={spectacle} />
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
