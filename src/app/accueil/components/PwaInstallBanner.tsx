/**
 * PwaInstallBanner - Bannière d'invitation à installer la PWA
 * Derviche Diffusion - PWA Check-in
 *
 * Affichée uniquement si l'app n'est pas déjà installée (détection display-mode).
 * Instructions adaptées selon iOS (Safari) ou Android/Chrome.
 * Dismissable par l'utilisateur pour la session en cours.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Menu, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// TYPES
// ============================================

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

// ============================================
// HELPERS
// ============================================

/**
 * Détecte si l'app tourne déjà en mode standalone (PWA installée)
 */
function isInstalledAsPwa(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Détecte la plateforme de l'utilisateur
 */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isMobile = isIos || isAndroid;

  if (isIos) return 'ios';
  if (isAndroid) return 'android';
  if (!isMobile) return 'desktop';
  return 'unknown';
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Étape d'instruction avec icône et texte
 */
function InstallStep({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon
        aria-hidden="true"
        className="h-4 w-4 mt-0.5 shrink-0 text-derviche-dark"
      />
      <span>{text}</span>
    </li>
  );
}

/**
 * Bannière d'installation PWA
 * Rendue côté client uniquement (useEffect pour la détection navigateur)
 */
export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    // Ne pas afficher si déjà installée ou sur desktop
    const detected = detectPlatform();
    if (isInstalledAsPwa() || detected === 'desktop') return;

    setPlatform(detected);
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Installer l'application sur votre téléphone"
      className="mx-4 mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm"
    >
      {/* En-tête bannière */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">
          📲 Installer l&apos;app sur votre téléphone
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-blue-700 hover:bg-blue-100 -mt-0.5 -mr-1"
          onClick={() => setVisible(false)}
          aria-label="Fermer ce message"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions selon la plateforme */}
      <ul className="mt-2 space-y-1.5 text-blue-800">
        {platform === 'ios' && (
          <>
            <InstallStep
              icon={Share}
              text={
                <>
                  Appuyez sur l&apos;icône{' '}
                  <strong>Partager</strong>{' '}
                  en bas de Safari
                </>
              }
            />
            <InstallStep
              icon={PlusSquare}
              text={
                <>
                  Puis sur{' '}
                  <strong>&laquo;&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;&raquo;</strong>
                </>
              }
            />
          </>
        )}

        {platform === 'android' && (
          <>
            <InstallStep
              icon={Menu}
              text={
                <>
                  Appuyez sur le menu{' '}
                  <strong>⋮</strong>{' '}
                  en haut à droite de Chrome
                </>
              }
            />
            <InstallStep
              icon={Download}
              text={
                <>
                  Puis sur{' '}
                  <strong>&laquo;&nbsp;Installer l&apos;application&nbsp;&raquo;</strong>
                </>
              }
            />
          </>
        )}

        {platform === 'unknown' && (
          <InstallStep
            icon={Download}
            text={
              <>
                Utilisez le menu de votre navigateur pour{' '}
                <strong>ajouter à l&apos;écran d&apos;accueil</strong>
              </>
            }
          />
        )}
      </ul>
    </div>
  );
}
