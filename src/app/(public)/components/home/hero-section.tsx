/**
 * HeroSection — Section hero de la page d'accueil
 * Affiche le titre, description, CTAs et un slider d'images de spectacles.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { HomepageHero } from '@/lib/services/app-settings';
import type { Spectacle } from '@/components/spectacles';

interface HeroSectionProps {
  /** Paramètres hero depuis les settings admin */
  hero: HomepageHero;
  /** Spectacles avec image pour le slider */
  spectaclesWithImage: Spectacle[];
}

export function HeroSection({ hero, spectaclesWithImage }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slider automatique
  useEffect(() => {
    if (spectaclesWithImage.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % spectaclesWithImage.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [spectaclesWithImage.length]);

  return (
    <section className="py-12 md:py-24 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-4 md:mb-6 text-derviche-dark whitespace-pre-line">
          {hero.title}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-3 md:mb-4">
          {hero.description}
        </p>
        {hero.secondary_text && (
          <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
            {hero.secondary_text}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12">
          <Button size="lg" className="w-full sm:w-auto bg-derviche hover:bg-derviche-dark" asChild>
            <Link href={hero.cta_primary_url}>{hero.cta_primary_text}</Link>
          </Button>
          {hero.cta_secondary_text && hero.cta_secondary_url && (
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={hero.cta_secondary_url}>{hero.cta_secondary_text}</Link>
            </Button>
          )}
        </div>

        {/* Hero Slider — masqué en mobile (< md) */}
        {spectaclesWithImage.length > 0 && (
          <div className="hidden md:block max-w-4xl mx-auto">
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
  );
}
