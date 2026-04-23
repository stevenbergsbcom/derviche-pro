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
import { useScrollToHash } from '@/hooks/useScrollToHash';
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
  // Scroll vers #contact (ou toute autre ancre) quand on arrive depuis une
  // autre page du site. Next.js ne gère pas cette navigation par ancre de
  // façon fiable quand la section est chargée en Suspense/async.
  useScrollToHash();

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

  // Transformer les PublicShow en Spectacle.
  //
  // Tri (cohérent avec le slider du hero et /admin/preferences?tab=classement) :
  //  1. par display_order asc (migration 111) — l'ordre explicite défini
  //     par l'admin PRIME toujours, quel que soit le statut
  //  2. par statut en tie-break (available → coming_soon) si les deux ont
  //     display_order NULL — fallback sensé quand l'admin n'a pas encore
  //     classé ces spectacles
  //  3. par titre en dernier tie-break
  const spectacles = useMemo(() => {
    const statusOrder: Record<SpectacleStatus, number> = {
      available: 0,
      coming_soon: 1,
      closed: 2,
    };
    return publicShows
      .map(transformShowToSpectacle)
      .filter((s) => s.status !== 'closed')
      .sort((a, b) => {
        const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const statusDiff =
          (statusOrder[a.status ?? 'closed'] ?? 2) -
          (statusOrder[b.status ?? 'closed'] ?? 2);
        if (statusDiff !== 0) return statusDiff;
        return a.title.localeCompare(b.title, 'fr');
      });
  }, [publicShows]);

  // Spectacles vedette pour le Hero Slider (migration 111).
  // Filtré sur isFeatured + présence d'une image (HeroSection ne sait rien
  // afficher sans image de background). Le tri est **strictement identique**
  // à celui du carousel/catalogue (display_order → status → title) pour
  // garantir un ordre déterministe cohérent entre les 3 zones quand deux
  // vedettes ont le même display_order. Si la liste est vide → HeroSection
  // masque son slider.
  const featuredSpectacles = useMemo(() => {
    const statusOrder: Record<SpectacleStatus, number> = {
      available: 0,
      coming_soon: 1,
      closed: 2,
    };
    return spectacles
      .filter((s) => s.isFeatured && s.image && !s.image.includes('placeholder'))
      .sort((a, b) => {
        const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const statusDiff =
          (statusOrder[a.status ?? 'closed'] ?? 2) -
          (statusOrder[b.status ?? 'closed'] ?? 2);
        if (statusDiff !== 0) return statusDiff;
        return a.title.localeCompare(b.title, 'fr');
      });
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

      {/* HeroSection : toujours affichée (titre / description / CTAs).
          Seul le slider d'images interne est masqué si aucun spectacle
          « en vedette » sélectionné (cf. /admin/preferences?tab=classement).
          Le masquage du slider est géré à l'intérieur de HeroSection. */}
      <HeroSection hero={homepage_hero} spectaclesWithImage={featuredSpectacles} />

      {/* Spectacles (bg-muted) avant Avantages (bg-white) pour alterner proprement
          avec Impact (bg-muted) et Contact (bg-white) qui suivent. */}
      <SpectaclesSection
        spectaclesSettings={homepage_spectacles}
        spectacles={spectacles}
      />

      <AvantagesSection avantages={homepage_avantages} />

      <ImpactSection impact={homepage_impact} />

      <ContactSection contact={homepage_contact} organization={organization} />

      {/* Footer avec settings */}
      <Footer settings={homepage_footer} organization={organization} />

      <ScrollTopButton />
    </div>
  );
}
