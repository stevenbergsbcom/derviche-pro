/**
 * Onglets de filtrage À venir / Passés
 * Derviche Diffusion - PWA Check-in
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TabFiltersProps } from '../types';

/**
 * Onglets permettant de basculer entre spectacles à venir et passés
 */
export function TabFilters({
  activeTab,
  onTabChange,
  upcomingCount,
  pastCount,
}: TabFiltersProps) {
  return (
    <div className="px-4 pt-4">
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        aria-label="Filtrer les spectacles par période"
      >
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">
            À venir ({upcomingCount})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1">
            Passés ({pastCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
