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
  NotificationsSection,
  RemindersSection,
  RgpdSection,
  EmailTemplatesSection,
  GoogleCalendarSection,
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
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const handleTabChange = useCallback(
    (newTab: string) => {
      if (hasUnsavedChanges) {
        setPendingTab(newTab);
      } else {
        setActiveTab(newTab);
      }
    },
    [hasUnsavedChanges, setActiveTab]
  );

  const handleConfirmTabChange = useCallback(() => {
    if (pendingTab) {
      onResetAllDirty();
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab, setActiveTab, onResetAllDirty]);

  const handleCancelTabChange = useCallback(() => {
    setPendingTab(null);
  }, []);

  // Callbacks stables par section
  const handleOrganizationDirty  = useCallback((d: boolean) => onDirtyChange('organization',  d), [onDirtyChange]);
  const handleAppearanceDirty    = useCallback((d: boolean) => onDirtyChange('appearance',    d), [onDirtyChange]);
  const handleEmailDirty         = useCallback((d: boolean) => onDirtyChange('email',         d), [onDirtyChange]);
  const handleNotificationsDirty = useCallback((d: boolean) => onDirtyChange('notifications', d), [onDirtyChange]);
  const handleRemindersDirty      = useCallback((d: boolean) => onDirtyChange('reminders',       d), [onDirtyChange]);
  const handleTemplatesDirty      = useCallback((d: boolean) => onDirtyChange('templates',       d), [onDirtyChange]);
  const handleGoogleCalendarDirty = useCallback((d: boolean) => onDirtyChange('google-calendar', d), [onDirtyChange]);
  const handleRgpdDirty           = useCallback((d: boolean) => onDirtyChange('rgpd',            d), [onDirtyChange]);

  return (
    <>
      <PreferencesTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="mt-6">
        {activeTab === 'organization' && (
          <OrganizationSection  canEdit={canEdit} onDirtyChange={handleOrganizationDirty} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceSection    canEdit={canEdit} onDirtyChange={handleAppearanceDirty} />
        )}
        {activeTab === 'email' && (
          <EmailSection         canEdit={canEdit} onDirtyChange={handleEmailDirty} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsSection canEdit={canEdit} onDirtyChange={handleNotificationsDirty} />
        )}
        {activeTab === 'reminders' && (
          <RemindersSection     canEdit={canEdit} onDirtyChange={handleRemindersDirty} />
        )}
        {activeTab === 'templates' && (
          <EmailTemplatesSection canEdit={canEdit} onDirtyChange={handleTemplatesDirty} />
        )}
        {activeTab === 'google-calendar' && (
          <GoogleCalendarSection canEdit={canEdit} onDirtyChange={handleGoogleCalendarDirty} />
        )}
        {activeTab === 'rgpd' && (
          <RgpdSection           canEdit={canEdit} onDirtyChange={handleRgpdDirty} />
        )}
      </div>

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

  const [dirtyState, setDirtyState] = useState<Record<string, boolean>>({});
  const hasUnsavedChanges = Object.values(dirtyState).some((d) => d);

  useUnsavedChangesWarning(hasUnsavedChanges);

  const handleDirtyChange = useCallback((sectionId: string, isDirty: boolean) => {
    setDirtyState((prev) => ({ ...prev, [sectionId]: isDirty }));
  }, []);

  const handleResetAllDirty = useCallback(() => {
    setDirtyState({});
  }, []);

  const canEdit = role === 'super-admin';

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

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
