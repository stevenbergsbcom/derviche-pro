/**
 * SpectacleViewDialog - Orchestrateur principal
 * Derviche Diffusion - Session 110
 * 
 * Modale de visualisation détaillée d'un spectacle.
 * Refactorisé selon le pattern validé (15x).
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeHtml } from '@/components/ui/safe-html';

// Types
import type { SpectacleViewDialogProps } from './types';

// Hook
import { useSpectacleView } from './hooks';

// Composants
import {
  ShowHeader,
  ShowMetadata,
  GeneralInfoSection,
  RepresentationsSection,
  ReservationPolicySection,
  MediaResourcesSection,
  DervisheManagementSection,
  DialogFooterActions,
} from './components';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function SpectacleViewDialog({
  show,
  categories,
  targetAudiences,
  onClose,
  onEdit,
  onDelete,
  onCopyLink,
  copiedShowId,
  onNavigateToRepresentations,
  dervisheUsers,
}: SpectacleViewDialogProps) {
  const { derivedData, isOpen } = useSpectacleView({
    show,
    categories,
    targetAudiences,
    dervisheUsers,
  });

  // Ne rien rendre si pas de spectacle
  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col">
        {/* Titre caché pour l'accessibilité (lecteurs d'écran) */}
        <DialogHeader className="sr-only">
          <DialogTitle>{show.title}</DialogTitle>
          <DialogDescription>
            Détails du spectacle {show.title} de {show.company_name}
          </DialogDescription>
        </DialogHeader>

        {/* Header avec image et titre */}
        <ShowHeader
          title={show.title}
          companyName={show.company_name}
          imageUrl={show.image_url}
        />

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
          {/* Métadonnées */}
          <ShowMetadata
            showId={show.id}
            slug={show.slug}
            status={show.status}
            categoryNames={derivedData.categoryNames}
            audienceNames={derivedData.audienceNames}
            copiedShowId={copiedShowId}
            onCopyLink={() => void onCopyLink(show)}
          />

          {/* Description */}
          {show.long_description && (
            <div className="mb-6">
              <SafeHtml
                html={show.long_description}
                className="text-sm text-muted-foreground"
              />
            </div>
          )}

          {/* Section: Infos générales */}
          <GeneralInfoSection
            durationMinutes={show.duration_minutes}
            priceType={show.price_type}
            priceAmount={show.price_amount}
            period={show.period}
            closureDates={show.closure_dates}
          />

          {/* Section: Représentations */}
          <RepresentationsSection
            representationsCount={show.representations_count}
            onNavigate={() => onNavigateToRepresentations(show.id)}
          />

          {/* Section: Politique de réservation */}
          <ReservationPolicySection
            maxReservationsPerBooking={show.max_reservations_per_booking}
            invitationPolicy={show.invitation_policy}
          />

          {/* Section: Ressources et médias */}
          <MediaResourcesSection
            folderUrl={show.folder_url}
            teaserUrl={show.teaser_url}
            captationAvailable={show.captation_available}
            captationUrl={show.captation_url}
            photoFolderUrl={show.photo_folder_url}
          />

          {/* Section: Gestion Derviche */}
          <DervisheManagementSection
            managerName={derivedData.managerName}
          />
        </div>

        {/* Footer avec actions */}
        <DialogFooterActions onEdit={onEdit} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

// Export par défaut pour compatibilité
export default SpectacleViewDialog;

// Re-export des types pour l'usage externe
export type { SpectacleViewDialogProps, DervisheUser } from './types';
