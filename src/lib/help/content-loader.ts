/**
 * Content loader — Documentation utilisateur admin (/admin/aide)
 * Derviche Diffusion — S197
 *
 * Lit tous les fichiers .mdx du répertoire `content/` à la racine
 * de la feature aide, parse leur frontmatter et expose :
 *  - `getAllArticles()` : tableau complet
 *  - `getArticleBySlug(slug)` : un article
 *  - `getCategoryTree()` : arbo groupée par catégorie (pour la sidebar)
 *
 * Utilisé UNIQUEMENT côté serveur (RSC + script de génération d'index).
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// ============================================
// TYPES
// ============================================

export type HelpRole = 'super-admin' | 'admin' | 'externe';

export interface HelpArticleFrontmatter {
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  keywords: string[];
  roles: HelpRole[];
  order: number;
}

export interface HelpArticle extends HelpArticleFrontmatter {
  /** Chemin relatif au dossier `content/` (ex. `101/bienvenue.mdx`). */
  filePath: string;
  /** Corps MDX brut (sans frontmatter). */
  source: string;
  /** Texte brut approximatif (utilisé pour l'index de recherche). */
  plainText: string;
}

export interface HelpCategory {
  category: string;
  label: string;
  icon: string;
  articles: HelpArticle[];
}

// ============================================
// RÉPERTOIRE DE CONTENU
// ============================================

// Chemin absolu depuis la racine du projet (compatible SSR + script Node)
const CONTENT_DIR = path.join(
  process.cwd(),
  'src',
  'app',
  'admin',
  'aide',
  'content',
);

// ============================================
// LECTURE DISQUE
// ============================================

function walkMdxFiles(dir: string, base: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMdxFiles(full, base));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function stripMdxToPlainText(source: string): string {
  return source
    // Retire les frontmatter éventuels restants (par sécurité)
    .replace(/^---[\s\S]*?---\s*/m, '')
    // Retire les blocs code fencés ```…```
    .replace(/```[\s\S]*?```/g, ' ')
    // Retire les balises JSX/MDX (<Callout>…</Callout>)
    .replace(/<[^>]+>/g, ' ')
    // Retire les liens markdown [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Retire les images ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Retire le code inline `…`
    .replace(/`([^`]+)`/g, '$1')
    // Retire les marqueurs gras ** ** et __ __
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Retire les marqueurs italique * * et _ _
    // (après le gras pour ne pas casser les paires)
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/(^|[^_])_([^_]+)_/g, '$1$2')
    // Retire les ~~barré~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Retire les chevrons de blockquote en début de ligne
    .replace(/^\s*>\s?/gm, '')
    // Retire les marqueurs de liste en début de ligne
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Retire les titres ## etc.
    .replace(/^#{1,6}\s+/gm, '')
    // Normalise les espaces
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// API PUBLIQUE
// ============================================

let cachedArticles: HelpArticle[] | null = null;

/** Charge tous les articles (cache mémoire — sûr en RSC, régénéré à chaque build). */
export function getAllArticles(): HelpArticle[] {
  if (cachedArticles) return cachedArticles;

  const files = walkMdxFiles(CONTENT_DIR);
  const articles: HelpArticle[] = files.map((relPath) => {
    const fullPath = path.join(CONTENT_DIR, relPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data as Partial<HelpArticleFrontmatter>;

    // Validation minimale — tout article manquant un champ est ignoré et loggé
    if (
      !fm.title ||
      !fm.slug ||
      !fm.category ||
      !fm.categoryLabel ||
      !fm.categoryIcon ||
      !Array.isArray(fm.keywords) ||
      !Array.isArray(fm.roles) ||
      typeof fm.order !== 'number'
    ) {
      console.warn(`[help/content-loader] Frontmatter invalide dans ${relPath}`);
      return null as unknown as HelpArticle;
    }

    return {
      title: fm.title,
      slug: fm.slug,
      // Forcé en string — YAML peut parser « 101 » sans quotes comme number,
      // ce qui casserait l'indexOf sur CATEGORY_ORDER (recherche de string).
      category: String(fm.category),
      categoryLabel: fm.categoryLabel,
      categoryIcon: fm.categoryIcon,
      keywords: fm.keywords,
      roles: fm.roles,
      order: fm.order,
      filePath: relPath,
      source: parsed.content,
      plainText: stripMdxToPlainText(parsed.content),
    };
  }).filter(Boolean) as HelpArticle[];

  // Tri par catégorie puis par `order`
  articles.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.order - b.order;
  });

  cachedArticles = articles;
  return articles;
}

/** Récupère un article par son slug (ex. `reservations/creer`). */
export function getArticleBySlug(slug: string): HelpArticle | null {
  return getAllArticles().find((a) => a.slug === slug) ?? null;
}

/**
 * Arborescence groupée par catégorie (pour la sidebar TOC).
 * L'ordre des catégories suit le `order` du premier article de chaque groupe.
 */
export function getCategoryTree(): HelpCategory[] {
  const all = getAllArticles();
  const map = new Map<string, HelpCategory>();

  for (const article of all) {
    const existing = map.get(article.category);
    if (existing) {
      existing.articles.push(article);
    } else {
      map.set(article.category, {
        category: article.category,
        label: article.categoryLabel,
        icon: article.categoryIcon,
        articles: [article],
      });
    }
  }

  // Ordre des catégories selon la convention — définie en dur pour un résultat
  // déterministe (sinon ordre d'apparition disque, fragile).
  const CATEGORY_ORDER = [
    '101',
    'reservations',
    'spectacles',
    'representations',
    'checkin-pwa',
    'statistiques',
    'emails',
    'notifications',
    'professionnels',
    'compagnies',
    'lieux',
    'utilisateurs',
    'preferences',
    'systeme',
    'mon-compte',
    'faq',
  ];

  return Array.from(map.values()).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    // Les catégories non listées explicitement vont en fin
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/** Filtre un tableau d'articles selon le rôle de l'utilisateur. */
export function filterArticlesByRole(
  articles: HelpArticle[],
  role: HelpRole | null,
): HelpArticle[] {
  if (!role) return [];
  return articles.filter((a) => a.roles.includes(role));
}

/** Idem pour l'arborescence catégorie (filtre les articles puis retire les catégories vides). */
export function filterCategoryTreeByRole(
  tree: HelpCategory[],
  role: HelpRole | null,
): HelpCategory[] {
  if (!role) return [];
  return tree
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter((a) => a.roles.includes(role)),
    }))
    .filter((cat) => cat.articles.length > 0);
}
