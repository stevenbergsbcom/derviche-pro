import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icône à afficher */
  icon?: ReactNode;
  /** Titre du message */
  title: string;
  /** Description détaillée */
  description?: string;
  /** Texte du bouton d'action (optionnel) */
  actionLabel?: string;
  /** Callback du bouton d'action */
  onAction?: () => void;
}

/**
 * Composant pour afficher un état vide
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Calendar className="w-12 h-12" />}
 *   title="Aucun spectacle"
 *   description="Commencez par créer votre premier spectacle."
 *   actionLabel="Créer un spectacle"
 *   onAction={handleCreate}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="text-muted-foreground/50 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-derviche hover:bg-derviche-light text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
