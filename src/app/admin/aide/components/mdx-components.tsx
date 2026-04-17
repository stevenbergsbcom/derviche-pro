/**
 * Composants MDX custom pour /admin/aide
 * Derviche Diffusion — S197
 *
 * Mis à disposition des fichiers .mdx pour enrichir les articles :
 *  - <Callout type="tip|warning|info"> — encadrés colorés
 *  - <Kbd>Ctrl</Kbd> — touches clavier
 *  - <Screenshot src caption> — image avec légende (placeholder V1)
 *  - <RoleBadge role> — badge visuel pour indiquer le rôle requis
 */

import type { ReactNode } from 'react';
import Image from 'next/image';
import { Info, Lightbulb, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// CALLOUT
// ============================================

type CalloutType = 'tip' | 'warning' | 'info';

const CALLOUT_STYLES: Record<
  CalloutType,
  { container: string; icon: typeof Info; label: string }
> = {
  tip: {
    container: 'border-green-200 bg-green-50 text-green-900',
    icon: Lightbulb,
    label: 'Astuce',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
    label: 'Attention',
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: Info,
    label: 'Info',
  },
};

export function Callout({
  type = 'info',
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const style = CALLOUT_STYLES[type];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        'my-4 flex gap-3 rounded-md border-l-4 p-4 text-sm',
        style.container,
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <span className="font-semibold block mb-1">{style.label}</span>
        {children}
      </div>
    </div>
  );
}

// ============================================
// KBD — touches clavier
// ============================================

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 items-center rounded border border-muted-foreground/30 bg-muted px-1.5 font-mono text-xs text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

// ============================================
// SCREENSHOT (V1 : placeholder ; V2 : vraie image)
// ============================================

export function Screenshot({
  src,
  alt,
  caption,
  width = 800,
  height = 500,
}: {
  src?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  if (!src) {
    // Placeholder V1 — carré gris avec icône + caption
    return (
      <figure className="my-6 rounded-lg border border-dashed bg-muted/40 p-8 text-center">
        <ImageIcon
          className="mx-auto h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-2 text-xs italic text-muted-foreground">
          Capture d&apos;écran à venir
        </p>
        {caption && (
          <figcaption className="mt-2 text-sm text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg border shadow-sm"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ============================================
// ROLE BADGE
// ============================================

const ROLE_STYLES: Record<string, { label: string; classes: string }> = {
  'super-admin': {
    label: 'Super-admin',
    classes: 'bg-derviche text-white',
  },
  admin: { label: 'Admin', classes: 'bg-blue-100 text-blue-900' },
  externe: { label: 'Externe', classes: 'bg-purple-100 text-purple-900' },
};

export function RoleBadge({ role }: { role: keyof typeof ROLE_STYLES }) {
  const style = ROLE_STYLES[role] ?? { label: role, classes: 'bg-muted' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider',
        style.classes,
      )}
    >
      {style.label}
    </span>
  );
}

// ============================================
// Export consolidé pour le provider MDX
// ============================================

export const helpMdxComponents = {
  Callout,
  Kbd,
  Screenshot,
  RoleBadge,
};
