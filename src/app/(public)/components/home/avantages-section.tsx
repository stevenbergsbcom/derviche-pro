/**
 * AvantagesSection — Section avantages de la page d'accueil
 * Affiche les cartes avantages avec icônes dynamiques.
 */

'use client';

import type { HomepageAvantages } from '@/lib/services/app-settings';
import { getIcon } from '../icon-map';

interface AvantagesSectionProps {
  /** Paramètres avantages depuis les settings admin */
  avantages: HomepageAvantages;
}

export function AvantagesSection({ avantages }: AvantagesSectionProps) {
  return (
    <section id="avantages" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
            {avantages.label}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-derviche-dark">
            {avantages.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {avantages.cards.map((card, index) => {
            const Icon = getIcon(card.icon);
            return (
              <div key={index} className="text-center p-4 md:p-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-derviche/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-derviche" />
                </div>
                <h3 className="font-semibold text-lg mb-2 md:mb-3 text-derviche-dark">
                  {card.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
