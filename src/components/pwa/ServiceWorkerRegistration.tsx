/**
 * ServiceWorkerRegistration - Enregistre le Service Worker pour PWA
 * Derviche Diffusion
 */

'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Enregistrer le service worker uniquement en production ou sur Vercel
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (process.env.NODE_ENV === 'production' || 
       window.location.hostname.includes('vercel.app'))
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.info('Service Worker enregistré', { 
            scope: registration.scope 
          });
        })
        .catch((error) => {
          logger.error('Erreur enregistrement Service Worker', { error });
        });
    }
  }, []);

  return null;
}
