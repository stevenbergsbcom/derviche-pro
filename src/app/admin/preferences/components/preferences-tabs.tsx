/**
 * PreferencesTabs - Navigation par onglets pour les préférences
 * Derviche Diffusion
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Building2, Mail, Bell, Shield, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export interface PreferenceTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

// ============================================
// CONSTANTS
// ============================================

export const PREFERENCE_TABS: PreferenceTab[] = [
  { id: 'organization', label: 'Organisation', icon: Building2 },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'reminders', label: 'Rappels', icon: Bell },
  { id: 'rgpd', label: 'RGPD', icon: Shield },
];

export const DEFAULT_TAB = 'organization';

// ============================================
// PROPS
// ============================================

interface PreferencesTabsProps {
  /** Onglet actif */
  activeTab: string;
  /** Callback de changement d'onglet */
  onTabChange: (tab: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function PreferencesTabs({ activeTab, onTabChange }: PreferencesTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
        {PREFERENCE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-2',
                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour gérer l'onglet actif via query params
 */
export function usePreferencesTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get('tab') || DEFAULT_TAB;

  const setActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return { activeTab, setActiveTab };
}
