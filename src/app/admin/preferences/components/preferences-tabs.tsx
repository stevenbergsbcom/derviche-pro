/**
 * PreferencesTabs - Navigation par onglets pour les préférences
 * Derviche Diffusion
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Building2, Mail, Bell, CalendarClock, Shield, Palette, FileText } from 'lucide-react';
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
  status: 'active' | 'partial' | 'inactive';
  statusLabel: string;
}

// ============================================
// CONSTANTS
// ============================================

export const PREFERENCE_TABS: PreferenceTab[] = [
  { id: 'organization',  label: 'Organisation',  icon: Building2, status: 'partial',  statusLabel: 'Partiel' },
  { id: 'appearance',    label: 'Apparence',      icon: Palette,   status: 'active',   statusLabel: 'Actif' },
  { id: 'email',         label: 'Email',          icon: Mail,      status: 'active',   statusLabel: 'Actif' },
  { id: 'templates',     label: 'Templates',      icon: FileText,  status: 'active',   statusLabel: 'Actif' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,      status: 'active',   statusLabel: 'Actif' },
  { id: 'reminders',     label: 'Rappels',        icon: CalendarClock, status: 'active',   statusLabel: 'Actif' },
  { id: 'rgpd',          label: 'RGPD',           icon: Shield,    status: 'inactive', statusLabel: 'Non connecté' },
];

const STATUS_STYLES: Record<PreferenceTab['status'], string> = {
  active:   'bg-green-100 text-green-700',
  partial:  'bg-orange-100 text-orange-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export const DEFAULT_TAB = 'organization';

// ============================================
// PROPS
// ============================================

interface PreferencesTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function PreferencesTabs({ activeTab, onTabChange }: PreferencesTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {/* h-auto pour ne pas clipper les triggers flex-col à 2 lignes */}
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-0.5 p-1">
        {PREFERENCE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 h-auto cursor-pointer',
                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
              <span
                className={cn(
                  'hidden sm:inline-block rounded-full px-1.5 py-0 text-[10px] font-medium leading-4',
                  STATUS_STYLES[tab.status]
                )}
              >
                {tab.statusLabel}
              </span>
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

export function usePreferencesTab() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

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
