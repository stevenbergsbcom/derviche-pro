/**
 * Helper — Copie d'email + toast UX
 * Derviche Diffusion
 *
 * À utiliser en complément (et non en remplacement) du `href="mailto:..."`
 * sur les liens « envoyer un email ». Pourquoi :
 *
 * Sur Chrome desktop notamment, si l'utilisateur n'a pas de gestionnaire
 * `mailto:` configuré au niveau de l'OS / du navigateur (Mail.app, Outlook,
 * Gmail handler, etc.), le clic sur un `<a href="mailto:...">` est
 * silencieusement ignoré → "rien ne se passe".
 *
 * En attachant cette fonction au `onClick` du même `<a>`, on garantit que :
 *   - Si l'OS a un handler → le client mail s'ouvre (comportement natif),
 *     ET l'email est aussi copié dans le presse-papier en bonus.
 *   - Si l'OS n'a PAS de handler → rien ne s'ouvre côté mail, mais
 *     l'utilisateur a au moins l'email copié + un toast l'informe.
 *
 * Le toast sert aussi de confirmation visuelle dans tous les cas.
 *
 * Sécurité : `navigator.clipboard.writeText` nécessite un contexte sécurisé
 * (HTTPS ou localhost). En dev local et en prod HTTPS, c'est garanti.
 */

import { toast } from 'sonner';

/**
 * Copie l'email passé dans le presse-papier puis affiche un toast.
 * À utiliser dans un `onClick` sans `preventDefault` (laisser le browser
 * traiter le `href="mailto:..."` en parallèle).
 *
 * @example
 *   <a href={`mailto:${email}`} onClick={() => void copyEmailWithToast(email)}>
 *     {email}
 *   </a>
 */
export async function copyEmailWithToast(email: string): Promise<void> {
  if (!email) return;
  try {
    await navigator.clipboard.writeText(email);
    toast.success('Email copié dans le presse-papier', {
      description: email,
    });
  } catch {
    // Échec rare (contexte non sécurisé, focus perdu, etc.)
    toast.error("Impossible de copier l'email", {
      description: email,
    });
  }
}
