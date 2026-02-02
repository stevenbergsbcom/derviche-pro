/**
 * SettingsCard - Composant Card réutilisable pour les sections de préférences
 * Derviche Diffusion
 */

'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// TYPES
// ============================================

interface SettingsCardProps {
  /** Icône de la section */
  icon: LucideIcon;
  /** Titre de la section */
  title: string;
  /** Description de la section */
  description: string;
  /** Contenu du formulaire */
  children: ReactNode;
  /** Chargement des données en cours */
  isLoading?: boolean;
  /** Sauvegarde en cours */
  isSaving?: boolean;
  /** L'utilisateur peut modifier */
  canEdit?: boolean;
  /** Il y a des modifications non sauvegardées */
  hasChanges?: boolean;
  /** Callback de soumission */
  onSubmit?: () => void;
  /** Message pour les utilisateurs en lecture seule */
  readOnlyMessage?: string;
}

// ============================================
// COMPONENT
// ============================================

export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  isLoading = false,
  isSaving = false,
  canEdit = true,
  hasChanges = false,
  onSubmit,
  readOnlyMessage = 'Seuls les super-administrateurs peuvent modifier ces paramètres.',
}: SettingsCardProps) {
  // État de chargement
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {children}

        {!canEdit && (
          <p className="text-sm text-muted-foreground italic">{readOnlyMessage}</p>
        )}
      </CardContent>

      {canEdit && onSubmit && (
        <CardFooter className="border-t pt-6">
          <Button type="button" onClick={onSubmit} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
