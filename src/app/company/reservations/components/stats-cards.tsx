/**
 * Composant CompanyStatsCards - Statistiques réservations compagnie
 * Derviche Diffusion - Session 119
 * 
 * Affiche 4 cartes avec:
 * - Total réservations
 * - Confirmées (avec progress)
 * - Présents check-in (avec emojis ❤️📰😐)
 * - Annulées + Absents (combiné)
 */

'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Ban, Heart, Newspaper, Meh } from 'lucide-react';
import type { CompanyReservationStats } from '@/lib/services/company-reservations';

// ============================================
// TYPES
// ============================================

export interface CompanyStatsCardsProps {
  stats: CompanyReservationStats;
}

// ============================================
// COMPOSANT
// ============================================

function CompanyStatsCardsComponent({ stats }: CompanyStatsCardsProps) {
  // Calculs mémorisés
  const {
    confirmedPercent,
    totalPresents,
    presentsPercent,
    cancelledPercent,
  } = useMemo(() => {
    const confirmed = stats.total > 0
      ? Math.round((stats.confirmed / stats.total) * 100)
      : 0;

    const presents = stats.presentLoved + stats.presentPress + stats.presentNeutral;
    
    const presentsP = stats.confirmed > 0
      ? Math.round((presents / stats.confirmed) * 100)
      : 0;

    const cancelled = stats.total > 0
      ? Math.round((stats.cancelled / stats.total) * 100)
      : 0;

    return {
      confirmedPercent: confirmed,
      totalPresents: presents,
      presentsPercent: presentsP,
      cancelledPercent: cancelled,
    };
  }, [stats]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Card Total */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Total réservations
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Users aria-hidden="true" className="w-4 h-4 text-derviche" />
            <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalPlaces} places réservées
          </p>
        </CardContent>
      </Card>

      {/* Card Confirmées */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Confirmées
          </p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-600" />
            <span className="text-xl md:text-2xl font-bold">{stats.confirmed}</span>
            <span className="text-xs text-green-600 font-medium">
              {confirmedPercent}%
            </span>
          </div>
          <Progress
            value={confirmedPercent}
            className="h-1.5 mt-2 bg-green-100 [&>div]:bg-green-500"
          />
        </CardContent>
      </Card>

      {/* Card Présents (check-in) avec emojis */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Présents (check-in)
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex -space-x-1">
              <Heart aria-hidden="true" className="w-4 h-4 text-pink-500" />
              <Newspaper aria-hidden="true" className="w-4 h-4 text-blue-500" />
              <Meh aria-hidden="true" className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-xl md:text-2xl font-bold">{totalPresents}</span>
            <span className="text-xs text-blue-600 font-medium">
              {presentsPercent}%
            </span>
          </div>
          <div className="flex gap-2 text-xs mt-2 text-muted-foreground">
            <span title="A aimé">❤️ {stats.presentLoved}</span>
            <span title="Presse">📰 {stats.presentPress}</span>
            <span title="Neutre">😐 {stats.presentNeutral}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card Annulées + Absents */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Annulées / Absents
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Ban aria-hidden="true" className="w-4 h-4 text-red-500" />
            <span className="text-xl md:text-2xl font-bold">
              {stats.cancelled + stats.absent}
            </span>
            <span className="text-xs text-red-500 font-medium">
              {cancelledPercent}%
            </span>
          </div>
          <div className="flex gap-2 text-xs mt-2 text-muted-foreground">
            <span>Annulées: {stats.cancelled}</span>
            <span>Absents: {stats.absent}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

CompanyStatsCardsComponent.displayName = 'CompanyStatsCards';

export const CompanyStatsCards = memo(CompanyStatsCardsComponent);
