/**
 * SpectaclesSection — Section carousel de spectacles de la page d'accueil
 * Affiche un carousel de cartes spectacles avec navigation automatique et manuelle.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

/** Seuil (px) de déplacement avant de déclencher un changement de slide au drag. */
const DRAG_THRESHOLD = 50;
/** Seuil (px) au-delà duquel on considère que l'utilisateur a fait un drag (et non un clic). */
const CLICK_CANCEL_THRESHOLD = 8;

export function SpectaclesSection({ spectaclesSettings, spectacles }: SpectaclesSectionProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(CARDS_VISIBLE.desktop);

  // Drag / grab state
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

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

  // Carousel automatique (en pause pendant le drag)
  useEffect(() => {
    if (spectacles.length === 0) return;
    if (isDragging) return;
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [cardsVisible, spectacles.length, isDragging]);

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

  // ===========================================
  // Drag / grab handlers (pointer events)
  // ===========================================

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore les clics droits / middle / stylet secondaire
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerStartX.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    dragMovedRef.current = false;
    setDragOffset(0);
    // ⚠️ NE PAS appeler setPointerCapture ici.
    // Spec W3C : « when a pointer is captured, the click event will only be
    // dispatched to the capturing element (and any of its ancestors). »
    // Si on capturait dès le pointerdown, un simple clic sur une card
    // enverrait le `click` au carrousel parent au lieu du <Link> enfant —
    // la navigation Next.js ne se déclenche jamais (bouton « Réserver ma
    // place » non cliquable au clic gauche, mais OK en clic-droit > nouvel
    // onglet car le menu contextuel ne dépend pas de l'event bubbling).
    // → On capture seulement à partir du moment où le drag est confirmé,
    //   dans handlePointerMove (cf. CLICK_CANCEL_THRESHOLD).
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerStartX.current === null) return;
      const dx = e.clientX - pointerStartX.current;
      if (Math.abs(dx) > CLICK_CANCEL_THRESHOLD) {
        // Premier franchissement du seuil → on confirme le drag.
        if (!dragMovedRef.current) {
          dragMovedRef.current = true;
          setIsDragging(true);
          // Capture pour recevoir les pointermove/up même hors du track
          // pendant le drag réel — sans casser le click pour les non-drags.
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* no-op */
          }
        }
      }
      setDragOffset(dx);
    },
    [],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerStartX.current === null) return;
      const dx = e.clientX - pointerStartX.current;
      const maxIndex = Math.max(0, spectacles.length - cardsVisible);
      if (dx <= -DRAG_THRESHOLD) {
        setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
      } else if (dx >= DRAG_THRESHOLD) {
        setCarouselIndex((prev) => Math.max(0, prev - 1));
      }
      try {
        if (pointerIdRef.current !== null) {
          e.currentTarget.releasePointerCapture(pointerIdRef.current);
        }
      } catch {
        /* no-op */
      }
      pointerStartX.current = null;
      pointerIdRef.current = null;
      setIsDragging(false);
      setDragOffset(0);
    },
    [spectacles.length, cardsVisible],
  );

  // Empêche le clic sur carte d'ouvrir le lien si on a drag (>CLICK_CANCEL_THRESHOLD px)
  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Reset différé pour couvrir un éventuel 2ᵉ click sur mobile (touch→click délai)
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    }
  }, []);

  // Bloque le drag natif (ghost image / drag-and-drop HTML5) des `<a>` et `<img>`
  const handleNativeDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

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
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={handleClickCapture}
            onDragStart={handleNativeDragStart}
            className={`flex touch-pan-y select-none ${
              isDragging
                ? 'cursor-grabbing transition-none'
                : 'cursor-grab transition-transform duration-500 ease-in-out'
            }`}
            style={{
              transform: `translateX(calc(-${carouselIndex} * (100% / ${cardsVisible} + ${cardsVisible > 1 ? '0.375rem' : '0rem'}) + ${dragOffset}px))`,
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
