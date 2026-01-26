/**
 * Page Accueil - Liste des spectacles
 * Derviche Diffusion
 * 
 * Affiche les spectacles accessibles selon le rôle de l'utilisateur
 * Interface mobile-first optimisée pour l'accueil sur place
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCheckinAccess } from '@/hooks';
import { formatSlotDate, formatSlotTime, isSlotToday } from '@/lib/services/checkin';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  Calendar,
  MapPin,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Theater,
} from 'lucide-react';

// ============================================
// COMPOSANTS
// ============================================

/** Card skeleton pour le chargement */
function ShowCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="flex gap-3 pr-3">
          <Skeleton className="w-24 h-28 rounded-l-xl shrink-0" />
          <div className="flex-1 space-y-2 py-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Card spectacle cliquable */
interface ShowCardProps {
  show: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    company: {
      name: string;
    };
    upcomingSlotsCount: number;
    pastSlotsCount: number;
    nextSlot: {
      date: string;
      time: string;
      venueName: string;
    } | null;
    lastSlot: {
      date: string;
      time: string;
      venueName: string;
    } | null;
  };
  /** Mode d'affichage : 'upcoming' affiche nextSlot, 'past' affiche lastSlot */
  displayMode: 'upcoming' | 'past';
  onClick: () => void;
}

function ShowCard({ show, displayMode, onClick }: ShowCardProps) {
  // Déterminer quel slot afficher selon le mode
  const displaySlot = displayMode === 'upcoming' ? show.nextSlot : show.lastSlot;
  const slotsCount = displayMode === 'upcoming' ? show.upcomingSlotsCount : show.pastSlotsCount;
  const isToday = displaySlot && isSlotToday(displaySlot.date);

  return (
    <Card 
      className="overflow-hidden py-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 pr-3">
          {/* Image - prend toute la hauteur */}
          <div className="w-24 rounded-l-xl overflow-hidden bg-muted shrink-0 relative self-stretch">
            {show.imageUrl ? (
              <Image
                src={show.imageUrl}
                alt={show.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Theater className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-tight">
                  {show.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {show.company.name}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>

            {/* Représentation affichée (prochaine ou dernière selon le mode) */}
            {displaySlot && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span className={isToday ? 'font-semibold text-gold' : ''}>
                    {isToday ? 'Aujourd\'hui' : formatSlotDate(displaySlot.date)}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">{formatSlotTime(displaySlot.time)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{displaySlot.venueName}</span>
                </div>
              </div>
            )}

            {/* Badge nombre de représentations */}
            <div className="mt-2">
              <Badge variant="secondary" className="text-sm">
                {slotsCount} représentation{slotsCount > 1 ? 's' : ''}
              </Badge>
              {isToday && displayMode === 'upcoming' && (
                <Badge variant="default" className="text-sm ml-1 bg-gold text-derviche-dark">
                  Aujourd&apos;hui
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** État vide */
function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Theater className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">
        Aucun spectacle
      </h2>
      <p className="text-base text-muted-foreground max-w-xs">
        {isAdmin
          ? 'Aucun spectacle avec des représentations à venir.'
          : 'Vous n\'êtes assigné à aucune représentation à venir.'}
      </p>
    </div>
  );
}

/** État erreur */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">
        Erreur de chargement
      </h2>
      <p className="text-base text-muted-foreground max-w-xs mb-4">
        {message}
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

// ============================================
// TYPES
// ============================================

/** Type pour l'onglet actif (cohérent avec [showSlug]/page.tsx) */
type TabFilter = 'upcoming' | 'past';

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function AccueilPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  
  const {
    shows,
    isLoadingShows,
    showsError,
    isAdmin,
    companyName,
    role,
    loadShows,
  } = useCheckinAccess();

  // Handler navigation vers spectacle
  const handleShowClick = useCallback((showSlug: string) => {
    router.push(`/accueil/${showSlug}`);
  }, [router]);

  // Handler changement d'onglet avec validation
  const handleTabChange = useCallback((value: string) => {
    if (value === 'upcoming' || value === 'past') {
      setActiveTab(value);
    }
  }, []);

  // Séparer les spectacles : à venir (ont des représentations futures) vs passés (aucune future)
  const upcomingShowsList = useMemo(() => 
    shows.filter((show) => show.upcomingSlotsCount > 0),
    [shows]
  );
  const pastShowsList = useMemo(() => 
    shows.filter((show) => show.upcomingSlotsCount === 0 && show.pastSlotsCount > 0),
    [shows]
  );

  // Spectacles à afficher selon l'onglet actif
  const displayedShows = useMemo(() => 
    activeTab === 'upcoming' ? upcomingShowsList : pastShowsList,
    [activeTab, upcomingShowsList, pastShowsList]
  );

  // Pour l'onglet "À venir", séparer "Aujourd'hui" des autres
  const todayShows = useMemo(() => 
    upcomingShowsList.filter((show) => show.nextSlot && isSlotToday(show.nextSlot.date)),
    [upcomingShowsList]
  );
  const laterShows = useMemo(() => 
    upcomingShowsList.filter((show) => !show.nextSlot || !isSlotToday(show.nextSlot.date)),
    [upcomingShowsList]
  );

  return (
    <div className="pb-6">
      {/* En-tête contextuel */}
      <div className="bg-white border-b px-4 py-4">
        <h2 className="text-xl font-bold text-derviche-dark">
          {isAdmin ? 'Tous les spectacles' : 'Mes spectacles'}
        </h2>
        <p className="text-base text-muted-foreground mt-0.5">
          {role === 'company' && companyName
            ? `Compagnie ${companyName}`
            : isAdmin
            ? 'Accès à toutes les représentations'
            : 'Représentations assignées'}
        </p>
      </div>

      {/* Onglets À venir / Passés */}
      {!isLoadingShows && !showsError && shows.length > 0 && (
        <div className="px-4 pt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                À venir ({upcomingShowsList.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Passés ({pastShowsList.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Contenu */}
      <div className="px-4 pt-4 space-y-6">
        {/* Chargement */}
        {isLoadingShows && (
          <div className="space-y-3">
            <ShowCardSkeleton />
            <ShowCardSkeleton />
            <ShowCardSkeleton />
          </div>
        )}

        {/* Erreur */}
        {!isLoadingShows && showsError && (
          <ErrorState message={showsError} onRetry={loadShows} />
        )}

        {/* Liste vide globale */}
        {!isLoadingShows && !showsError && shows.length === 0 && (
          <EmptyState isAdmin={isAdmin} />
        )}

        {/* Contenu onglet "À venir" */}
        {!isLoadingShows && !showsError && activeTab === 'upcoming' && (
          <>
            {/* Liste vide pour cet onglet */}
            {upcomingShowsList.length === 0 && shows.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun spectacle avec des représentations à venir
              </div>
            )}

            {/* Spectacles aujourd'hui */}
            {todayShows.length > 0 && (
              <section>
                <h3 className="text-base font-semibold text-gold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Aujourd&apos;hui
                </h3>
                <div className="space-y-3">
                  {todayShows.map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                      displayMode="upcoming"
                      onClick={() => handleShowClick(show.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Spectacles à venir (hors aujourd'hui) */}
            {laterShows.length > 0 && (
              <section>
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Prochainement
                </h3>
                <div className="space-y-3">
                  {laterShows.map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                      displayMode="upcoming"
                      onClick={() => handleShowClick(show.slug)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Contenu onglet "Passés" */}
        {!isLoadingShows && !showsError && activeTab === 'past' && (
          <>
            {/* Liste vide pour cet onglet */}
            {pastShowsList.length === 0 && shows.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun spectacle passé
              </div>
            )}

            {/* Spectacles passés */}
            {pastShowsList.length > 0 && (
              <section>
                <div className="space-y-3">
                  {pastShowsList.map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                      displayMode="past"
                      onClick={() => handleShowClick(show.slug)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Bouton rafraîchir en bas */}
        {!isLoadingShows && !showsError && displayedShows.length > 0 && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadShows}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </div>

      {/* Indicateur de chargement overlay */}
      {isLoadingShows && shows.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        </div>
      )}
    </div>
  );
}
