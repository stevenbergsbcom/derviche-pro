/**
 * HelpArticle — Rendu d'un article MDX
 * Derviche Diffusion — S197
 *
 * Server Component : compile le MDX avec next-mdx-remote/rsc, injecte les
 * composants custom (Callout, Kbd, etc.) et ajoute rehype-slug +
 * rehype-autolink-headings pour les ancres dans les titres.
 */

import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import { helpMdxComponents } from './mdx-components';
import type { HelpArticle as HelpArticleData } from '@/lib/help/content-loader';

interface HelpArticleProps {
  article: HelpArticleData;
}

export function HelpArticle({ article }: HelpArticleProps) {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-3xl prose-h1:mb-2 prose-h2:mt-8 prose-h2:text-xl prose-h3:mt-6 prose-h3:text-lg prose-a:text-derviche prose-a:font-medium hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm">
      <h1>{article.title}</h1>
      <MDXRemote
        source={article.source}
        components={helpMdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: 'wrap',
                  properties: { className: ['anchor-link'] },
                },
              ],
            ],
          },
        }}
      />
    </article>
  );
}
