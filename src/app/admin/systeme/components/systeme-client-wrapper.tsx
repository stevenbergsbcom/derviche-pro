/**
 * Wrapper Client Component pour la page Système.
 * Nécessaire pour utiliser next/dynamic avec ssr: false
 * dans le App Router (interdit dans les Server Components).
 *
 * Derviche Diffusion
 */

'use client';

import dynamic from 'next/dynamic';

const SystemeContent = dynamic(
  () => import('./systeme-content').then(m => ({ default: m.SystemeContent })),
  { ssr: false }
);

export function SystemeClientWrapper() {
  return <SystemeContent />;
}
