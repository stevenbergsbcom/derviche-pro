/**
 * Composant RoleSummaryBadges - Résumé des compteurs par rôle
 * Derviche Diffusion
 */

import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2 } from 'lucide-react';
import type { RoleSummaryBadgesProps } from '../types';
import { ROLE_SUMMARY_BG_CLASSES } from '../constants';

export function RoleSummaryBadges({ counts }: RoleSummaryBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={ROLE_SUMMARY_BG_CLASSES['super-admin']}>
        <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
        {counts['super-admin']} Super Admin
      </Badge>
      <Badge variant="outline" className={ROLE_SUMMARY_BG_CLASSES['admin']}>
        <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
        {counts['admin']} Admin
      </Badge>
      <Badge variant="outline" className={ROLE_SUMMARY_BG_CLASSES['externe']}>
        <Users className="w-3 h-3 mr-1" aria-hidden="true" />
        {counts['externe']} Externe
      </Badge>
      <Badge variant="outline" className={ROLE_SUMMARY_BG_CLASSES['company']}>
        <Building2 className="w-3 h-3 mr-1" aria-hidden="true" />
        {counts['company']} Compagnie
      </Badge>
    </div>
  );
}
