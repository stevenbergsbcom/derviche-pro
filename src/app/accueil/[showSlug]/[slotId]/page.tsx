/**
 * Page Réservations d'une représentation - Check-in Mobile
 * Derviche Diffusion
 * 
 * Affiche les réservations d'une représentation avec recherche
 * Interface mobile-first optimisée pour l'accueil sur place
 */

'use client';

import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { createClient } from '@/lib/supabase/client';
import {
  getSlotReservations,
  formatSlotDate,
  formatSlotTime,
  isSlotToday,
  type CheckinReservation,
} from '@/lib/services/checkin';
import { searchMatch } from '@/lib/utils';
import { isPresent } from '@/components/accueil/StatusBadge';
import {
  ReservationRow,
  ReservationRowSkeleton,
  EmptyReservations,
  CheckinDrawer,
  AddReservationDrawer,
  type ReservationRowData,
} from '@/components/accueil';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  X,
  Plus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface SlotInfo {
  id: string;
  date: string;
  time: string;
  venueName: string;
  venueCity: string;
  showTitle: string;
  showSlug: string;
  capacity: number;
}

// ============================================
// COMPOSANTS
// ============================================

/** En-tête avec infos du slot et compteurs */
function SlotHeader({
  slotInfo,
  confirmedCount,
  presentCount,
  isLoading,
}: {
  slotInfo: SlotInfo | null;
  confirmedCount: number;
  presentCount: number;
  isLoading: boolean;
}) {
  if (isLoading || !slotInfo) {
    return (
      <div className="bg-white border-b px-4 py-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  const isToday = isSlotToday(slotInfo.date);

  return (
    <div className="bg-white border-b px-4 py-4">
      {/* Titre du spectacle */}
      <h2 className="font-bold text-derviche-dark line-clamp-1">
        {slotInfo.showTitle}
      </h2>

      {/* Date, heure, lieu */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
        <span className={`flex items-center gap-1 ${isToday ? 'text-gold font-medium' : ''}`}>
          <Calendar className="w-4 h-4" />
          {isToday ? "Aujourd'hui" : formatSlotDate(slotInfo.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatSlotTime(slotInfo.time)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {slotInfo.venueName}
        </span>
      </div>

      {/* Compteur présents */}
      <Card className="mt-3 bg-gray-50 border-0 py-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Présents</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-derviche-dark">
                {presentCount}
              </span>
              <span className="text-lg text-muted-foreground">
                /{confirmedCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Barre de recherche */
function SearchBar({
  value,
  onChange,
  resultsCount,
  totalCount,
}: {
  value: string;
  onChange: (value: string) => void;
  resultsCount: number;
  totalCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-gray-50 px-4 py-3 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher par nom, structure, email..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9 bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground mt-2">
          {resultsCount} résultat{resultsCount > 1 ? 's' : ''} sur {totalCount}
        </p>
      )}
    </div>
  );
}

/** État erreur */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-derviche-dark mb-2">
        Erreur de chargement
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function SlotReservationsPage() {
  const params = useParams();
  const showSlug = params.showSlug as string;
  const slotId = params.slotId as string;

  const { user, role, isLoading: isAuthLoading } = useCurrentUserRole();

  // States
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [reservations, setReservations] = useState<CheckinReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  // States pour le drawer de check-in
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRowData | null>(null);

  // State pour le drawer d'ajout de réservation
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  // Ref pour éviter les doubles appels
  const loadedRef = useRef(false);

  // Charger les infos du slot
  const loadSlotInfo = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('slots')
        .select(`
          id,
          date,
          time,
          capacity,
          venues (
            name,
            city
          ),
          shows (
            title,
            slug
          )
        `)
        .eq('id', slotId)
        .single();

      if (fetchError || !data) {
        logger.error('SlotReservationsPage - Erreur chargement slot', { fetchError });
        return null;
      }

      const venue = data.venues as { name: string; city: string } | null;
      const show = data.shows as { title: string; slug: string } | null;

      return {
        id: data.id,
        date: data.date,
        time: data.time,
        capacity: data.capacity,
        venueName: venue?.name || 'Lieu inconnu',
        venueCity: venue?.city || '',
        showTitle: show?.title || 'Spectacle',
        showSlug: show?.slug || showSlug,
      };
    } catch (err) {
      logger.error('SlotReservationsPage - Exception chargement slot', { err });
      return null;
    }
  }, [slotId, showSlug]);

  // Charger le company_id si rôle company
  useEffect(() => {
    async function loadCompanyId() {
      if (!user || role !== 'company') return;

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (data?.company_id) {
          setCompanyId(data.company_id);
        }
      } catch (err) {
        logger.error('SlotReservationsPage - Erreur chargement company_id', { err });
      }
    }

    void loadCompanyId();
  }, [user, role]);

  // Charger les données
  const loadData = useCallback(async () => {
    if (!user || !role || isAuthLoading) return;
    if (role === 'company' && companyId === null) return;

    setIsLoading(true);
    setError(null);

    try {
      // Charger les infos du slot
      const info = await loadSlotInfo();
      if (!info) {
        setError('Représentation non trouvée');
        setIsLoading(false);
        return;
      }
      setSlotInfo(info);

      // Charger les réservations
      const result = await getSlotReservations(slotId, user.id, role, companyId);

      if (result.error) {
        setError(result.error);
        setReservations([]);
      } else {
        setReservations(result.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, companyId, isAuthLoading, slotId, loadSlotInfo]);

  // Chargement initial
  useEffect(() => {
    if (!loadedRef.current && !isAuthLoading && user && role) {
      if (role === 'company' && companyId === null) return;
      loadedRef.current = true;
      void loadData();
    }
  }, [isAuthLoading, user, role, companyId, loadData]);

  // Refresh manuel
  const handleRefresh = useCallback(() => {
    loadedRef.current = false;
    void loadData();
  }, [loadData]);

  // Filtrer les réservations selon la recherche
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;

    return reservations.filter((r) => {
      const searchFields = [
        r.guestFirstName,
        r.guestLastName,
        r.guestStructure,
        r.guestEmail,
      ]
        .filter(Boolean)
        .join(' ');

      return searchMatch(searchFields, searchQuery);
    });
  }, [reservations, searchQuery]);

  // Compter les présents et confirmés
  const confirmedReservations = reservations.filter((r) => r.status === 'confirmed');
  const confirmedCount = confirmedReservations.length;
  const presentCount = confirmedReservations.filter((r) =>
    isPresent(r.checkinStatus)
  ).length;

  // Handler clic sur réservation - ouvre le drawer
  const handleReservationClick = useCallback(
    (reservation: CheckinReservation) => {
      // Convertir en ReservationRowData pour le drawer
      const rowData: ReservationRowData = {
        id: reservation.id,
        guestFirstName: reservation.guestFirstName,
        guestLastName: reservation.guestLastName,
        guestStructure: reservation.guestStructure,
        guestEmail: reservation.guestEmail,
        guestEmailSecondary: reservation.guestEmailSecondary,
        guestPhone: reservation.guestPhone,
        guestPhoneSecondary: reservation.guestPhoneSecondary,
        guestFunction: reservation.guestFunction,
        guestAddress: reservation.guestAddress,
        guestPostalCode: reservation.guestPostalCode,
        guestCity: reservation.guestCity,
        guestAfcNumber: reservation.guestAfcNumber,
        numPlaces: reservation.numPlaces,
        checkinStatus: reservation.checkinStatus,
        checkinComment: reservation.checkinComment,
        checkinVenueNotes: reservation.checkinVenueNotes,
        checkinInternalNotes: reservation.checkinInternalNotes,
        specialRequests: reservation.specialRequests,
        status: reservation.status,
      };
      setSelectedReservation(rowData);
      setDrawerOpen(true);
    },
    []
  );

  // Handler succès check-in - met à jour la liste
  // Note: onSuccess envoie toujours tous les champs depuis result.data,
  // donc on utilise ?? null pour convertir undefined en null (compatibilité de types)
  const handleCheckinSuccess = useCallback(
    (updatedReservation: ReservationRowData) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === updatedReservation.id
            ? { 
                ...r, 
                // Check-in
                checkinStatus: updatedReservation.checkinStatus,
                checkinComment: updatedReservation.checkinComment ?? null,
                checkinVenueNotes: updatedReservation.checkinVenueNotes ?? null,
                checkinInternalNotes: updatedReservation.checkinInternalNotes ?? null,
                // Infos guest
                guestFirstName: updatedReservation.guestFirstName,
                guestLastName: updatedReservation.guestLastName,
                guestEmail: updatedReservation.guestEmail,
                guestEmailSecondary: updatedReservation.guestEmailSecondary ?? null,
                guestPhone: updatedReservation.guestPhone ?? null,
                guestPhoneSecondary: updatedReservation.guestPhoneSecondary ?? null,
                guestStructure: updatedReservation.guestStructure,
                guestFunction: updatedReservation.guestFunction ?? null,
                guestAddress: updatedReservation.guestAddress ?? null,
                guestPostalCode: updatedReservation.guestPostalCode ?? null,
                guestCity: updatedReservation.guestCity ?? null,
                guestAfcNumber: updatedReservation.guestAfcNumber ?? null,
                specialRequests: updatedReservation.specialRequests ?? null,
              }
            : r
        )
      );
    },
    []
  );

  // Handler bouton ajouter - ouvre le drawer d'ajout
  const handleAddReservation = useCallback(() => {
    setAddDrawerOpen(true);
  }, []);

  // Handler succès ajout réservation - rafraîchit la liste
  const handleAddSuccess = useCallback(() => {
    // Recharger les données après ajout
    loadedRef.current = false;
    void loadData();
    toast.success('Réservation ajoutée');
  }, [loadData]);

  return (
    <div className="flex flex-col min-h-full">
      {/* En-tête */}
      <SlotHeader
        slotInfo={slotInfo}
        confirmedCount={confirmedCount}
        presentCount={presentCount}
        isLoading={isLoading && !slotInfo}
      />

      {/* Barre de recherche */}
      {!isLoading && !error && reservations.length > 0 && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultsCount={filteredReservations.length}
          totalCount={reservations.length}
        />
      )}

      {/* Contenu */}
      <div className="flex-1">
        {/* Chargement */}
        {isLoading && (
          <div className="p-4 space-y-3">
            <ReservationRowSkeleton />
            <ReservationRowSkeleton />
            <ReservationRowSkeleton />
            <ReservationRowSkeleton />
            <ReservationRowSkeleton />
          </div>
        )}

        {/* Erreur */}
        {!isLoading && error && (
          <ErrorState message={error} onRetry={handleRefresh} />
        )}

        {/* Liste vide */}
        {!isLoading && !error && reservations.length === 0 && (
          <EmptyReservations message="Aucune réservation pour cette représentation" />
        )}

        {/* Aucun résultat de recherche */}
        {!isLoading &&
          !error &&
          reservations.length > 0 &&
          filteredReservations.length === 0 && (
            <EmptyReservations message={`Aucun résultat pour "${searchQuery}"`} />
          )}

        {/* Liste des réservations */}
        {!isLoading && !error && filteredReservations.length > 0 && (
          <div className="p-4 space-y-3">
            {filteredReservations.map((reservation) => (
              <ReservationRow
                key={reservation.id}
                reservation={{
                  id: reservation.id,
                  guestFirstName: reservation.guestFirstName,
                  guestLastName: reservation.guestLastName,
                  guestStructure: reservation.guestStructure,
                  guestEmail: reservation.guestEmail,
                  numPlaces: reservation.numPlaces,
                  checkinStatus: reservation.checkinStatus,
                  status: reservation.status,
                }}
                onClick={() => handleReservationClick(reservation)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barre d'action en bas */}
      {!isLoading && !error && (
        <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleAddReservation}
            className="flex-1 bg-gold hover:bg-gold/90 text-derviche-dark"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une réservation
          </Button>
        </div>
      )}

      {/* Overlay de chargement */}
      {isLoading && reservations.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        </div>
      )}

      {/* Drawer de check-in */}
      <CheckinDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={handleCheckinSuccess}
      />

      {/* Drawer d'ajout de réservation */}
      <AddReservationDrawer
        slotId={slotId}
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
