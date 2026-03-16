/**
 * HomePageClient — Composant client de la page d'accueil
 * Derviche Diffusion
 *
 * Reçoit les settings homepage + organisation en props depuis le Server Component.
 * Tout le contenu textuel est dynamique (éditable via /admin/preferences?tab=homepage).
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Header, Footer } from '@/components/layout';
import type { SpectacleStatus } from '@/components/spectacles';
import { Loader2, AlertTriangle } from 'lucide-react';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import type { HomepageSettings, OrganizationSettings } from '@/lib/services/app-settings';
import { transformShowToSpectacle } from '@/lib/utils/shows';
import {
  HeroSection,
  AvantagesSection,
  SpectaclesSection,
  ImpactSection,
  ContactSection,
  ScrollTopButton,
} from './home';

// ============================================
// TYPES
// ============================================

interface HomePageClientProps {
  settings: HomepageSettings;
  organization: OrganizationSettings;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function HomePageClient({ settings, organization }: HomePageClientProps) {
  const {
    homepage_hero,
    homepage_avantages,
    homepage_spectacles,
    homepage_impact,
    homepage_contact,
    homepage_footer,
  } = settings;

  // État pour éviter les erreurs d'hydratation
  const [isMounted, setIsMounted] = useState(false);

  // Hook Supabase pour les données
  const { shows: publicShows, isLoading, error, refresh } = usePublicCatalog();

  // Transformer les PublicShow en Spectacle (disponibles en premier, comme le catalogue)
  const spectacles = useMemo(() => {
    const statusOrder: Record<SpectacleStatus, number> = {
      available: 0,
      coming_soon: 1,
      closed: 2,
    };
    return publicShows
      .map(transformShowToSpectacle)
      .filter((s) => s.status !== 'closed')
      .sort(
        (a, b) =>
          (statusOrder[a.status ?? 'closed'] ?? 2) - (statusOrder[b.status ?? 'closed'] ?? 2)
      );
  }, [publicShows]);

  // Spectacles avec image pour le Hero Slider
  const spectaclesWithImage = useMemo(() => {
    return spectacles.filter((s) => s.image && !s.image.includes('placeholder'));
  }, [spectacles]);

  // Fix d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Attendre que le composant soit monté
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des spectacles...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Erreur : {error}</p>
          <Button onClick={() => void refresh()} variant="outline">
            Réessayer
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />

      <HeroSection hero={homepage_hero} spectaclesWithImage={spectaclesWithImage} />

      <AvantagesSection avantages={homepage_avantages} />

      <SpectaclesSection
        spectaclesSettings={homepage_spectacles}
        spectacles={spectacles}
      />

      <ImpactSection impact={homepage_impact} />

      <ContactSection contact={homepage_contact} organization={organization} />

      {/* Footer avec settings */}
      <Footer settings={homepage_footer} organization={organization} />

      <ScrollTopButton />
    </div>
  );
}
