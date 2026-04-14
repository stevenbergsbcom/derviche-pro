/**
 * Footer — Composant réutilisable
 * Derviche Diffusion
 *
 * Accepte des props optionnelles `settings` (HomepageFooter) et `organization`.
 * Sans props, les données sont chargées automatiquement depuis app_settings (DB).
 * Le logo blanc est toujours chargé dynamiquement depuis les paramètres Apparence.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram } from 'lucide-react';
import {
  getThemeSettings,
  getHomepageSettings,
  getOrganizationSettings,
} from '@/lib/services/app-settings';
import type { HomepageFooter, OrganizationSettings } from '@/lib/services/app-settings';

// ============================================
// TYPES
// ============================================

interface FooterProps {
  settings?: HomepageFooter;
  organization?: OrganizationSettings;
}

// ============================================
// DEFAULTS (valeurs hardcodées d'origine, rétro-compatibilité)
// ============================================

const DEFAULT_LOGO = '/images/logos/logo-derviche-blanc-transparent.png';
const DEFAULT_DESCRIPTION =
  'Agence de production et de diffusion de spectacles vivants depuis 2016. Nous accompagnons les compagnies artistiques et les professionnel·le·s.';
const DEFAULT_FACEBOOK = 'https://www.facebook.com/Derviche-Diffusion-104081770023884';
const DEFAULT_INSTAGRAM = 'https://www.instagram.com/dervichediffusion/';
const DEFAULT_EMAIL = 'derviche@dervichediffusion.com';
const DEFAULT_ADDRESS = '13, rue de Cotte - 75012 Paris';

// ============================================
// COMPONENT
// ============================================

export function Footer({ settings, organization }: FooterProps = {}) {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [fetchedSettings, setFetchedSettings] = useState<HomepageFooter | null>(null);
  const [fetchedOrg, setFetchedOrg] = useState<OrganizationSettings | null>(null);

  // Charger le logo + données footer/organisation depuis app_settings
  // Si les props sont fournies (homepage), on ne re-fetch pas ces données.
  useEffect(() => {
    const loadData = async () => {
      try {
        // Logo blanc (toujours chargé dynamiquement)
        const themeResult = await getThemeSettings();
        if (themeResult.data?.logo_white_url) {
          setLogoUrl(themeResult.data.logo_white_url);
        }

        // Footer settings (si pas fournis en props)
        if (!settings) {
          const hpResult = await getHomepageSettings();
          if (hpResult.data?.homepage_footer) {
            setFetchedSettings(hpResult.data.homepage_footer);
          }
        }

        // Organisation (si pas fournie en props)
        if (!organization) {
          const orgResult = await getOrganizationSettings();
          if (orgResult.data) {
            setFetchedOrg(orgResult.data);
          }
        }
      } catch {
        // Fallback silencieux sur les valeurs par défaut
      }
    };
    void loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Résolution : props > données DB > defaults hardcodés
  const effectiveSettings = settings || fetchedSettings;
  const effectiveOrg = organization || fetchedOrg;

  const description = effectiveSettings?.description || DEFAULT_DESCRIPTION;
  const facebookUrl = effectiveSettings?.facebook_url || DEFAULT_FACEBOOK;
  const instagramUrl = effectiveSettings?.instagram_url || DEFAULT_INSTAGRAM;
  const copyrightText = effectiveSettings?.copyright_text
    ? effectiveSettings.copyright_text.replace('{year}', String(new Date().getFullYear()))
    : `© ${new Date().getFullYear()} Derviche Diffusion. Tous droits réservés.`;
  const email = effectiveOrg?.organization_contact_email || DEFAULT_EMAIL;
  const address = effectiveOrg?.organization_address
    ? effectiveOrg.organization_address.replace(/\n/g, ' - ')
    : DEFAULT_ADDRESS;

  return (
    <footer className="py-10 md:py-12 bg-derviche-dark text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Info */}
          <div className="sm:col-span-2 text-center md:text-left">
            <Image
              src={logoUrl}
              alt="Derviche Diffusion"
              width={280}
              height={110}
              className="h-28 md:h-20 w-auto mb-4 mx-auto md:mx-0"
            />
            <p className="text-white/70 text-sm mb-4 max-w-sm mx-auto md:mx-0">
              {description}
            </p>
            <div className="flex gap-6 justify-center md:justify-start">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-gold transition"
                >
                  <Facebook className="w-9 h-9 md:w-6 md:h-6" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-gold transition"
                >
                  <Instagram className="w-9 h-9 md:w-6 md:h-6" />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4 text-gold">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalogue" className="text-white/70 hover:text-white transition">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-white/70 hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-white/70 hover:text-white transition">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4 text-gold">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-white/70 hover:text-white transition">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-white/70 hover:text-white transition">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="text-white/70 hover:text-white transition">
                  CGU
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50 text-center md:text-left">
          <p>{copyrightText}</p>
          <p>
            {address} |
            <a href={`mailto:${email}`} className="hover:text-white transition ml-1">
              {email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
