/**
 * Section ressources et médias
 * Derviche Diffusion - Session 110
 */

import { Video, FolderOpen, Film, ExternalLink } from 'lucide-react';
import { isSafeUrl } from '@/lib/services/email/html-helpers';
import type { MediaResourcesSectionProps } from '../types';

/**
 * Composant de lien externe avec indication visuelle
 */
function ExternalLinkItem({ 
  href, 
  label, 
  ariaLabel 
}: { 
  href: string; 
  label: string; 
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-derviche hover:underline inline-flex items-center gap-1"
      aria-label={ariaLabel}
    >
      {label}
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </a>
  );
}

export function MediaResourcesSection({
  folderUrl,
  teaserUrl,
  captationAvailable,
  captationUrl,
  photoFolderUrl,
}: MediaResourcesSectionProps) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/10">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Video className="w-4 h-4" aria-hidden="true" />
        Ressources & Médias
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {/* URL du dossier de presse */}
        <div className="flex items-start gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Dossier de presse</p>
            {isSafeUrl(folderUrl) ? (
              <ExternalLinkItem 
                href={folderUrl} 
                label="Ouvrir le dossier"
                ariaLabel="Ouvrir le dossier de presse (nouvel onglet)"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">Non renseigné</p>
            )}
          </div>
        </div>

        {/* URL teaser */}
        <div className="flex items-start gap-2">
          <Film className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Teaser</p>
            {isSafeUrl(teaserUrl) ? (
              <ExternalLinkItem 
                href={teaserUrl} 
                label="Voir le teaser"
                ariaLabel="Voir le teaser (nouvel onglet)"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">Non renseigné</p>
            )}
          </div>
        </div>

        {/* Dossier photo — S170 */}
        <div className="flex items-start gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Dossier photo</p>
            {isSafeUrl(photoFolderUrl) ? (
              <ExternalLinkItem 
                href={photoFolderUrl} 
                label="Ouvrir le dossier photo"
                ariaLabel="Ouvrir le dossier photo (nouvel onglet)"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">Non renseigné</p>
            )}
          </div>
        </div>

        {/* Captation */}
        <div className="flex items-start gap-2 sm:col-span-2">
          <Video className="w-4 h-4 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Captation</p>
            {captationAvailable ? (
              isSafeUrl(captationUrl) ? (
                <ExternalLinkItem 
                  href={captationUrl} 
                  label="Voir la captation"
                  ariaLabel="Voir la captation (nouvel onglet)"
                />
              ) : (
                <p className="text-sm text-foreground">Disponible (lien non renseigné)</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground italic">Non disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
