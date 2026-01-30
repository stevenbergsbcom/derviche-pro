/**
 * StatCard - Carte de statistique
 * Derviche Diffusion
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { StatCardProps } from '../types';

/**
 * Carte affichant une statistique avec icône et tendance optionnelle
 */
function StatCardComponent({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp aria-hidden="true" className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">+{trend.value}</span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

StatCardComponent.displayName = 'StatCard';

export const StatCard = memo(StatCardComponent);
