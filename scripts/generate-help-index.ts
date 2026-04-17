/**
 * Script de génération de l'index de recherche pour /admin/aide
 * Derviche Diffusion — S197
 *
 * Exécuté au build (prébuild). Lit tous les articles MDX,
 * produit `public/help-index.json` consommé par Fuse.js côté client.
 *
 * Structure du JSON généré :
 *   {
 *     generatedAt: string (ISO),
 *     count: number,
 *     articles: Array<{
 *       slug, title, category, categoryLabel, roles, keywords, excerpt
 *     }>
 *   }
 *
 * Tourne en mode ESM via tsx (cf. package.json).
 */

import fs from 'node:fs';
import path from 'node:path';
import { getAllArticles } from '../src/lib/help/content-loader';

const OUTPUT = path.join(process.cwd(), 'public', 'help-index.json');

function main(): void {
  const articles = getAllArticles();

  const payload = {
    generatedAt: new Date().toISOString(),
    count: articles.length,
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      categoryLabel: a.categoryLabel,
      roles: a.roles,
      keywords: a.keywords,
      // Excerpt = 240 premiers caractères du texte brut
      excerpt: a.plainText.slice(0, 240),
      // Texte complet pour la pertinence recherche (peut être lourd si corpus
      // grossit — on truncate à 2000 chars par article)
      body: a.plainText.slice(0, 2000),
    })),
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2), 'utf8');

  console.log(
    `[generate-help-index] ${articles.length} article(s) indexé(s) → ${path.relative(process.cwd(), OUTPUT)}`,
  );
}

main();
