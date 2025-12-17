'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type Spectacle } from '@/components/spectacles';
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

// Données mock de 12 spectacles variés avec images locales
const spectaclesMock: Spectacle[] = [
  {
    id: 1,
    title: 'À MOI !',
    company: 'Cie A Kan la dériv\'',
    venue: 'Théâtre des Béliers',
    image: '/images/spectacles/a-moi.jpg',
    slug: 'a-moi',
    genre: 'Théâtre',
    nextDate: '15 jan. 2025',
    remainingSlots: 8,
    status: 'available',
  },
  {
    id: 2,
    title: 'ROSSIGNOL À LA LANGUE POURRIE',
    company: 'Cie Des Lumières et des Ombres',
    venue: 'Théâtre du Balcon',
    image: '/images/spectacles/rossignol-a-la-langue-pourrie.jpg',
    slug: 'rossignol-a-la-langue-pourrie',
    genre: 'Jeune public',
    nextDate: '',
    status: 'coming_soon',
  },
  {
    id: 3,
    title: 'MADAME BOVARY EN PLUS DRÔLE ET MOINS LONG',
    company: 'Cie Le Monde au Balcon',
    venue: 'Théâtre des Corps Saints',
    image: '/images/spectacles/madame-bovary.jpg',
    slug: 'madame-bovary-en-plus-drole-et-moins-long',
    genre: 'Théâtre',
    nextDate: '22 jan. 2025',
    remainingSlots: 5,
    status: 'available',
  },
  {
    id: 4,
    title: 'JEU',
    company: 'Cie A Kan la dériv\'',
    venue: 'Théâtre Artéphile',
    image: '/images/spectacles/jeu.jpg',
    slug: 'jeu',
    genre: 'Danse',
    nextDate: '25 jan. 2025',
    remainingSlots: 10,
    status: 'available',
  },
  {
    id: 5,
    title: 'LA MER',
    company: 'Cie Le Ver à Soie',
    venue: 'Théâtre Espace Alya',
    image: '/images/spectacles/la-mer.jpg',
    slug: 'la-mer',
    genre: 'Marionnettes',
    nextDate: '28 jan. 2025',
    remainingSlots: 1, // Dernières représentations
    status: 'available',
  },
  {
    id: 6,
    title: 'LES CARNETS D\'ALBERT CAMUS',
    company: 'Cie Les Nomades',
    venue: 'Théâtre des Béliers',
    image: '/images/spectacles/LES-CARNETS-DALBERT-CAMUS.jpg',
    slug: 'les-carnets-d-albert-camus',
    genre: 'Théâtre',
    nextDate: '5 fév. 2025',
    remainingSlots: 12,
    status: 'available',
  },
  {
    id: 7,
    title: 'LA HONTE',
    company: 'Cie Mouvement',
    venue: 'Théâtre du Balcon',
    image: '/images/spectacles/la-honte.jpg',
    slug: 'la-honte',
    genre: 'Danse',
    nextDate: '',
    status: 'coming_soon',
  },
  {
    id: 8,
    title: 'LE JARDIN DE DAHI',
    company: 'Cie Les Poupées',
    venue: 'Théâtre Artéphile',
    image: '/images/spectacles/le-jardin-de-dahi.jpg',
    slug: 'le-jardin-de-dahi',
    genre: 'Marionnettes',
    nextDate: '15 fév. 2025',
    remainingSlots: 8,
    status: 'available',
  },
  {
    id: 9,
    title: 'UN SAC DE BILLES',
    company: 'Cie Aérienne',
    venue: 'Théâtre Espace Alya',
    image: '/images/spectacles/un-sac-de-billes.jpg',
    slug: 'un-sac-de-billes',
    genre: 'Théâtre',
    nextDate: '20 fév. 2025',
    remainingSlots: 6,
    status: 'available',
  },
  {
    id: 10,
    title: 'LE POUVOIR DES FILLES',
    company: 'Cie Enfantine',
    venue: 'Théâtre des Corps Saints',
    image: '/images/spectacles/le-pouvoir-des-filles.jpg',
    slug: 'le-pouvoir-des-filles',
    genre: 'Jeune public',
    nextDate: '25 fév. 2025',
    remainingSlots: 15,
    status: 'available',
  },
  {
    id: 11,
    title: 'JUSTE IRENA',
    company: 'Cie Tradition',
    venue: 'Théâtre des Béliers',
    image: '/images/spectacles/juste-irena.jpg',
    slug: 'juste-irena',
    genre: 'Théâtre',
    nextDate: '2 mars 2025',
    remainingSlots: 1, // Dernières représentations
    status: 'available',
  },
  {
    id: 12,
    title: 'TOUTES LES CHOSES GÉNIALES',
    company: 'Cie Street',
    venue: 'Théâtre du Balcon',
    image: '/images/spectacles/toutes-les-choses-geniales-cat.jpg',
    slug: 'toutes-les-choses-geniales',
    genre: 'Théâtre',
    nextDate: '',
    status: 'coming_soon',
  },
];

// Options pour les filtres
const genres = ['Tous', 'Théâtre', 'Danse', 'Marionnettes', 'Jeune public', 'Cirque'];
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
const lieux = [
  'Tous',
  'Théâtre des Béliers',
  'Théâtre du Balcon',
  'Théâtre des Corps Saints',
  'Théâtre Artéphile',
  'Théâtre Espace Alya',
];

// Fonction pour extraire le mois d'une date
function getMonthFromDate(dateStr: string): string {
  const monthMap: Record<string, string> = {
    jan: 'Janvier',
    fév: 'Février',
    mars: 'Mars',
    avr: 'Avril',
    mai: 'Mai',
    juin: 'Juin',
    juil: 'Juillet',
    août: 'Août',
    sept: 'Septembre',
    oct: 'Octobre',
    nov: 'Novembre',
    déc: 'Décembre',
  };

  const monthKey = dateStr.split(' ')[1]?.toLowerCase();
  const month = monthMap[monthKey || ''] || '';

  // Log en développement si le format de date n'est pas reconnu
  if (!month && process.env.NODE_ENV === 'development') {
    console.warn(`Format de date non reconnu: "${dateStr}"`);
  }

  return month;
}

export default function CataloguePage() {
  const [genreFilter, setGenreFilter] = useState<string>('Tous');
  const [moisFilter, setMoisFilter] = useState<string>('Tous');
  const [lieuFilter, setLieuFilter] = useState<string>('Tous');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Détecter le scroll pour afficher le bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    return spectaclesMock.filter((spectacle) => {
      // Filtre par genre
      if (genreFilter !== 'Tous' && spectacle.genre !== genreFilter) {
        return false;
      }

      // Filtre par mois
      if (moisFilter !== 'Tous') {
        const spectacleMonth = getMonthFromDate(spectacle.nextDate);
        if (spectacleMonth !== moisFilter) {
          return false;
        }
      }

      // Filtre par lieu
      if (lieuFilter !== 'Tous' && spectacle.venue !== lieuFilter) {
        return false;
      }

      // Filtre "Seulement disponibles" (exclut les 'coming_soon')
      if (onlyAvailable && spectacle.status === 'coming_soon') {
        return false;
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
  }, [genreFilter, moisFilter, lieuFilter, onlyAvailable, searchQuery]);

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      {/* Section Hero */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-derviche-dark">
            PROGRAMMATION 2025
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
                      {mois.map((mois) => (
                        <SelectItem key={mois} value={mois}>
                          {mois}
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
                <SpectacleCard key={spectacle.id} spectacle={spectacle} variant="grid" />
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
