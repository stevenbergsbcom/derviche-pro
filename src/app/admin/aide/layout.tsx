/**
 * Layout /admin/aide
 * Derviche Diffusion — S197
 *
 * Server Component : charge l'arbo des articles filtrée par rôle puis rend
 * le shell (barre de recherche + sidebar + contenu).
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getCategoryTree,
  filterCategoryTreeByRole,
  type HelpRole,
} from '@/lib/help/content-loader';
import { HelpSidebar } from './components/HelpSidebar';
import { HelpSearch } from './components/HelpSearch';

export default async function AideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/admin/aide');
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const role = (roleData?.role ?? null) as HelpRole | null;
  const tree = filterCategoryTreeByRole(getCategoryTree(), role);

  return (
    <div className="space-y-4">
      {/* Header : titre + recherche */}
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-derviche-dark">
            Aide &amp; documentation
          </h1>
          <p className="text-sm text-muted-foreground">
            Trouvez comment utiliser chaque fonctionnalité de la plateforme.
          </p>
        </div>
        <HelpSearch />
      </div>

      {/* Layout sidebar + contenu */}
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <HelpSidebar tree={tree} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
