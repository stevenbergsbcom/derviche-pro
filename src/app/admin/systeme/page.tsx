/**
 * Page Admin — Système
 * /admin/systeme
 *
 * Server Component minimal — délègue au wrapper client
 * pour contourner la restriction ssr:false dans le App Router.
 *
 * Derviche Diffusion
 */

import { SystemeClientWrapper } from './components/systeme-client-wrapper';

export default function AdminSystemePage() {
  return <SystemeClientWrapper />;
}
