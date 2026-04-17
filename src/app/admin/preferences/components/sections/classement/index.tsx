/**
 * ClassementSection — Onglet /admin/preferences?tab=classement
 * Derviche Diffusion — Migration 111
 *
 * Gère deux zones :
 *  1. Spectacles en vedette (slider HeroSection)
 *  2. Ordre global (catalogue + carousel page d'accueil)
 *
 * Save automatique après chaque action (drag / add / remove / input blur).
 * Pas de dirty tracking remonté au parent (no-op onDirtyChange).
 */

'use client';

import { useEffect, useMemo } from 'react';
import { ListOrdered } from 'lucide-react';
import { SettingsCard } from '../../shared/settings-card';
import { Separator } from '@/components/ui/separator';
import { useShowsRanking } from '@/hooks/useShowsRanking';
import { FeaturedZone } from './featured-zone';
import { GlobalOrderZone } from './global-order-zone';
import type { ClassementSectionProps } from './types';

export function ClassementSection({ canEdit, onDirtyChange }: ClassementSectionProps) {
  const {
    shows,
    featured,
    isLoading,
    setFeatured,
    setDisplayOrder,
    reorderAll,
    reorderFeatured,
    resetGlobalOrder,
  } = useShowsRanking();

  // Save auto → jamais dirty
  useEffect(() => {
    onDirtyChange(false);
  }, [onDirtyChange]);

  const nonFeatured = useMemo(
    () => shows.filter((s) => !s.isFeatured),
    [shows],
  );

  return (
    <SettingsCard
      icon={ListOrdered}
      title="Classement des spectacles"
      description="Définissez les spectacles mis en avant et l'ordre d'affichage dans le catalogue. Les modifications sont enregistrées automatiquement."
      isLoading={isLoading && shows.length === 0}
      canEdit={canEdit}
    >
      <div className="space-y-6">
        <FeaturedZone
          featured={featured}
          nonFeatured={nonFeatured}
          isLoading={isLoading}
          canEdit={canEdit}
          onSetFeatured={setFeatured}
          onReorderFeatured={reorderFeatured}
        />

        <Separator />

        <GlobalOrderZone
          shows={shows}
          isLoading={isLoading}
          canEdit={canEdit}
          onReorderAll={reorderAll}
          onSetDisplayOrder={setDisplayOrder}
          onResetGlobalOrder={resetGlobalOrder}
        />
      </div>
    </SettingsCard>
  );
}
