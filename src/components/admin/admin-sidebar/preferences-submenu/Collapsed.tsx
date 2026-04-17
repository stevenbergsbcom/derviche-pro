/**
 * PreferencesSubmenu — mode sidebar icon-only
 * Derviche Diffusion
 *
 * shadcn `SidebarMenuSub` est masqué en mode icon-only (classe CSS
 * `group-data-[collapsible=icon]:hidden`). On utilise un `DropdownMenu` qui
 * s'ouvre à droite de l'icône.
 */

'use client';

import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { usePreferencesDirty } from '@/components/admin/preferences-dirty';
import { PREFERENCE_TABS } from '@/app/admin/preferences/config/preference-tabs';
import { hrefForTab, isOnPrefsPath } from './helpers';

export function PreferencesSubmenuCollapsed() {
  const pathname = usePathname();
  const onPrefs = isOnPrefsPath(pathname);
  const { requestNavigation } = usePreferencesDirty();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton isActive={onPrefs} tooltip="Préférences">
            <Settings aria-hidden="true" className="size-4" />
            <span>Préférences</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel>Préférences</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PREFERENCE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <DropdownMenuItem
                key={tab.id}
                onSelect={() => requestNavigation(hrefForTab(tab.id))}
                className="cursor-pointer"
              >
                <Icon aria-hidden="true" className="size-4 mr-2" />
                {tab.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
