'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type Spectacle } from '@/components/spectacles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  ArrowRight,
  Home,
} from 'lucide-react';
import type { ReservationConfirmation } from '@/types';
import { formatDateFR, formatTimeFR } from '@/types';

// ============================================
// DONNÉES MOCK
// ============================================

// Spectacles suggestions mock (utilisant le même type que le catalogue)
const mockSuggestions: Spectacle[] = [
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
    slug: 'madame-bovary',
    genre: 'Théâtre',
    nextDate: '22 jan. 2025',
    remainingSlots: 5,
    status: 'available',
  },
  {
    id: 4,
    title: 'JEU',
    company: "Cie A Kan la dériv'",
    venue: 'Théâtre Artéphile',
    image: '/images/spectacles/jeu.jpg',
    slug: 'jeu',
    genre: 'Danse',
    nextDate: '25 jan. 2025',
    remainingSlots: 10,
    status: 'available',
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Récupérer les données de la réservation depuis les query params
  // En production, on récupèrerait depuis la BDD via l'ID
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);

  useEffect(() => {
    // Simuler la récupération des données
    // En production : fetch(`/api/reservations/${reservationId}`)

    // Données mock basées sur les params
    const reservationId = searchParams.get('id') || 'a7f3k9b2-1234-5678-9abc-def012345678';
    const numPlaces = parseInt(searchParams.get('places') || '2', 10);
    const slotDate = searchParams.get('date') || '2025-07-05';
    const slotTime = searchParams.get('time') || '11:00';
    const guestName = searchParams.get('name') || 'Jean Dupont';
    const guestEmail = searchParams.get('email') || 'jean.dupont@theatre.fr';

    // Données du spectacle selon le slug
    const showData = getShowDataBySlug(slug);

    const mockConfirmation: ReservationConfirmation = {
      code: `DD-${reservationId.replace(/-/g, '').substring(0, 6).toUpperCase()}`,
      reservationId,
      show: {
        title: showData.title,
        slug: showData.slug,
        companyName: showData.companyName,
        imageUrl: showData.imageUrl,
        duration: showData.duration,
      },
      slot: {
        date: slotDate,
        time: slotTime,
        formattedDate: formatDateFR(slotDate),
        formattedTime: formatTimeFR(slotTime),
      },
      venue: {
        name: showData.venueName,
        address: showData.venueAddress,
        city: 'Avignon',
      },
      numPlaces,
      guestFullName: guestName,
      guestEmail: guestEmail,
      createdAt: new Date().toISOString(),
    };

    setConfirmation(mockConfirmation);
  }, [slug, searchParams]);

  // Chargement
  if (!confirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Bandeau de succès */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-success/10 border border-success/20 rounded-xl p-6 md:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Réservation confirmée !
            </h1>
            <p className="text-muted-foreground">
              Un email de confirmation a été envoyé à{' '}
              <span className="font-medium text-foreground">{confirmation.guestEmail}</span>
            </p>
          </div>
        </div>

        {/* Carte récapitulative */}
        <div className="max-w-3xl mx-auto mb-8">
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              {/* En-tête avec image du spectacle */}
              <div className="relative h-40 md:h-48 bg-derviche">
                {confirmation.show.imageUrl && (
                  <Image
                    src={confirmation.show.imageUrl}
                    alt={confirmation.show.title}
                    fill
                    className="object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-derviche-dark/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm text-white/80 mb-1">{confirmation.show.companyName}</p>
                  <h2 className="text-xl md:text-2xl font-bold">{confirmation.show.title}</h2>
                </div>
              </div>

              {/* Détails de la réservation */}
              <div className="p-6 space-y-4">
                {/* Date et heure */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-derviche/10 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-derviche" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground capitalize">
                      {confirmation.slot.formattedDate}
                    </p>
                    <p className="text-muted-foreground">à {confirmation.slot.formattedTime}</p>
                  </div>
                </div>

                {/* Lieu */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-derviche/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-derviche" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{confirmation.venue.name}</p>
                    <p className="text-muted-foreground">
                      {confirmation.venue.address}, {confirmation.venue.city}
                    </p>
                  </div>
                </div>

                {/* Nombre de places */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-derviche/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-derviche" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {confirmation.numPlaces} place{confirmation.numPlaces > 1 ? 's' : ''} réservée
                      {confirmation.numPlaces > 1 ? 's' : ''}
                    </p>
                    <p className="text-muted-foreground">au nom de {confirmation.guestFullName}</p>
                  </div>
                </div>

                {/* Durée */}
                {confirmation.show.duration && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-derviche/10 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-derviche" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Durée du spectacle</p>
                      <p className="text-muted-foreground">{confirmation.show.duration}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action : Ajouter au calendrier */}
              <div className="border-t border-border p-6 bg-muted/30">
                <Button variant="outline" className="w-full" disabled>
                  <Calendar className="w-4 h-4 mr-2" />
                  Ajouter au calendrier
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Cette fonctionnalité sera disponible prochainement
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email de confirmation */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <p className="text-blue-900">
                Un email de confirmation contenant tous les détails de votre réservation a été
                envoyé à <span className="font-medium">{confirmation.guestEmail}</span>.
              </p>
              <p className="text-blue-700 mt-1">
                Pensez à vérifier vos spams si vous ne le recevez pas.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions de spectacles - même composant que le catalogue */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-derviche-dark">
              Découvrez aussi...
            </h2>
            <Button variant="ghost" asChild className="text-derviche hover:text-derviche-dark">
              <Link href="/catalogue">
                Voir tout le catalogue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSuggestions.map((spectacle) => (
              <SpectacleCard key={spectacle.id} spectacle={spectacle} variant="grid" />
            ))}
          </div>
        </div>

        {/* Bouton retour accueil */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/accueil">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

interface ShowBasicData {
  title: string;
  slug: string;
  companyName: string;
  imageUrl: string;
  duration: string;
  venueName: string;
  venueAddress: string;
}

function getShowDataBySlug(slug: string): ShowBasicData {
  const showsData: Record<string, ShowBasicData> = {
    'a-moi': {
      title: 'À MOI !',
      slug: 'a-moi',
      companyName: "Cie A Kan la dériv'",
      imageUrl: '/images/spectacles/a-moi.jpg',
      duration: '35 min',
      venueName: 'Théâtre des Béliers',
      venueAddress: '53, rue du Portail Magnanen, 84000 Avignon',
    },
    'rossignol-a-la-langue-pourrie': {
      title: 'ROSSIGNOL À LA LANGUE POURRIE',
      slug: 'rossignol-a-la-langue-pourrie',
      companyName: 'Cie Des Lumières et des Ombres',
      imageUrl: '/images/spectacles/rossignol-a-la-langue-pourrie.jpg',
      duration: '45 min',
      venueName: 'Théâtre du Balcon',
      venueAddress: '38, rue Guillaume Puy, 84000 Avignon',
    },
    'madame-bovary': {
      title: 'MADAME BOVARY EN PLUS DRÔLE ET MOINS LONG',
      slug: 'madame-bovary',
      companyName: 'Cie Le Monde au Balcon',
      imageUrl: '/images/spectacles/madame-bovary.jpg',
      duration: '1h15',
      venueName: 'Théâtre des Corps Saints',
      venueAddress: '15, place des Corps Saints, 84000 Avignon',
    },
  };

  return (
    showsData[slug] || {
      title: 'Spectacle',
      slug: 'spectacle',
      companyName: 'Compagnie',
      imageUrl: '/images/spectacles/a-moi.jpg',
      duration: '1h',
      venueName: 'Théâtre',
      venueAddress: 'Avignon',
    }
  );
}
