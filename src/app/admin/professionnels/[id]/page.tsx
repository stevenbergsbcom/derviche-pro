/**
 * Page Admin - Fiche détaillée d'un professionnel
 * /admin/professionnels/[id]
 *
 * Affiche :
 *  - Informations du profil (lecture seule)
 *  - Historique complet de toutes ses réservations
 *    (spectacle, date, statut résa, statut checkin)
 *
 * Derviche Diffusion — Session S152
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import {
  ProfileHeader,
  ContactInfoPanel,
  ReservationHistoryTable,
  getFullName,
  getDisplayName,
  getFormattedAddress,
} from './components';
import { useProfessionalDetail } from './hooks/useProfessionalDetail';

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ProfessionalDetailPage({ params }: PageProps) {
  const { id: professionalId } = use(params);
  const router = useRouter();

  const {
    professional,
    isLoadingPro,
    errorPro,
    history,
    isLoadingHistory,
    errorHistory,
    refreshHistory,
  } = useProfessionalDetail(professionalId);

  // ---- Infos dérivées ----
  const fullName = professional ? getFullName(professional) : '';
  const displayName = professional ? getDisplayName(professional) : '...';
  const isActive = professional ? professional.disabled_at === null : true;
  const address = professional ? getFormattedAddress(professional) : '';

  return (
    <div className="max-w-5xl space-y-6">

      {/* ---- Breadcrumb ---- */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/professionnels"
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Professionnels
        </Link>
        <span>/</span>
        <span className="max-w-xs truncate font-medium text-foreground">
          {isLoadingPro ? '...' : displayName}
        </span>
      </div>

      {/* ---- Chargement pro ---- */}
      {isLoadingPro && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Chargement du profil&hellip;</span>
        </div>
      )}

      {/* ---- Erreur pro ---- */}
      {!isLoadingPro && errorPro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="space-y-2">
            <p className="text-sm text-red-700">{errorPro}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/professionnels')}
              className="h-7 px-2 text-red-700"
            >
              Retour à la liste
            </Button>
          </div>
        </div>
      )}

      {/* ---- Contenu principal ---- */}
      {!isLoadingPro && professional && (
        <>
          <ProfileHeader
            professional={professional}
            displayName={displayName}
            fullName={fullName}
            isActive={isActive}
            history={history}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            <ContactInfoPanel professional={professional} address={address} />
            <ReservationHistoryTable
              history={history}
              isLoading={isLoadingHistory}
              error={errorHistory}
              onRefresh={refreshHistory}
            />
          </div>
        </>
      )}
    </div>
  );
}
