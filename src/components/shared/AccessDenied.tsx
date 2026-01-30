/**
 * Composant d'erreur d'accès partagé
 * @module shared/AccessDenied
 */

'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  /** Message d'erreur à afficher */
  message: string;
  /** Titre de l'erreur (par défaut: "Accès refusé") */
  title?: string;
  /** URL de redirection pour le bouton retour (par défaut: "/") */
  returnUrl?: string;
  /** Label du bouton retour (par défaut: "Retour à l'accueil") */
  returnLabel?: string;
}

/**
 * Écran d'erreur d'accès plein page
 * Utilisé quand un utilisateur n'a pas les droits pour accéder à une ressource
 */
function AccessDeniedComponent({
  message,
  title = 'Accès refusé',
  returnUrl = '/',
  returnLabel = "Retour à l'accueil",
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle
            aria-hidden="true"
            className="size-8 text-destructive"
          />
        </div>
        <h1 className="text-xl font-bold text-derviche-dark">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button onClick={() => router.push(returnUrl)} variant="outline">
          {returnLabel}
        </Button>
      </div>
    </div>
  );
}

AccessDeniedComponent.displayName = 'AccessDenied';

export const AccessDenied = memo(AccessDeniedComponent);
