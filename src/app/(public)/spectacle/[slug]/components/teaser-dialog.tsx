/**
 * Teaser vidéo — bouton + modale d'embed (YouTube / Vimeo)
 * Derviche Diffusion — Page spectacle publique
 *
 * - Bouton « Voir le teaser » inséré dans le hero (overlay bas-droite).
 * - Modale shadcn Dialog contenant l'iframe en 16:9 (pas d'autoplay).
 * - Fallback permissif : si l'URL n'est ni YouTube ni Vimeo mais reste sûre
 *   (http/https), le bouton ouvre l'URL dans un nouvel onglet au lieu de la modale.
 * - URL dangereuse (javascript:, etc.) : le composant ne rend rien.
 */

'use client';

import { useMemo, useState } from 'react';
import { Play, X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isSafeUrl } from '@/lib/services/email/html-helpers';
import { parseVideoEmbed, type VideoEmbed } from '@/lib/video-embed';

// ============================================
// DIALOG
// ============================================

interface TeaserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embed: VideoEmbed;
  showTitle: string;
}

export function TeaserDialog({ open, onOpenChange, embed, showTitle }: TeaserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden bg-black border-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Teaser — {showTitle}</DialogTitle>
          <DialogDescription>Lecteur vidéo du teaser du spectacle.</DialogDescription>
        </DialogHeader>

        {/* Bouton fermer custom : blanc sur fond noir + libellé FR accessible */}
        <DialogClose
          className="absolute top-3 right-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors cursor-pointer"
          aria-label="Fermer la fenêtre du teaser"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogClose>

        <div className="relative aspect-video w-full">
          {open && (
            <iframe
              src={embed.embedUrl}
              title={`Teaser — ${showTitle}`}
              className="absolute inset-0 h-full w-full"
              // Note : pas de `sandbox` — YouTube/Vimeo requièrent l'accès natif au player
              // (scripts, same-origin, popups pour fullscreen). L'URL d'embed est reconstruite
              // depuis un ID validé par regex, donc pas d'URL brute injectée.
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// TRIGGER + DIALOG COMBINÉS
// ============================================

interface TeaserButtonWithDialogProps {
  teaserUrl: string;
  showTitle: string;
}

/**
 * Rend le bouton « Voir le teaser » et, si l'URL est une vidéo reconnue,
 * la modale associée. Sinon fallback sur un lien externe.
 * Retourne `null` si l'URL n'est pas sûre (ex. `javascript:`).
 */
export function TeaserButtonWithDialog({ teaserUrl, showTitle }: TeaserButtonWithDialogProps) {
  const [open, setOpen] = useState(false);
  const embed = useMemo(() => parseVideoEmbed(teaserUrl), [teaserUrl]);

  // URL dangereuse → on masque le bouton (sécurité).
  if (!embed && !isSafeUrl(teaserUrl)) return null;

  const buttonClasses =
    'inline-flex items-center gap-2 rounded-full bg-white/90 hover:bg-white text-derviche-dark px-4 py-2 text-sm font-semibold shadow-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-derviche';

  // Fallback : URL sûre mais non reconnue (ni YouTube ni Vimeo) → ouvre l'URL en nouvel onglet.
  if (!embed) {
    return (
      <a
        href={teaserUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
        aria-label={`Voir le teaser de ${showTitle} (nouvel onglet)`}
      >
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        <span>Voir le teaser</span>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses}
        aria-label={`Voir le teaser de ${showTitle}`}
      >
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        <span>Voir le teaser</span>
      </button>
      <TeaserDialog
        open={open}
        onOpenChange={setOpen}
        embed={embed}
        showTitle={showTitle}
      />
    </>
  );
}
