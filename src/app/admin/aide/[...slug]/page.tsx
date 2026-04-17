/**
 * /admin/aide/[...slug]
 * Derviche Diffusion — S197
 *
 * Server Component qui rend un article MDX par son slug.
 * Les pages sont pré-rendues via generateStaticParams — lecture disque
 * effectuée au build, zéro coût runtime.
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getAllArticles,
  getArticleBySlug,
  type HelpRole,
} from '@/lib/help/content-loader';
import { HelpArticle } from '../components/HelpArticle';
import { HelpBreadcrumb } from '../components/HelpBreadcrumb';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({
    slug: a.slug.split('/'),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug.join('/'));
  if (!article) {
    return { title: 'Aide — Article introuvable' };
  }
  return {
    title: `${article.title} — Aide Derviche Diffusion`,
    description: article.keywords.join(', '),
  };
}

export default async function AideArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const slugString = slug.join('/');
  const article = getArticleBySlug(slugString);

  if (!article) notFound();

  // Check rôle — redirect vers 101 si l'utilisateur n'a pas le droit de lire l'article
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnTo=/admin/aide');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const role = (roleData?.role ?? null) as HelpRole | null;
  if (!role || !article.roles.includes(role)) {
    redirect('/admin/aide/101/bienvenue');
  }

  return (
    <div className="space-y-4">
      <HelpBreadcrumb
        categoryLabel={article.categoryLabel}
        articleTitle={article.title}
      />
      <HelpArticle article={article} />
    </div>
  );
}
