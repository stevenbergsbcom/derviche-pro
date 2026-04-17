/**
 * Parseur d'URLs vidéo YouTube / Vimeo → URL d'embed sécurisée.
 * @module lib/video-embed
 *
 * Utilisé par la modale teaser de la fiche spectacle publique.
 * Accepte les formats courants :
 *  - YouTube : youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
 *              youtube.com/shorts/ID, youtube-nocookie.com/embed/ID
 *  - Vimeo   : vimeo.com/ID, player.vimeo.com/video/ID
 *
 * Sécurité : on extrait uniquement l'ID via regex stricte et on reconstruit
 * l'URL d'embed depuis zéro. L'URL brute n'est jamais injectée dans l'iframe.
 */

import { isSafeUrl } from '@/lib/services/email/html-helpers';

export type VideoProvider = 'youtube' | 'vimeo';

export interface VideoEmbed {
  provider: VideoProvider;
  videoId: string;
  /** URL prête à être injectée dans un iframe (autoplay OFF). */
  embedUrl: string;
}

/** ID YouTube : 11 caractères alphanum + `_` + `-`. */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** ID Vimeo : suite de chiffres. */
const VIMEO_ID_PATTERN = /^\d+$/;

/**
 * Hash Vimeo (vidéos unlisted / privées) : alphanum, longueur typique 10.
 * On reste tolérant (4 à 32) pour couvrir d'éventuels formats futurs.
 */
const VIMEO_HASH_PATTERN = /^[A-Za-z0-9]{4,32}$/;

interface VimeoIdentity {
  id: string;
  /** Hash optionnel (unlisted / privé). */
  hash?: string;
}

/**
 * Extrait un ID YouTube d'une URL déjà parsée.
 * Retourne null si le format n'est pas reconnu.
 */
function extractYoutubeId(parsed: URL): string | null {
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  // youtu.be/{ID}
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0] ?? '';
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  // youtube.com/* ou youtube-nocookie.com/*
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // /watch?v=ID
    const v = parsed.searchParams.get('v');
    if (v && YOUTUBE_ID_PATTERN.test(v)) return v;

    // /embed/ID ou /shorts/ID ou /v/ID
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const [prefix, id] = segments;
      if ((prefix === 'embed' || prefix === 'shorts' || prefix === 'v') && id) {
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
    }
  }

  return null;
}

/**
 * Extrait un ID Vimeo (et un hash éventuel pour les vidéos unlisted/privées).
 * Sources de hash supportées :
 *   - path `vimeo.com/{ID}/{HASH}`
 *   - query `?h={HASH}` (sur vimeo.com ou player.vimeo.com)
 */
function extractVimeoIdentity(parsed: URL): VimeoIdentity | null {
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  let id: string | undefined;
  let pathHash: string | undefined;

  if (host === 'vimeo.com') {
    // vimeo.com/{ID} ou vimeo.com/{ID}/{HASH}
    id = segments[0];
    pathHash = segments[1];
  } else if (host === 'player.vimeo.com' && segments[0] === 'video') {
    // player.vimeo.com/video/{ID} ou .../video/{ID}/{HASH}
    id = segments[1];
    pathHash = segments[2];
  }

  if (!id || !VIMEO_ID_PATTERN.test(id)) return null;

  const queryHash = parsed.searchParams.get('h') ?? undefined;
  const rawHash = pathHash ?? queryHash;
  const hash = rawHash && VIMEO_HASH_PATTERN.test(rawHash) ? rawHash : undefined;

  return hash ? { id, hash } : { id };
}

/**
 * Détecte YouTube / Vimeo et retourne l'URL d'embed.
 * Retourne `null` si l'URL n'est pas reconnue ou non sûre.
 */
export function parseVideoEmbed(rawUrl: string | null | undefined): VideoEmbed | null {
  if (!isSafeUrl(rawUrl)) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const youtubeId = extractYoutubeId(parsed);
  if (youtubeId) {
    return {
      provider: 'youtube',
      videoId: youtubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
    };
  }

  const vimeo = extractVimeoIdentity(parsed);
  if (vimeo) {
    const hashPrefix = vimeo.hash ? `h=${vimeo.hash}&` : '';
    return {
      provider: 'vimeo',
      videoId: vimeo.id,
      embedUrl: `https://player.vimeo.com/video/${vimeo.id}?${hashPrefix}title=0&byline=0&portrait=0`,
    };
  }

  return null;
}
