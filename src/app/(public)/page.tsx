/**
 * Page d'accueil — Server Component
 * Derviche Diffusion
 *
 * Fetch les paramètres homepage + organisation côté serveur,
 * puis délègue le rendu au composant client HomePageClient.
 */

import { getHomepageData } from '@/lib/services/homepage-settings.server';
import { HomePageClient } from './components';

export default async function HomePage() {
  const { homepage, organization } = await getHomepageData();

  return <HomePageClient settings={homepage} organization={organization} />;
}
