/**
 * PwaInstallBanner - Bannière d'invitation à installer la PWA
 * Derviche Diffusion - PWA Check-in
 *
 * Affichée uniquement si l'app n'est pas déjà installée (détection display-mode).
 * Instructions adaptées selon iOS (Safari) ou Android/Chrome.
 * Dismissable par l'utilisateur pour la session en cours.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Share, PlusSquare, Menu, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// TYPES
// ============================================

type Platform = 'ios-safari' | 'ios-chrome' | 'android' | 'desktop' | 'unknown';

// ============================================
// HELPERS
// ============================================

/** Clé sessionStorage pour persister le dismiss */
const SESSION_KEY = 'pwa-banner-dismissed';

/**
 * Détecte si l'app tourne déjà en mode installé (standalone, fullscreen ou minimal-ui)
 */
function isInstalledAsPwa(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  );
}

/**
 * Détecte la plateforme de l'utilisateur
 * Note : sur iOS, Chrome et tous les autres navigateurs tiers utilisent WebKit
 * et ne peuvent pas installer de PWA — seul Safari le permet.
 */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isMobile = isIos || isAndroid;
  // CriOS = Chrome sur iOS ; FxiOS = Firefox sur iOS
  const isIosNonSafari = isIos && /crios|fxios|opios|mercury/i.test(ua);

  if (isIos && isIosNonSafari) return 'ios-chrome';
  if (isIos) return 'ios-safari';
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
 * Bannière spécifique Chrome iOS — bouton "Copier le lien" pour ouvrir dans Safari
 */
function IosChromeBanner({ pwaUrl }: { pwaUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pwaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback si clipboard API indisponible
      const input = document.createElement('input');
      input.value = pwaUrl;
      document.body.appendChild(input);
      input.select();
      const success = document.execCommand('copy');
      document.body.removeChild(input);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [pwaUrl]);

  return (
    <>
      <InstallStep
        icon={Share}
        text={
          <>
            L&apos;installation n&apos;est possible que depuis{' '}
            <strong>Safari</strong> sur iPhone et iPad
          </>
        }
      />
      <InstallStep
        icon={PlusSquare}
        text={
          <>
            Copiez ce lien et ouvrez-le dans Safari :
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
              className="mt-2 flex items-center gap-2 h-9 w-full border-blue-300 bg-white text-blue-800 hover:bg-blue-50"
              aria-label="Copier le lien pour Safari"
            >
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="truncate text-xs">
                {copied ? 'Lien copié !' : pwaUrl}
              </span>
            </Button>
          </>
        }
      />
    </>
  );
}

/**
 * Bannière d'installation PWA
 * Rendue côté client uniquement (useEffect pour la détection navigateur)
 */
export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [pwaUrl, setPwaUrl] = useState('');

  useEffect(() => {
    // Ne pas afficher si déjà installée, sur desktop, ou déjà dismissée dans cette session
    const detected = detectPlatform();
    if (
      isInstalledAsPwa() ||
      detected === 'desktop' ||
      sessionStorage.getItem(SESSION_KEY) === '1'
    ) return;

    setPwaUrl(window.location.href);
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
          onClick={() => {
            sessionStorage.setItem(SESSION_KEY, '1');
            setVisible(false);
          }}
          aria-label="Fermer ce message"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions selon la plateforme */}
      <ul className="mt-2 space-y-1.5 text-blue-800">
        {platform === 'ios-safari' && (
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

        {platform === 'ios-chrome' && (
          <IosChromeBanner pwaUrl={pwaUrl} />
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
