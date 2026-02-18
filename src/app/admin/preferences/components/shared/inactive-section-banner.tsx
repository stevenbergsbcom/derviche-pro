/**
 * InactiveSectionBanner - Bannière d'avertissement pour les sections non connectées
 * Informe l'admin que les paramètres sont sauvegardés mais pas encore utilisés
 * Derviche Diffusion
 */

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InactiveSectionBannerProps {
  message: string;
}

export function InactiveSectionBanner({ message }: InactiveSectionBannerProps) {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-orange-700">
        <strong>Section non active : </strong>
        {message}
      </AlertDescription>
    </Alert>
  );
}
