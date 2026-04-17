/**
 * /admin/aide → redirect vers la page d'onboarding 101.
 * Derviche Diffusion — S197
 */

import { redirect } from 'next/navigation';

export default function AideIndexPage(): never {
  redirect('/admin/aide/101/bienvenue');
}
