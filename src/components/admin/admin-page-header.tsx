import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AdminPageHeaderProps {
  /** Titre de la page */
  title: string;
  /** Sous-titre optionnel */
  subtitle?: string;
  /** Texte du bouton d'action principal (optionnel) */
  actionLabel?: string;
  /** Callback du bouton d'action */
  onAction?: () => void;
  /** Icône personnalisée pour le bouton (défaut: Plus) */
  actionIcon?: ReactNode;
  /** Contenu additionnel à droite (ex: filtres) */
  children?: ReactNode;
}

/**
 * Header standardisé pour les pages admin
 * 
 * @example
 * ```tsx
 * <AdminPageHeader
 *   title="Gestion des Spectacles"
 *   actionLabel="Ajouter un spectacle"
 *   onAction={handleCreate}
 * />
 * ```
 */
export function AdminPageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {children}
        {actionLabel && onAction && (
          <Button
            className="bg-derviche hover:bg-derviche-light text-white w-full lg:w-auto"
            onClick={onAction}
          >
            {actionIcon || <Plus className="w-4 h-4 mr-2" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
