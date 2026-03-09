/**
 * Page Admin — Système
 * /admin/systeme
 *
 * Monitoring technique réservé au super-admin :
 *   - Widget quota Resend (emails du mois / limite du plan)
 *   - Journal des logs système (emails, Calendar, erreurs)
 *
 * Derviche Diffusion
 */

import { SystemeContent } from './components/systeme-content';

export default function AdminSystemePage() {
  return <SystemeContent />;
}
