/**
 * SpectaclesSection — Section carousel de spectacles de la page d'accueil
 * Affiche un carousel de cartes spectacles avec navigation automatique et manuelle.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SpectacleCard } from '@/components/spectacles';
import type { Spectacle } from '@/components/spectacles';
import type { HomepageSpectacles } from '@/lib/services/app-settings';

interface SpectaclesSectionProps {
  /** Paramètres de la section spectacles depuis les settings admin */
  spectaclesSettings: HomepageSpectacles;
  /** Liste des spectacles à afficher */
  spectacles: Spectacle[];
}

/** Nombre de cartes visibles par breakpoint */
const CARDS_VISIBLE = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

export function SpectaclesSection({ spectaclesSettings, spectacles }: SpectaclesSectionProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(CARDS_VISIBLE.desktop);

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

  // Carousel automatique
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

  if (spectacles.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-sm text-gold font-medium mb-1 uppercase tracking-wider">
              {spectaclesSettings.label}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">
              {spectaclesSettings.title}
            </h2>
            {spectaclesSettings.subtitle && (
              <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-2">
                {spectaclesSettings.subtitle}
              </p>
            )}
          </div>
          <Button variant="outline" className="hidden sm:flex" asChild>
            <Link href="/catalogue">{spectaclesSettings.cta_text}</Link>
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
            <Link href="/catalogue">{spectaclesSettings.cta_text}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
