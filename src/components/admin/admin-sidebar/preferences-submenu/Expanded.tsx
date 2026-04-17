/**
 * PreferencesSubmenu — mode sidebar expanded
 * Derviche Diffusion
 *
 * Rendu avec `Collapsible` + `SidebarMenuSub` :
 *  - trigger = row "Préférences" avec icône + chevron
 *  - cliquer le trigger : toggle du sous-menu ET navigation vers DEFAULT_TAB
 *  - contenu = 11 sous-items (un par onglet preferences)
 *
 * Auto-ouverture quand on est sur `/admin/preferences/*`.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, Settings } from 'lucide-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ConfirmableNavLink } from '@/components/admin/preferences-dirty';
import { PREFERENCE_TABS, DEFAULT_TAB } from '@/app/admin/preferences/config/preference-tabs';
import { getActiveTabId, hrefForTab, isOnPrefsPath } from './helpers';

export function PreferencesSubmenuExpanded() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onPrefs = isOnPrefsPath(pathname);
  const activeTabId = getActiveTabId(searchParams);

  // Auto-ouverture quand on est dans /admin/preferences/*
  const [open, setOpen] = useState<boolean>(onPrefs);
  useEffect(() => {
    if (onPrefs) setOpen(true);
  }, [onPrefs]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/prefs">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={onPrefs} tooltip="Préférences" asChild>
            <ConfirmableNavLink href={hrefForTab(DEFAULT_TAB)}>
              <Settings aria-hidden="true" className="size-4" />
              <span>Préférences</span>
              <ChevronRight
                aria-hidden="true"
                className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/prefs:rotate-90"
              />
            </ConfirmableNavLink>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {PREFERENCE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = onPrefs && activeTabId === tab.id;
              return (
                <SidebarMenuSubItem key={tab.id}>
                  <SidebarMenuSubButton isActive={isActive} asChild>
                    <ConfirmableNavLink
                      href={hrefForTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon aria-hidden="true" className="size-3.5" />
                      <span>{tab.label}</span>
                    </ConfirmableNavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
