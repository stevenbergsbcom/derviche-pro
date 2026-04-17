/**
 * HelpSidebar — TOC catégorisée des articles
 * Derviche Diffusion — S197
 *
 * Server Component qui lit le contenu MDX + filtre par rôle et rend une
 * arbo de catégories avec leurs articles. L'article actif est surligné
 * côté client via un sous-composant.
 */

import Link from 'next/link';
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  CheckSquare,
  FileText,
  HelpCircle,
  Home,
  ListOrdered,
  Mail,
  MapPin,
  Rocket,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { HelpCategory } from '@/lib/help/content-loader';
import { cn } from '@/lib/utils';

// Map icon name (string en frontmatter) → composant Lucide.
// Éviter import dynamique côté client : on maintient une whitelist.
const ICON_MAP: Record<string, LucideIcon> = {
  Rocket,
  Calendar,
  CalendarClock,
  CheckSquare,
  FileText,
  HelpCircle,
  Home,
  ListOrdered,
  Mail,
  MapPin,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  BookOpen,
  Building2,
};

interface HelpSidebarProps {
  tree: HelpCategory[];
  /** Slug de l'article actif (ex. `reservations/creer`). */
  activeSlug?: string;
}

export function HelpSidebar({ tree, activeSlug }: HelpSidebarProps) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Table des matières de l'aide">
      {tree.map((cat) => {
        const Icon = ICON_MAP[cat.icon] ?? BookOpen;
        return (
          <div key={cat.category}>
            <h3 className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {cat.label}
            </h3>
            <ul className="flex flex-col">
              {cat.articles.map((article) => {
                const isActive = article.slug === activeSlug;
                return (
                  <li key={article.slug}>
                    <Link
                      href={`/admin/aide/${article.slug}`}
                      className={cn(
                        'block rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {article.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
