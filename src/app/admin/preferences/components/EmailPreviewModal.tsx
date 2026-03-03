/**
 * EmailPreviewModal — Aperçu HTML d'un template email
 * Derviche Diffusion - Admin Preferences
 *
 * Affiche le rendu HTML de l'email dans un Dialog,
 * en passant les valeurs actuelles du formulaire à la route preview.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ============================================
// TYPES
// ============================================

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateKey: string;
  templateName: string;
  formValues: Record<string, string | boolean>;
}

// ============================================
// COMPONENT
// ============================================

export function EmailPreviewModal({
  open,
  onOpenChange,
  templateKey,
  templateName,
  formValues,
}: EmailPreviewModalProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Recharger l'iframe à chaque ouverture
  useEffect(() => {
    if (open) {
      setIframeKey((k) => k + 1);
      setIsLoading(true);
      setIframeError(false);
    }
  }, [open]);

  // Timeout 10s : si l'iframe ne charge pas (erreur HTTP 403/500 silencieuse),
  // on bascule sur l'état d'erreur pour éviter un loading infini
  useEffect(() => {
    if (!isLoading || iframeError) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIframeError(true);
    }, 10_000);
    return () => clearTimeout(timer);
  }, [iframeKey, isLoading, iframeError]);

  // Construire l'URL de preview (mémoïsée pour éviter les rechargements inutiles de l'iframe)
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(formValues).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    return `/api/admin/email-templates/${templateKey}/preview?${params.toString()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateKey, JSON.stringify(formValues)]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogContent inclut déjà une croix de fermeture native — pas besoin d'en rajouter */}
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-base">
            Aperçu — {templateName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Rendu avec des données fictives. Les variables sont remplacées par des exemples.
          </p>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden">
          {isLoading && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Génération de l&apos;aperçu...</span>
              </div>
            </div>
          )}
          {iframeError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground" role="alert">
                  Impossible de charger la prévisualisation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIframeError(false);
                    setIsLoading(true);
                    setIframeKey((k) => k + 1);
                  }}
                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </button>
              </div>
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title={`Aperçu email — ${templateName}`}
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setIframeError(true); }}
              sandbox="allow-same-origin"
            />
          )}
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
