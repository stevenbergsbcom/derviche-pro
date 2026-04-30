/**
 * Page d'accueil — Server Component
 * Derviche Diffusion
 *
 * Fetch les paramètres homepage + organisation côté serveur,
 * puis délègue le rendu au composant client HomePageClient.
 */

import { getHomepageData } from '@/lib/services/homepage-settings.server';
import { HomePageClient } from './components';

/**
 * Revalidation ISR — la page est servie comme HTML statique (rapide)
 * mais re-générée en arrière-plan toutes les 60s. Ainsi les modifications
 * faites depuis Admin > Préférences > Page d'accueil sont visibles en
 * prod dans la minute, sans attendre un nouveau déploiement.
 */
export const revalidate = 60;

export default async function HomePage() {
  const { homepage, organization } = await getHomepageData();

  return <HomePageClient settings={homepage} organization={organization} />;
}
