/**
 * TopShowsCard - Admin Dashboard
 * Derviche Diffusion
 *
 * Top 3 spectacles par nombre de réservations confirmées.
 * Avec barre de progression relative au premier du classement.
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { TopShow } from '@/lib/services/admin-dashboard';

// ============================================
// HELPERS
// ============================================

const RANK_COLORS = ['text-gold', 'text-slate-400', 'text-amber-600'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

function getBarWidth(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  return Math.round((count / maxCount) * 100);
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface TopShowsCardProps {
  shows: TopShow[];
  isLoading: boolean;
}

export function TopShowsCard({ shows, isLoading }: TopShowsCardProps) {
  const maxCount = shows[0]?.reservations_count ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-gold" />
          Top spectacles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : shows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun spectacle avec des réservations
          </p>
        ) : (
          <div className="space-y-4">
            {shows.map((show, index) => (
              <div key={show.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-sm font-semibold shrink-0 ${RANK_COLORS[index] ?? ''}`}
                      aria-label={`Rang ${index + 1}`}
                    >
                      {RANK_LABELS[index]}
                    </span>
                    <Link
                      href={`/admin/spectacles`}
                      className="text-sm font-medium truncate hover:text-derviche transition-colors"
                      title={show.title}
                    >
                      {show.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {show.upcoming_slots_count > 0 && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        {show.upcoming_slots_count} créneau{show.upcoming_slots_count > 1 ? 'x' : ''}
                      </Badge>
                    )}
                    <span className="text-sm font-semibold text-derviche tabular-nums">
                      {show.reservations_count}
                    </span>
                  </div>
                </div>
                {/* Barre de progression relative */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-derviche transition-all duration-500"
                    style={{ width: `${getBarWidth(show.reservations_count, maxCount)}%` }}
                    role="progressbar"
                    aria-valuenow={show.reservations_count}
                    aria-valuemax={maxCount}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
