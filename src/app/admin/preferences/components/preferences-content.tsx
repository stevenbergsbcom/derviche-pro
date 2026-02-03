/**
 * PreferencesContent - Conteneur principal de la page Préférences
 * Gère les onglets, le rôle utilisateur et affiche la section active
 * Derviche Diffusion
 */

'use client';

import { Suspense, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { PreferencesTabs, usePreferencesTab } from './preferences-tabs';
import { UnsavedChangesDialog } from './shared';
import {
  OrganizationSection,
  AppearanceSection,
  EmailSection,
  RemindersSection,
  RgpdSection,
} from './sections';

// ============================================
// SKELETON
// ============================================

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Préférences" />
      <Skeleton className="h-10 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// INNER CONTENT (with useSearchParams)
// ============================================

interface PreferencesInnerContentProps {
  canEdit: boolean;
  hasUnsavedChanges: boolean;
  onDirtyChange: (sectionId: string, isDirty: boolean) => void;
  onResetAllDirty: () => void;
}

function PreferencesInnerContent({
  canEdit,
  hasUnsavedChanges,
  onDirtyChange,
  onResetAllDirty,
}: PreferencesInnerContentProps) {
  const { activeTab, setActiveTab } = usePreferencesTab();

  // État pour le dialog de confirmation
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Handler de changement d'onglet avec confirmation si nécessaire
  const handleTabChange = useCallback(
    (newTab: string) => {
      if (hasUnsavedChanges) {
        // Stocker l'onglet cible et ouvrir le dialog
        setPendingTab(newTab);
      } else {
        // Pas de modifications, changer directement
        setActiveTab(newTab);
      }
    },
    [hasUnsavedChanges, setActiveTab]
  );

  // Quand l'utilisateur confirme le changement d'onglet (abandonne les modifications)
  const handleConfirmTabChange = useCallback(() => {
    if (pendingTab) {
      // Réinitialiser l'état dirty avant de changer d'onglet
      onResetAllDirty();
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab, setActiveTab, onResetAllDirty]);

  // Quand l'utilisateur annule le changement d'onglet
  const handleCancelTabChange = useCallback(() => {
    setPendingTab(null);
  }, []);

  // Callbacks stables pour chaque section (évite les re-renders infinis)
  const handleOrganizationDirty = useCallback(
    (isDirty: boolean) => onDirtyChange('organization', isDirty),
    [onDirtyChange]
  );

  const handleAppearanceDirty = useCallback(
    (isDirty: boolean) => onDirtyChange('appearance', isDirty),
    [onDirtyChange]
  );

  const handleEmailDirty = useCallback(
    (isDirty: boolean) => onDirtyChange('email', isDirty),
    [onDirtyChange]
  );

  const handleRemindersDirty = useCallback(
    (isDirty: boolean) => onDirtyChange('reminders', isDirty),
    [onDirtyChange]
  );

  const handleRgpdDirty = useCallback(
    (isDirty: boolean) => onDirtyChange('rgpd', isDirty),
    [onDirtyChange]
  );

  return (
    <>
      {/* Navigation par onglets */}
      <PreferencesTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Contenu de l'onglet actif */}
      <div className="mt-6">
        {activeTab === 'organization' && (
          <OrganizationSection
            canEdit={canEdit}
            onDirtyChange={handleOrganizationDirty}
          />
        )}
        {activeTab === 'appearance' && (
          <AppearanceSection
            canEdit={canEdit}
            onDirtyChange={handleAppearanceDirty}
          />
        )}
        {activeTab === 'email' && (
          <EmailSection
            canEdit={canEdit}
            onDirtyChange={handleEmailDirty}
          />
        )}
        {activeTab === 'reminders' && (
          <RemindersSection
            canEdit={canEdit}
            onDirtyChange={handleRemindersDirty}
          />
        )}
        {activeTab === 'rgpd' && (
          <RgpdSection
            canEdit={canEdit}
            onDirtyChange={handleRgpdDirty}
          />
        )}
      </div>

      {/* Dialog de confirmation pour modifications non sauvegardées */}
      <UnsavedChangesDialog
        open={pendingTab !== null}
        onCancel={handleCancelTabChange}
        onConfirm={handleConfirmTabChange}
      />
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PreferencesContent() {
  const { role, isLoading } = useCurrentUserRole();

  // Suivi des modifications par section
  const [dirtyState, setDirtyState] = useState<Record<string, boolean>>({});

  // Calcul de l'état global
  const hasUnsavedChanges = Object.values(dirtyState).some((isDirty) => isDirty);

  // Avertissement navigateur si modifications non sauvegardées
  useUnsavedChangesWarning(hasUnsavedChanges);

  // Callback pour mettre à jour l'état dirty d'une section
  const handleDirtyChange = useCallback((sectionId: string, isDirty: boolean) => {
    setDirtyState((prev) => ({
      ...prev,
      [sectionId]: isDirty,
    }));
  }, []);

  // Callback pour réinitialiser tout l'état dirty (quand on abandonne les modifications)
  const handleResetAllDirty = useCallback(() => {
    setDirtyState({});
  }, []);

  // L'utilisateur peut modifier si super-admin
  const canEdit = role === 'super-admin';

  // État de chargement du rôle
  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  // Seuls les super-admins ont accès
  if (role !== 'super-admin') {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Préférences" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès restreint</AlertTitle>
          <AlertDescription>
            Seuls les super-administrateurs peuvent accéder aux préférences de la plateforme.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Préférences" />

      {/* Contenu avec Suspense pour useSearchParams */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <PreferencesInnerContent
          canEdit={canEdit}
          hasUnsavedChanges={hasUnsavedChanges}
          onDirtyChange={handleDirtyChange}
          onResetAllDirty={handleResetAllDirty}
        />
      </Suspense>
    </div>
  );
}
