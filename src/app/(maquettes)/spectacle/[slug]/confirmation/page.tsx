'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { SpectacleCard, type Spectacle, type SpectacleStatus } from '@/components/spectacles';
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
  Loader2,
  Drama,
} from 'lucide-react';
import type { ReservationConfirmation } from '@/types';
import { formatDateFR, formatTimeFR } from '@/types';
import { usePublicShow } from '@/hooks/usePublicShow';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import type { PublicShow } from '@/lib/services/public-catalog';

// ============================================
// HELPERS
// ============================================

/**
 * Transformer un PublicShow en Spectacle pour le composant SpectacleCard
 */
function transformShowToSpectacle(show: PublicShow): Spectacle {
  // Déterminer le statut
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
    id: 0, // Legacy - on utilise slug comme identifiant unique
    title: show.title,
    company: show.companyName,
    venue: show.nextVenue || 'Lieu à définir',
    image: show.imageUrl || '',
    slug: show.slug,
    genre: show.categories[0] || 'Spectacle',
    nextDate: status === 'available' ? (show.nextDate || '') : '',
    remainingSlots: show.availableSlotsCount,
    status,
  };
}

/**
 * Formater la durée en minutes
 */
function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'Durée non précisée';
  if (minutes === 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

// ============================================
// COMPOSANT INTERNE (avec useSearchParams)
// ============================================

function ConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // État pour éviter les erreurs d'hydratation
  const [isMounted, setIsMounted] = useState(false);
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);
  const [imageError, setImageError] = useState(false);

  // Charger les données du spectacle depuis Supabase
  const { show, isLoading: showLoading, error: showError } = usePublicShow(slug);

  // Charger le catalogue pour les suggestions
  const { shows: allShows, isLoading: catalogLoading } = usePublicCatalog();

  // Générer les suggestions (autres spectacles disponibles, excluant le spectacle actuel)
  const suggestions = useMemo(() => {
    return allShows
      .filter((s) => s.slug !== slug && s.status === 'published')
      .filter((s) => s.status !== 'archived')
      .slice(0, 3)
      .map(transformShowToSpectacle);
  }, [allShows, slug]);

  // Fix d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset image error quand le spectacle change
  useEffect(() => {
    setImageError(false);
  }, [slug]);

  // Construire la confirmation quand les données sont prêtes
  useEffect(() => {
    if (!isMounted || !show) return;

    // Récupérer les données de la réservation depuis les query params
    const reservationId = searchParams.get('id') || 'a7f3k9b2-1234-5678-9abc-def012345678';
    const numPlaces = parseInt(searchParams.get('places') || '2', 10);
    const slotDate = searchParams.get('date') || '2026-01-15';
    const slotTime = searchParams.get('time') || '11:00';
    const guestName = searchParams.get('name') || 'Jean Dupont';
    const guestEmail = searchParams.get('email') || 'jean.dupont@theatre.fr';

    // Trouver le slot correspondant pour le lieu (matcher date ET heure)
    const matchingSlot = show.slots.find(slot => slot.date === slotDate && slot.time === slotTime);
    const venueName = matchingSlot?.venueName || show.nextVenue || 'Théâtre';
    const venueCity = matchingSlot?.venueCity || '';
    const venueAddress = venueCity ? `${venueName}, ${venueCity}` : venueName;

    const mockConfirmation: ReservationConfirmation = {
      code: `DD-${reservationId.replace(/-/g, '').substring(0, 6).toUpperCase()}`,
      reservationId,
      show: {
        title: show.title,
        slug: show.slug,
        companyName: show.companyName,
        imageUrl: show.imageUrl || '',
        duration: formatDuration(show.durationMinutes),
      },
      slot: {
        date: slotDate,
        time: slotTime,
        formattedDate: formatDateFR(slotDate),
        formattedTime: formatTimeFR(slotTime),
      },
      venue: {
        name: venueName,
        address: venueAddress,
        city: venueCity || 'France',
      },
      numPlaces,
      guestFullName: guestName,
      guestEmail: guestEmail,
      createdAt: new Date().toISOString(),
    };

    setConfirmation(mockConfirmation);
  }, [slug, searchParams, isMounted, show]);

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

  // Erreur de chargement du spectacle
  if (showError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-4">Confirmation enregistrée</h1>
            <p className="text-muted-foreground mb-6">
              Votre réservation a bien été enregistrée mais nous n&apos;avons pas pu charger les détails du spectacle.
            </p>
            <Button asChild>
              <Link href="/catalogue">Retour au catalogue</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Chargement
  if (showLoading || !confirmation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la confirmation...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const hasImage = confirmation.show.imageUrl && !imageError;

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
                {hasImage && confirmation.show.imageUrl ? (
                  <Image
                    src={confirmation.show.imageUrl}
                    alt={confirmation.show.title}
                    fill
                    className="object-cover opacity-30"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Drama className="w-16 h-16 text-white/30" />
                  </div>
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
                    {confirmation.venue.address !== confirmation.venue.name && (
                      <p className="text-muted-foreground">{confirmation.venue.address}</p>
                    )}
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

        {/* Suggestions de spectacles */}
        {!catalogLoading && suggestions.length > 0 && (
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
              {suggestions.map((spectacle) => (
                <SpectacleCard key={spectacle.slug} spectacle={spectacle} />
              ))}
            </div>
          </div>
        )}

        {/* Bouton retour accueil */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/accueil">
              <Home className="w-4 h-4 mr-2" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL (avec Suspense)
// ============================================

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
          <Footer />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
