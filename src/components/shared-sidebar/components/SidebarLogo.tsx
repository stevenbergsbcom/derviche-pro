/**
 * Composant Logo pour la sidebar
 * Affiche le logo dynamique basé sur le thème ou les logos par défaut
 * @module shared-sidebar/components/SidebarLogo
 */

'use client';

import { memo, useEffect, useReducer, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarHeader, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { LOGO_PATH, LOGO_PATH_DARK, LOGO_DIMENSIONS, LOGO_ALT } from '../constants';
import type { SidebarLogoProps } from '../types';
import { onLogoChange } from '@/lib/theme';
import { getThemeSettings, getOrganizationSettings } from '@/lib/services/app-settings';

/**
 * Logo Derviche Diffusion pour la sidebar
 * Utilise le logo approprié (blanc ou sombre) selon la couleur réelle de la sidebar.
 * S'adapte au mode collapsed (affiche une version réduite centrée).
 *
 * Stratégie de sélection du logo :
 * On lit directement la variable CSS --sidebar pour détecter la luminosité réelle.
 * Cette approche est robuste : elle fonctionne quel que soit le thème configuré,
 * que les settings Supabase soient accessibles ou non (RLS bloquant pour les
 * rôles non-admin comme les professionnels), et avec les valeurs par défaut
 * de globals.css (sidebar bleue foncée = thème theatre).
 */
function SidebarLogoComponent({ baseHref, subtitle }: SidebarLogoProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Logos personnalisés et nom d'organisation depuis Supabase
  const [logoWhiteUrl, setLogoWhiteUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [themeResult, orgResult] = await Promise.all([
          getThemeSettings(),
          getOrganizationSettings(),
        ]);

        if (themeResult.data) {
          setLogoWhiteUrl(themeResult.data.logo_white_url);
          setLogoDarkUrl(themeResult.data.logo_dark_url);
        }

        if (orgResult.data) {
          setOrganizationName(orgResult.data.organization_name);
        }
      } catch (error) {
        console.error('Erreur chargement settings sidebar logo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();

    // Écouter les changements de logo depuis les préférences admin
    const unsubscribe = onLogoChange(() => {
      forceRender(); // Force re-render pour relire --sidebar
      void loadSettings();
    });

    return unsubscribe;
  }, []);

  /**
   * Détermine le logo à afficher en lisant directement la luminosité OKLCH
   * de la variable CSS --sidebar active dans le document.
   * Luminosité < 0.5 → sidebar sombre → logo blanc
   * Luminosité >= 0.5 → sidebar claire → logo noir
   */
  const getLogoPath = (): string => {
    if (typeof window !== 'undefined') {
      const sidebarBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar')
        .trim();

      const match = sidebarBg.match(/oklch\(([0-9.]+)/);
      if (match) {
        const lightness = parseFloat(match[1]);
        if (lightness < 0.5) {
          // Sidebar sombre → logo blanc
          return logoWhiteUrl || LOGO_PATH;
        }
        // Sidebar claire → logo noir
        return logoDarkUrl || LOGO_PATH_DARK;
      }
    }

    // Fallback SSR : globals.css définit une sidebar sombre par défaut
    return logoWhiteUrl || LOGO_PATH;
  };

  // Ne pas afficher de logo tant que les settings ne sont pas chargés
  // pour éviter le flash du mauvais logo
  const currentLogoPath = isLoading ? null : getLogoPath();
  const isExternalUrl = currentLogoPath?.startsWith('http') ?? false;

  // Alt text dynamique basé sur le nom de l'organisation
  const logoAltText = organizationName ? `Logo ${organizationName}` : LOGO_ALT;

  return (
    <SidebarHeader className="border-b border-sidebar-border p-2">
      <SidebarMenuButton
        asChild
        size="lg"
        className="h-auto w-full hover:bg-transparent"
        tooltip={subtitle}
      >
        <Link
          href={baseHref}
          className={`flex items-center justify-center ${isCollapsed ? 'p-0' : 'flex-col gap-1 py-2'}`}
        >
          {isCollapsed ? (
            // Version réduite centrée en mode collapsed
            <div className="flex size-8 items-center justify-center">
              {currentLogoPath && (
                <Image
                  src={currentLogoPath}
                  alt={logoAltText}
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                  priority
                  unoptimized={isExternalUrl}
                />
              )}
            </div>
          ) : (
            // Version complète en mode expanded
            <>
              <div className="flex h-14 items-center justify-center">
                {currentLogoPath && (
                  <Image
                    src={currentLogoPath}
                    alt={logoAltText}
                    width={LOGO_DIMENSIONS.width}
                    height={LOGO_DIMENSIONS.height}
                    className="max-h-14 w-auto object-contain"
                    priority
                    unoptimized={isExternalUrl}
                  />
                )}
              </div>
              <span className="text-xs font-medium text-sidebar-foreground/80">{subtitle}</span>
            </>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarHeader>
  );
}

SidebarLogoComponent.displayName = 'SidebarLogo';

export const SidebarLogo = memo(SidebarLogoComponent);
