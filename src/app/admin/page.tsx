'use client';

import { useState, useEffect } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  Theater,
  MapPin,
  Clock,
  RefreshCw,
  ArrowRight,
  CalendarDays,
  UserCheck,
  Building2,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// HELPERS
// ============================================

/**
 * Formate la date du jour en français complet
 * Ex: "vendredi 24 janvier 2025"
 */
function formatTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date en français
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formate une heure (HH:mm:ss → HH:mm)
 */
function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/**
 * Formate une date relative (il y a X minutes/heures)
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return `Il y a ${diffDays} jours`;
}

/**
 * Retourne la couleur du badge selon le taux de remplissage
 */
function getOccupancyColor(rate: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (rate >= 90) return 'destructive';
  if (rate >= 70) return 'default';
  if (rate >= 40) return 'secondary';
  return 'outline';
}

// ============================================
// COMPOSANTS
// ============================================

/** Carte de statistique */
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">+{trend.value}</span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton pour les stats */
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Skeleton pour les listes */
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Lien d'accès rapide */
function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{title}</p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function AdminDashboardPage() {
  const { data, isLoading, error, refresh } = useAdminDashboard();
  const [firstName, setFirstName] = useState<string | null>(null);

  // Récupérer le prénom de l'utilisateur connecté
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (profile?.first_name) {
          setFirstName(profile.first_name);
        }
      } catch (err) {
        // Silencieux - ce n'est pas critique
        console.error('Erreur récupération profil:', err);
      }
    };

    void fetchUserProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête avec salutation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
            Bonjour{firstName ? ` ${firstName}` : ''} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Nous sommes le {formatTodayDate()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          aria-label="Actualiser le tableau de bord"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {isLoading ? (
        <StatsSkeleton />
      ) : data?.stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Spectacles actifs"
            value={data.stats.total_shows_active}
            description="Publiés sur le catalogue"
            icon={Theater}
          />
          <StatCard
            title="Créneaux à venir"
            value={data.stats.total_slots_upcoming}
            description="Représentations programmées"
            icon={CalendarDays}
          />
          <StatCard
            title="Réservations"
            value={data.stats.total_reservations}
            description={`${data.stats.reservations_today} aujourd'hui, ${data.stats.reservations_this_week} cette semaine`}
            icon={Ticket}
            trend={data.stats.reservations_today > 0 ? {
              value: data.stats.reservations_today,
              label: "aujourd'hui"
            } : undefined}
          />
          <StatCard
            title="Taux de remplissage"
            value={`${data.stats.average_occupancy_rate}%`}
            description="Moyenne créneaux à venir"
            icon={Users}
          />
        </div>
      ) : null}

      {/* Accès rapides */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accès rapides</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/admin/spectacles"
            icon={Theater}
            title="Spectacles"
            description="Gérer les spectacles"
          />
          <QuickLink
            href="/admin/reservations"
            icon={Ticket}
            title="Réservations"
            description="Voir les réservations"
          />
          <QuickLink
            href="/admin/lieux"
            icon={MapPin}
            title="Lieux"
            description="Gérer les salles"
          />
          <QuickLink
            href="/admin/utilisateurs"
            icon={UserCheck}
            title="Utilisateurs"
            description="Gérer les comptes"
          />
          <QuickLink
            href="/admin/compagnies"
            icon={Building2}
            title="Compagnies"
            description="Gérer les compagnies"
          />
          <QuickLink
            href="/accueil"
            icon={Calendar}
            title="Check-in"
            description="Accueil des invités"
          />
          <QuickLink
            href="/admin/preferences"
            icon={Settings}
            title="Préférences"
            description="Configuration"
          />
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prochains créneaux */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Prochaines représentations</CardTitle>
              <CardDescription>Les 10 prochains créneaux</CardDescription>
            </div>
            <Link href="/admin/spectacles">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : data?.upcomingSlots && data.upcomingSlots.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{slot.show.title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(slot.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(slot.time)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {slot.venue.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant={getOccupancyColor(slot.occupancy_rate)}>
                        {slot.reservations_count}/{slot.capacity === 999999 ? '∞' : slot.capacity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun créneau à venir
              </p>
            )}
          </CardContent>
        </Card>

        {/* Réservations récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Réservations récentes</CardTitle>
              <CardDescription>Les 10 dernières réservations</CardDescription>
            </div>
            <Link href="/admin/reservations">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : data?.recentReservations && data.recentReservations.length > 0 ? (
              <div className="space-y-3">
                {data.recentReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {reservation.guest_first_name} {reservation.guest_last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{reservation.slot.show.title}</span>
                        <span>•</span>
                        <span>{formatDate(reservation.slot.date)}</span>
                      </div>
                      {reservation.guest_structure && (
                        <p className="text-xs text-muted-foreground truncate">
                          {reservation.guest_structure}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <Badge variant="outline">
                        {reservation.num_places} place{reservation.num_places > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(reservation.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune réservation récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
