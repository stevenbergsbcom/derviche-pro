/**
 * Composant Logo pour la sidebar
 * Affiche le logo dynamique basé sur le thème ou les logos par défaut
 * @module shared-sidebar/components/SidebarLogo
 */

'use client';

import { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarHeader, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { LOGO_PATH, LOGO_PATH_DARK, LOGO_DIMENSIONS, LOGO_ALT } from '../constants';
import type { SidebarLogoProps } from '../types';
import { getCurrentTheme, onLogoChange } from '@/lib/theme';
import { getThemeSettings, getOrganizationSettings } from '@/lib/services/app-settings';

/**
 * Logo Derviche Diffusion pour la sidebar
 * Utilise le logo approprié (blanc ou sombre) selon le thème actif
 * S'adapte au mode collapsed (affiche une version réduite centrée)
 */
function SidebarLogoComponent({ baseHref, subtitle }: SidebarLogoProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // État pour les logos personnalisés, le thème et le nom de l'organisation
  const [logoWhiteUrl, setLogoWhiteUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);
  const [themePreset, setThemePreset] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les logos personnalisés, le thème et le nom de l'organisation
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
          setThemePreset(themeResult.data.theme_preset);
        }

        if (orgResult.data) {
          setOrganizationName(orgResult.data.organization_name);
        }
      } catch (error) {
        console.error('Erreur chargement settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Écouter les changements de logo depuis les préférences
    const unsubscribe = onLogoChange(() => {
      loadSettings();
    });

    return unsubscribe;
  }, []);

  // Déterminer le chemin du logo à utiliser
  const getLogoPath = (): string => {
    // Utiliser le thème chargé depuis les settings (pas le DOM)
    const themeId = themePreset || getCurrentTheme();

    // Seul le thème "theatre" a une sidebar foncée nécessitant le logo blanc
    // Tous les autres thèmes ont une sidebar claire et utilisent le logo noir
    if (themeId === 'theatre') {
      return logoWhiteUrl || LOGO_PATH;
    }

    return logoDarkUrl || LOGO_PATH_DARK;
  };

  // Ne pas afficher de logo tant que les settings ne sont pas chargés
  // pour éviter le flash du logo par défaut
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
