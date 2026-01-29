/**
 * Composant StatsCards pour la page des réservations admin
 * Affiche 4 cartes de statistiques avec barres de progression
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Calendar, Ban } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ReservationStats {
  total: number;
  totalPlaces: number;
  confirmed: number;
  cancelled: number;
  presentLoved: number;
  presentPress: number;
  presentNeutral: number;
}

export interface StatsCardsProps {
  stats: ReservationStats;
  isExterne: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function StatsCards({ stats, isExterne }: StatsCardsProps) {
  // Calculs des pourcentages
  const confirmedPercent = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;
  
  const totalPresents = stats.presentLoved + stats.presentPress + stats.presentNeutral;
  const presentsPercent = stats.confirmed > 0 
    ? Math.round((totalPresents / stats.confirmed) * 100) 
    : 0;
  
  const cancelledPercent = stats.total > 0 
    ? Math.round((stats.cancelled / stats.total) * 100) 
    : 0;

  // Libellé adapté pour les externes
  const statsLabel = isExterne ? 'Vos réservations' : 'Total réservations';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Card Total */}
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
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xl md:text-2xl font-bold">{stats.confirmed}</span>
            <span className="text-xs text-green-600 font-medium">
              {confirmedPercent}%
            </span>
          </div>
          <Progress 
            value={confirmedPercent} 
            className="h-1.5 mt-2 bg-green-100 [&>div]:bg-green-500" 
          />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.confirmed} / {stats.total}
          </p>
        </CardContent>
      </Card>

      {/* Card Présents */}
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
            {totalPresents} / {stats.confirmed} confirmées
          </p>
        </CardContent>
      </Card>

      {/* Card Annulées */}
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
            Taux d&apos;annulation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
