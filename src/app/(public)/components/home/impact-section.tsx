/**
 * ImpactSection — Section chiffres clés de la page d'accueil
 * Affiche les statistiques d'impact (nombre de spectacles, lieux, etc.).
 */

'use client';

import { Card } from '@/components/ui/card';
import type { HomepageImpact } from '@/lib/services/app-settings';

interface ImpactSectionProps {
  /** Paramètres impact depuis les settings admin */
  impact: HomepageImpact;
}

export function ImpactSection({ impact }: ImpactSectionProps) {
  if (!impact.enabled) return null;

  return (
    <section className="py-12 md:py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
          <div className="text-center md:text-left">
            <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
              {impact.label}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">
              {impact.title}
            </h2>
            {impact.description && (
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {impact.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {impact.stats.map((stat, index) => (
              <Card
                key={index}
                className="p-3 md:p-6 text-center hover:shadow-lg transition-shadow"
              >
                <p className="text-2xl md:text-4xl font-bold text-derviche mb-1 md:mb-2">
                  {stat.number}
                </p>
                <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">
                  {stat.label}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
