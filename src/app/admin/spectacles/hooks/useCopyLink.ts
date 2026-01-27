/**
 * Hook pour gérer la copie de liens avec feedback visuel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { COPY_FEEDBACK_DURATION } from '../constants';
import { getShowUrl } from '../helpers';
import { logger } from '@/lib/logger';

interface UseCopyLinkReturn {
  /** ID du spectacle dont le lien vient d'être copié (pour feedback visuel) */
  copiedShowId: string | null;
  /** Message d'erreur si la copie a échoué */
  copyError: string | null;
  /** Copier le lien d'un spectacle */
  copyLink: (show: { id: string; slug: string }) => Promise<void>;
  /** Effacer l'erreur de copie */
  clearCopyError: () => void;
}

/**
 * Hook pour gérer la copie de liens avec feedback visuel temporaire
 */
export function useCopyLink(): UseCopyLinkReturn {
  const [copiedShowId, setCopiedShowId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup des timeouts lors du démontage
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const clearCopyError = useCallback(() => {
    setCopyError(null);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const copyLink = useCallback(async (show: { id: string; slug: string }) => {
    const url = getShowUrl(show.slug);
    
    // Effacer les erreurs précédentes
    clearCopyError();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShowId(show.id);
      
      // Nettoyer le timeout précédent si existant
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Réinitialiser après le délai
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedShowId(null);
        copyTimeoutRef.current = null;
      }, COPY_FEEDBACK_DURATION);
    } catch (err) {
      logger.error('Erreur lors de la copie du lien', { error: err, showId: show.id });
      
      // Afficher une erreur à l'utilisateur
      setCopyError('Impossible de copier le lien. Veuillez réessayer ou copier manuellement l\'URL.');
      
      // Effacer l'erreur après un délai plus long
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setCopyError(null);
        errorTimeoutRef.current = null;
      }, COPY_FEEDBACK_DURATION * 2); // 4 secondes pour les erreurs
    }
  }, [clearCopyError]);

  return {
    copiedShowId,
    copyError,
    copyLink,
    clearCopyError,
  };
}
