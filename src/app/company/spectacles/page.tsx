'use client';

import Image from 'next/image';
import { Film, Theater, AlertTriangle, RefreshCw, Calendar, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyShows } from '@/hooks';
import type { CompanyShowWithStats } from '@/lib/services/company-dashboard';
import type { ShowStatus } from '@/types/database';

// ============================================
// HELPERS
// ============================================

function getStatusBadge(status: ShowStatus) {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Publié</Badge>;
    case 'draft':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Brouillon</Badge>;
    default:
      return <Badge variant="secondary">Archivé</Badge>;
  }
}

// ============================================
// COMPOSANTS ÉTATS
// ============================================

function ShowsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 bg-derviche/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-derviche/30" />
        </div>
        <p className="font-medium text-derviche-dark">Aucun spectacle enregistré</p>
        <p className="text-sm text-muted-foreground mt-1">
          Vos spectacles apparaîtront ici une fois ajoutés par l&apos;équipe Derviche.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <p className="font-medium text-derviche-dark">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// CARTE SPECTACLE
// ============================================

function ShowCard({ show }: { show: CompanyShowWithStats }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-40 bg-derviche/5 shrink-0">
        {show.image_url ? (
          <Image
            src={show.image_url}
            alt={show.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Theater className="w-10 h-10 text-derviche/20" />
          </div>
        )}
        {/* Badge statut en surimpression */}
        <div className="absolute top-2 right-2">
          {getStatusBadge(show.status)}
        </div>
      </div>

      {/* Contenu */}
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="font-semibold text-derviche-dark leading-tight line-clamp-2">
          {show.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0 text-gold" />
            {show.total_slots} représentation{show.total_slots > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 shrink-0 text-gold" />
            {show.total_reservations} réservation{show.total_reservations > 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function CompanySpectaclesPage() {
  const { shows, isLoading, error, refresh } = useCompanyShows();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
            <Film className="w-7 h-7 text-gold" />
            Mes spectacles
          </h1>
          <p className="text-muted-foreground">
            {!isLoading && !error && shows.length > 0
              ? `${shows.length} spectacle${shows.length > 1 ? 's' : ''}`
              : 'Vos spectacles et leurs statistiques'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <ShowsSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refresh()} />
      ) : shows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      )}
    </div>
  );
}
