'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, Spectacle } from '@/components/spectacles';
import {
  Search,
  Calendar,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
} from 'lucide-react';

// Données des spectacles (maquette) avec les vrais lieux
const spectacles: Spectacle[] = [
  {
    id: 1,
    title: 'À MOI !',
    company: 'Cie A Kan la dériv\'',
    venue: 'Théâtre des Béliers',
    image: 'https://sbcom.fr/derviche2025/a-moi.jpg',
    slug: 'a-moi',
    genre: 'Théâtre',
    nextDate: '15 jan. 2025',
  },
  {
    id: 2,
    title: 'ROSSIGNOL À LA LANGUE POURRIE',
    company: 'Cie Des Lumières et des Ombres',
    venue: 'Théâtre du Balcon',
    image: 'https://sbcom.fr/derviche2025/rossignol-a-la-langue-pourrie.jpg',
    slug: 'rossignol-a-la-langue-pourrie',
    genre: 'Jeune public',
    nextDate: '18 jan. 2025',
  },
  {
    id: 3,
    title: 'MADAME BOVARY EN PLUS DRÔLE ET MOINS LONG',
    company: 'Cie Le Monde au Balcon',
    venue: 'Théâtre des Corps Saints',
    image: 'https://sbcom.fr/derviche2025/madame-bovary.jpg',
    slug: 'madame-bovary-en-plus-drole-et-moins-long',
    genre: 'Théâtre',
    nextDate: '22 jan. 2025',
  },
  {
    id: 4,
    title: 'JEU',
    company: 'Cie A Kan la dériv\'',
    venue: 'Théâtre Artéphile',
    image: 'https://sbcom.fr/derviche2025/jeu.jpg',
    slug: 'jeu',
    genre: 'Danse',
    nextDate: '25 jan. 2025',
  },
  {
    id: 5,
    title: 'LA MER',
    company: 'Cie Le Ver à Soie',
    venue: 'Théâtre Espace Alya',
    image: 'https://sbcom.fr/derviche2025/la-mer.jpg',
    slug: 'la-mer',
    genre: 'Marionnettes',
    nextDate: '28 jan. 2025',
  },
];

// Nombre de cards visibles selon la taille d'écran
const CARDS_VISIBLE = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

export default function MaquetteAccueil() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(CARDS_VISIBLE.desktop);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % spectacles.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  // Carousel automatique pour les spectacles
  useEffect(() => {
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 6000); // Change toutes les 6 secondes

    return () => clearInterval(interval);
  }, [cardsVisible]);

  // Reset carousel index si nécessaire lors du changement de taille
  useEffect(() => {
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    if (carouselIndex > maxIndex) {
      setCarouselIndex(maxIndex);
    }
  }, [cardsVisible, carouselIndex]);

  // Navigation du carousel des spectacles
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextCarousel = () => {
    const maxIndex = Math.max(0, spectacles.length - cardsVisible);
    setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Header réutilisable */}
      <Header />

      {/* Hero Section - Mobile First avec Slider auto */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-white to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-4 md:mb-6 text-derviche-dark">
            Découvrez les spectacles<br />
            accompagnés par Derviche Diffusion
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-3 md:mb-4">
            Derviche est une agence de production et de diffusion innovante, transparente et mutualiste,
            offrant un accompagnement sur mesure aux compagnies de spectacles vivants et aux artistes.
          </p>
          <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
            Comme les derviches tourneurs, les spectacles ont besoin de tourner pour vivre et grandir !
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            <Button size="lg" className="w-full sm:w-auto bg-derviche hover:bg-derviche-dark" asChild>
              <Link href="/catalogue">Réserver ma place</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="#avantages">Découvrir la plateforme</Link>
            </Button>
          </div>

          {/* Hero Slider - Images des spectacles */}
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl relative">
              {spectacles.map((spectacle, index) => (
                <div
                  key={spectacle.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  <Image
                    src={spectacle.image}
                    alt={spectacle.title}
                    width={1200}
                    height={675}
                    className="w-full h-full object-cover"
                    priority={index === 0}
                  />
                  {/* Overlay avec titre du spectacle */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                    <p className="text-white font-bold text-lg md:text-2xl">{spectacle.title}</p>
                    <p className="text-white/80 text-sm md:text-base">{spectacle.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Avantages Section - Mobile First */}
      <section id="avantages" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">La plateforme</p>
            <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">Simplifiez votre programmation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Avantage 1 */}
            <div className="text-center p-4 md:p-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-derviche/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 md:w-8 md:h-8 text-derviche" />
              </div>
              <h3 className="font-semibold text-lg mb-2 md:mb-3 text-derviche-dark">Accès direct</h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Parcourez notre catalogue complet et réservez les spectacles qui
                correspondent à votre programmation en quelques clics.
              </p>
            </div>

            {/* Avantage 2 */}
            <div className="text-center p-4 md:p-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-derviche/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 md:w-8 md:h-8 text-derviche" />
              </div>
              <h3 className="font-semibold text-lg mb-2 md:mb-3 text-derviche-dark">Gestion simple</h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Gérez vos réservations, suivez vos confirmations et accédez à tous les
                détails de vos spectacles en un seul endroit.
              </p>
            </div>

            {/* Avantage 3 */}
            <div className="text-center p-4 md:p-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-derviche/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-derviche" />
              </div>
              <h3 className="font-semibold text-lg mb-2 md:mb-3 text-derviche-dark">Accompagnement</h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Notre équipe est à vos côtés et reste joignable pour toutes informations
                complémentaires sur les spectacles et compagnies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spectacles Section - Mobile First avec Carousel */}
      <section className="py-12 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
            <div>
              <p className="text-sm text-gold font-medium mb-1 uppercase tracking-wider">Sélection</p>
              <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">Spectacles à découvrir</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1 md:mt-2">
                Explorez les spectacles en tournée cette saison
              </p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/catalogue">Voir tout le catalogue</Link>
            </Button>
          </div>

          {/* Carousel Spectacles */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(calc(-${carouselIndex} * (100% / ${cardsVisible} + ${cardsVisible > 1 ? '0.375rem' : '0rem'})))`,
                gap: cardsVisible === 1 ? '0' : '1.5rem'
              }}
            >
              {spectacles.map((show) => (
                <div
                  key={show.id}
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / cardsVisible}% - ${cardsVisible > 1 ? '1.125rem' : '0rem'})` }}
                >
                  <SpectacleCard spectacle={show} variant="carousel" />
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-between mt-6 md:mt-8">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.max(1, spectacles.length - cardsVisible + 1) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === carouselIndex ? 'bg-derviche' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  aria-label={`Aller à la page ${i + 1}`}
                />
              ))}
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
              <Link href="/catalogue">Voir tout le catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Chiffres Section - Mobile First */}
      <section className="py-12 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
            <div className="text-center md:text-left">
              <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">Notre impact</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">
                Les chiffres qui parlent de notre engagement
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Depuis 2016, Derviche rassemble les meilleurs spectacles vivants et les
                programmateurs les plus engagés. Plus de 200 000 spectateurs ont déjà
                applaudi nos artistes lors de leurs tournées !
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <Card className="p-3 md:p-6 text-center hover:shadow-lg transition-shadow">
                <p className="text-2xl md:text-4xl font-bold text-derviche mb-1 md:mb-2">120</p>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">Spectacles représentés</p>
              </Card>
              <Card className="p-3 md:p-6 text-center hover:shadow-lg transition-shadow">
                <p className="text-2xl md:text-4xl font-bold text-derviche mb-1 md:mb-2">850</p>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">Programmateurs actifs</p>
              </Card>
              <Card className="p-3 md:p-6 text-center hover:shadow-lg transition-shadow">
                <p className="text-2xl md:text-4xl font-bold text-derviche mb-1 md:mb-2">18</p>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">Compagnies partenaires</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Mobile First */}
      <section className="py-12 md:py-20 bg-derviche text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Ne manquez aucune création</h2>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto mb-6 md:mb-8">
            Recevez en avant-première les nouvelles créations et les dates des prochaines représentations professionnelles.
          </p>

          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder="Votre adresse email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-gold"
            />
            <Button className="bg-gold hover:bg-gold-light text-derviche-dark font-medium whitespace-nowrap">
              S&apos;abonner
            </Button>
          </div>

          <p className="text-xs text-white/60 mt-4">
            En vous inscrivant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité.
          </p>
        </div>
      </section>

      {/* Contact Section - Mobile First */}
      <section id="contact" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">Contact</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">Nous contacter</h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8 md:mb-12">
              Une question ? Notre équipe est à votre disposition pour vous accompagner.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Email</h3>
                <a href="mailto:derviche@dervichediffusion.com" className="text-muted-foreground hover:text-derviche transition text-sm">
                  derviche@dervichediffusion.com
                </a>
              </div>

              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Téléphone</h3>
                <a href="tel:+33610584296" className="text-muted-foreground hover:text-derviche transition text-sm">
                  +33 6 10 58 42 96
                </a>
              </div>

              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Adresse</h3>
                <p className="text-muted-foreground text-center text-sm">
                  13, rue de Cotte<br />
                  75012 Paris, France
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer réutilisable */}
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
