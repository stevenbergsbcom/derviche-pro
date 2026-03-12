/**
 * HomePageClient — Composant client de la page d'accueil
 * Derviche Diffusion
 *
 * Reçoit les settings homepage + organisation en props depuis le Server Component.
 * Tout le contenu textuel est dynamique (éditable via /admin/preferences?tab=homepage).
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type Spectacle, type SpectacleStatus } from '@/components/spectacles';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  ArrowUp,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import type { PublicShow } from '@/lib/services/public-catalog';
import type { HomepageSettings, OrganizationSettings } from '@/lib/services/app-settings';
import { getIcon } from './icon-map';

// ============================================
// TYPES
// ============================================

interface HomePageClientProps {
  settings: HomepageSettings;
  organization: OrganizationSettings;
}

// ============================================
// HELPERS
// ============================================

function transformShowToSpectacle(show: PublicShow): Spectacle {
  let status: SpectacleStatus = 'available';

  if (show.status === 'draft') {
    status = 'coming_soon';
  } else if (show.status === 'archived') {
    status = 'closed';
  } else if (show.availableSlotsCount === 0 && show.slots.length > 0) {
    status = 'closed';
  } else if (show.slots.length === 0) {
    status = 'coming_soon';
  }

  return {
    id: 0,
    title: show.title,
    company: show.companyName,
    venues: show.venues.map((v) => v.name),
    image: show.imageUrl || '/images/spectacles/placeholder.jpg',
    slug: show.slug,
    genre: show.categories[0] || 'Spectacle',
    nextDate: status === 'available' ? (show.nextDate || '') : '',
    remainingSlots: show.availableSlotsCount,
    status,
  };
}

// ============================================
// CONSTANTES
// ============================================

const CARDS_VISIBLE = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function HomePageClient({ settings, organization }: HomePageClientProps) {
  const { homepage_hero, homepage_avantages, homepage_spectacles, homepage_impact, homepage_contact, homepage_footer } = settings;

  // État pour éviter les erreurs d'hydratation
  const [isMounted, setIsMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(CARDS_VISIBLE.desktop);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Hook Supabase pour les données
  const { shows: publicShows, isLoading, error, refresh } = usePublicCatalog();

  // Transformer les PublicShow en Spectacle
  const spectacles = useMemo(() => {
    return publicShows
      .map(transformShowToSpectacle)
      .filter((s) => s.status !== 'closed');
  }, [publicShows]);

  // Spectacles avec image pour le Hero Slider
  const spectaclesWithImage = useMemo(() => {
    return spectacles.filter((s) => s.image && !s.image.includes('placeholder'));
  }, [spectacles]);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Détecter la taille d'écran pour le carousel
  useEffect(() => {
    const updateCardsVisible = () => {
      if (window.innerWidth < 640) {
        setCardsVisible(CARDS_VISIBLE.mobile);
      } else if (window.innerWidth < 1024) {
        setCardsVisible(CARDS_VISIBLE.tablet);
      } else {
        setCardsVisible(CARDS_VISIBLE.desktop);
      }
    };

    updateCardsVisible();
    window.addEventListener('resize', updateCardsVisible);
    return () => window.removeEventListener('resize', updateCardsVisible);
  }, []);

  // Slider automatique pour le Hero
  useEffect(() => {
    if (spectaclesWithImage.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % spectaclesWithImage.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [spectaclesWithImage.length]);

  // Carousel automatique pour les spectacles
  useEffect(() => {
    if (spectacles.length === 0) return;
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [cardsVisible, spectacles.length]);

  // Reset carousel index si nécessaire
  useEffect(() => {
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    if (carouselIndex > maxIndex) {
      setCarouselIndex(maxIndex);
    }
  }, [cardsVisible, carouselIndex, spectacles.length]);

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextCarousel = () => {
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
  };

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

      {/* Hero Section */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-white to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-4 md:mb-6 text-derviche-dark whitespace-pre-line">
            {homepage_hero.title}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-3 md:mb-4">
            {homepage_hero.description}
          </p>
          {homepage_hero.secondary_text && (
            <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
              {homepage_hero.secondary_text}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            <Button size="lg" className="w-full sm:w-auto bg-derviche hover:bg-derviche-dark" asChild>
              <Link href={homepage_hero.cta_primary_url}>{homepage_hero.cta_primary_text}</Link>
            </Button>
            {homepage_hero.cta_secondary_text && homepage_hero.cta_secondary_url && (
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={homepage_hero.cta_secondary_url}>{homepage_hero.cta_secondary_text}</Link>
              </Button>
            )}
          </div>

          {/* Hero Slider */}
          {spectaclesWithImage.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl relative">
                {spectaclesWithImage.map((spectacle, index) => (
                  <div
                    key={spectacle.slug}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <Image
                      src={spectacle.image}
                      alt={spectacle.title}
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                      <p className="text-white font-bold text-lg md:text-2xl">{spectacle.title}</p>
                      <p className="text-white/80 text-sm md:text-base">{spectacle.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Avantages Section */}
      <section id="avantages" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
              {homepage_avantages.label}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">
              {homepage_avantages.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {homepage_avantages.cards.map((card, index) => {
              const Icon = getIcon(card.icon);
              return (
                <div key={index} className="text-center p-4 md:p-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-derviche/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 md:w-8 md:h-8 text-derviche" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 md:mb-3 text-derviche-dark">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Spectacles Section */}
      {spectacles.length > 0 && (
        <section className="py-12 md:py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
              <div>
                <p className="text-sm text-gold font-medium mb-1 uppercase tracking-wider">
                  {homepage_spectacles.label}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">
                  {homepage_spectacles.title}
                </h2>
                {homepage_spectacles.subtitle && (
                  <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-2">
                    {homepage_spectacles.subtitle}
                  </p>
                )}
              </div>
              <Button variant="outline" className="hidden sm:flex" asChild>
                <Link href="/catalogue">{homepage_spectacles.cta_text}</Link>
              </Button>
            </div>

            {/* Carousel Spectacles */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(calc(-${carouselIndex} * (100% / ${cardsVisible} + ${cardsVisible > 1 ? '0.375rem' : '0rem'})))`,
                  gap: cardsVisible === 1 ? '0' : '1.5rem',
                }}
              >
                {spectacles.map((show) => (
                  <div
                    key={show.slug}
                    className="flex-shrink-0"
                    style={{
                      width: `calc(${100 / cardsVisible}% - ${cardsVisible > 1 ? '1.125rem' : '0rem'})`,
                    }}
                  >
                    <SpectacleCard spectacle={show} />
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Navigation */}
            <div className="flex items-center justify-between mt-6 md:mt-8">
              <div className="flex gap-1.5">
                {Array.from({ length: Math.max(1, spectacles.length - cardsVisible + 1) }).map(
                  (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i === carouselIndex
                          ? 'bg-derviche'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Aller à la page ${i + 1}`}
                    />
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handlePrevCarousel}
                  disabled={carouselIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleNextCarousel}
                  disabled={carouselIndex >= spectacles.length - cardsVisible}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="mt-6 text-center sm:hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/catalogue">{homepage_spectacles.cta_text}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Chiffres Section */}
      {homepage_impact.enabled && (
      <section className="py-12 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
            <div className="text-center md:text-left">
              <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
                {homepage_impact.label}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">
                {homepage_impact.title}
              </h2>
              {homepage_impact.description && (
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {homepage_impact.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {homepage_impact.stats.map((stat, index) => (
                <Card key={index} className="p-3 md:p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-2xl md:text-4xl font-bold text-derviche mb-1 md:mb-2">
                    {stat.number}
                  </p>
                  <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">
                    {stat.label}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
              {homepage_contact.label}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">
              {homepage_contact.title}
            </h2>
            {homepage_contact.description && (
              <p className="text-muted-foreground text-sm md:text-base mb-8 md:mb-12">
                {homepage_contact.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {organization.organization_contact_email && (
                <div className="flex flex-col items-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Email</h3>
                  <a
                    href={`mailto:${organization.organization_contact_email}`}
                    className="text-muted-foreground hover:text-derviche transition text-sm"
                  >
                    {organization.organization_contact_email}
                  </a>
                </div>
              )}

              {organization.organization_contact_phone && (
                <div className="flex flex-col items-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Téléphone</h3>
                  <a
                    href={`tel:${organization.organization_contact_phone.replace(/\s/g, '')}`}
                    className="text-muted-foreground hover:text-derviche transition text-sm"
                  >
                    {organization.organization_contact_phone}
                  </a>
                </div>
              )}

              {organization.organization_website && (
                <div className="flex flex-col items-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                    <Globe className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                  </div>
                  <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Site web</h3>
                  <a
                    href={organization.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-derviche transition text-sm"
                  >
                    {organization.organization_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer avec settings */}
      <Footer settings={homepage_footer} organization={organization} />

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
