/**
 * Composant CompanyStatsCards - Statistiques réservations compagnie
 * Aligné sur admin/reservations — S166
 * Derviche Diffusion
 *
 * Logique :
 * - Card 1 : Confirmées (stats.confirmed) + "hors annulées"
 * - Card 2 : Places réservées (stats.totalPlaces) + moyenne / résa
 * - Card 3 : Présents check-in avec emojis ❤️📰😐 + progress bar
 * - Card 4 : Annulées + Absents (combiné, propre compagnie)
 */

'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Ticket, Calendar, Ban } from 'lucide-react';
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
  const {
    totalPresents,
    presentsPercent,
    cancelledAndAbsent,
    cancelledPercent,
  } = useMemo(() => {
    const presents = stats.presentLoved + stats.presentPress + stats.presentNeutral;

    // Taux de présence : présents / confirmées
    const presentsP = stats.confirmed > 0
      ? Math.round((presents / stats.confirmed) * 100)
      : 0;

    const cancelledAbs = stats.cancelled + stats.absent;

    // Taux d'attrition global : (annulées + absents) / (confirmées + annulées + absents)
    const totalEver = stats.confirmed + stats.cancelled + stats.absent;
    const cancelledP = totalEver > 0
      ? Math.round((cancelledAbs / totalEver) * 100)
      : 0;

    return {
      totalPresents: presents,
      presentsPercent: presentsP,
      cancelledAndAbsent: cancelledAbs,
      cancelledPercent: cancelledP,
    };
  }, [stats]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

      {/* Card 1 — Confirmées */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Réservations confirmées
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Users aria-hidden="true" className="w-4 h-4 text-derviche" />
            <span className="text-xl md:text-2xl font-bold">{stats.confirmed}</span>
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
            <Ticket aria-hidden="true" className="w-4 h-4 text-green-600" />
            <span className="text-xl md:text-2xl font-bold">{stats.totalPlaces}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            moy.{' '}
            {stats.confirmed > 0
              ? (stats.totalPlaces / stats.confirmed).toFixed(1)
              : '0'}{' '}
            / résa
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
            <Calendar aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <span className="text-xl md:text-2xl font-bold">{totalPresents}</span>
            <span className="text-xs text-blue-600 font-medium">
              {presentsPercent}%
            </span>
          </div>
          <Progress
            value={presentsPercent}
            className="h-1.5 mt-2 bg-blue-100 [&>div]:bg-blue-500"
          />
          <div className="flex gap-2 text-xs mt-1 text-muted-foreground">
            <span title="A aimé">❤️ {stats.presentLoved}</span>
            <span title="Presse">📰 {stats.presentPress}</span>
            <span title="Neutre">😐 {stats.presentNeutral}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4 — Annulées + Absents */}
      <Card className="py-1 bg-card/80 border-muted-foreground/10">
        <CardContent className="px-3 py-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">
            Annulées / Absents
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Ban aria-hidden="true" className="w-4 h-4 text-red-500" />
            <span className="text-xl md:text-2xl font-bold">{cancelledAndAbsent}</span>
            <span className="text-xs text-red-500 font-medium">
              {cancelledPercent}%
            </span>
          </div>
          <Progress
            value={cancelledPercent}
            className="h-1.5 mt-2 bg-red-100 [&>div]:bg-red-500"
          />
          <div className="flex gap-2 text-xs mt-1 text-muted-foreground">
            <span>Annulées : {stats.cancelled}</span>
            <span>Absents : {stats.absent}</span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

CompanyStatsCardsComponent.displayName = 'CompanyStatsCards';

export const CompanyStatsCards = memo(CompanyStatsCardsComponent);
