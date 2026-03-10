/**
 * Composant StatsCards pour la page des réservations admin
 * Affiche 4 cartes de statistiques avec barres de progression
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 *
 * Logique :
 * - total     = réservations confirmées uniquement (hors annulées)
 * - totalPlaces = sum(num_places) des confirmées
 * - cancelled = annulées (calculé séparément)
 * - présents  = check-in effectué (sur les confirmées)
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Ticket, Calendar, Ban, Theater } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ReservationStats {
  total: number;       // confirmées uniquement
  totalPlaces: number; // sum(num_places) des confirmées
  confirmed: number;   // alias de total (conservé pour compatibilité)
  cancelled: number;
  presentLoved: number;
  presentPress: number;
  presentNeutral: number;
}

export interface StatsCardsProps {
  stats: ReservationStats;
  isExterne: boolean;
  /** Titre du spectacle filtré — null = stats globales */
  filteredShowTitle?: string | null;
}

// ============================================
// COMPOSANT
// ============================================

export function StatsCards({ stats, isExterne, filteredShowTitle }: StatsCardsProps) {
  const totalPresents = stats.presentLoved + stats.presentPress + stats.presentNeutral;

  // Taux de présence : sur les confirmées
  const presentsPercent = stats.total > 0
    ? Math.round((totalPresents / stats.total) * 100)
    : 0;

  // Taux d'annulation : sur le volume total réel (confirmées + annulées)
  const totalWithCancelled = stats.total + stats.cancelled;
  const cancelledPercent = totalWithCancelled > 0
    ? Math.round((stats.cancelled / totalWithCancelled) * 100)
    : 0;

  const statsLabel = isExterne ? 'Vos réservations' : 'Réservations confirmées';

  return (
    <div className="space-y-2">
      {/* Badge contextuel — visible si filtre spectacle actif */}
      {filteredShowTitle && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-derviche/5 text-derviche border-derviche/30 text-xs font-normal"
          >
            <Theater className="w-3 h-3 mr-1.5" />
            Stats pour : <span className="font-medium ml-1">{filteredShowTitle}</span>
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

        {/* Card 1 — Réservations confirmées */}
        <Card className="py-1 bg-card/80 border-muted-foreground/10">
          <CardContent className="px-3 py-2">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              {statsLabel}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-derviche" />
              <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              hors annulées
            </p>
          </CardContent>
        </Card>

        {/* Card 2 — Places réservées */}
        <Card className="py-1 bg-card/80 border-muted-foreground/10">
          <CardContent className="px-3 py-2">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Places réservées
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Ticket className="w-4 h-4 text-green-600" />
              <span className="text-xl md:text-2xl font-bold">{stats.totalPlaces}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              moy. {stats.total > 0 ? (stats.totalPlaces / stats.total).toFixed(1) : '0'} / résa
            </p>
          </CardContent>
        </Card>

        {/* Card 3 — Présents (check-in) */}
        <Card className="py-1 bg-card/80 border-muted-foreground/10">
          <CardContent className="px-3 py-2">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Présents (check-in)
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xl md:text-2xl font-bold">{totalPresents}</span>
              <span className="text-xs text-blue-600 font-medium">
                {presentsPercent}%
              </span>
            </div>
            <Progress
              value={presentsPercent}
              className="h-1.5 mt-2 bg-blue-100 [&>div]:bg-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresents} / {stats.total} confirmées
            </p>
          </CardContent>
        </Card>

        {/* Card 4 — Annulées */}
        <Card className="py-1 bg-card/80 border-muted-foreground/10">
          <CardContent className="px-3 py-2">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Annulées
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Ban className="w-4 h-4 text-red-600" />
              <span className="text-xl md:text-2xl font-bold">{stats.cancelled}</span>
              <span className="text-xs text-red-600 font-medium">
                {cancelledPercent}%
              </span>
            </div>
            <Progress
              value={cancelledPercent}
              className="h-1.5 mt-2 bg-red-100 [&>div]:bg-red-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              sur {totalWithCancelled} au total
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
