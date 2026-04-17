/**
 * PreferencesContent - Conteneur principal de la page Préférences
 * Derviche Diffusion
 *
 * Les onglets sont désormais rendus dans la sidebar admin
 * (cf. `PreferencesSubmenu`). Cette page rend uniquement la section active
 * déterminée par `?tab=<id>`, avec un header titre + sous-titre reprenant
 * le libellé de l'onglet courant.
 *
 * La protection « modifs non sauvegardées » est centralisée dans
 * `PreferencesDirtyProvider` (layout admin) — les sections appellent
 * `ctx.setDirty(sectionId, boolean)` via `usePreferencesDirty()`.
 */

'use client';

import { Suspense, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { usePreferencesTab } from '@/hooks/usePreferencesTab';
import { PREFERENCE_TABS } from '@/app/admin/preferences/config/preference-tabs';
import { usePreferencesDirty } from '@/components/admin/preferences-dirty';
import {
  OrganizationSection,
  HomepageSection,
  AppearanceSection,
  EmailSection,
  NotificationsSection,
  RemindersSection,
  RgpdSection,
  EmailTemplatesSection,
  GoogleCalendarSection,
  LegalSection,
  StatisticsSection,
  ClassementSection,
} from './sections';

// ============================================
// SKELETON
// ============================================

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Préférences" />
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
  onDirtyChange: (sectionId: string, isDirty: boolean) => void;
}

function PreferencesInnerContent({
  canEdit,
  onDirtyChange,
}: PreferencesInnerContentProps) {
  const { activeTab } = usePreferencesTab();

  // Callbacks stables par section
  const handleOrganizationDirty  = useCallback((d: boolean) => onDirtyChange('organization',  d), [onDirtyChange]);
  const handleHomepageDirty      = useCallback((d: boolean) => onDirtyChange('homepage',      d), [onDirtyChange]);
  const handleAppearanceDirty    = useCallback((d: boolean) => onDirtyChange('appearance',    d), [onDirtyChange]);
  const handleEmailDirty         = useCallback((d: boolean) => onDirtyChange('email',         d), [onDirtyChange]);
  const handleNotificationsDirty = useCallback((d: boolean) => onDirtyChange('notifications', d), [onDirtyChange]);
  const handleRemindersDirty      = useCallback((d: boolean) => onDirtyChange('reminders',       d), [onDirtyChange]);
  const handleTemplatesDirty      = useCallback((d: boolean) => onDirtyChange('templates',       d), [onDirtyChange]);
  const handleGoogleCalendarDirty = useCallback((d: boolean) => onDirtyChange('google-calendar', d), [onDirtyChange]);
  const handleRgpdDirty           = useCallback((d: boolean) => onDirtyChange('rgpd',            d), [onDirtyChange]);
  const handleLegalDirty          = useCallback((d: boolean) => onDirtyChange('legal',           d), [onDirtyChange]);
  const handleStatisticsDirty     = useCallback((d: boolean) => onDirtyChange('statistiques',    d), [onDirtyChange]);
  const handleClassementDirty     = useCallback((d: boolean) => onDirtyChange('classement',      d), [onDirtyChange]);

  return (
    <div>
      {activeTab === 'organization' && (
        <OrganizationSection  canEdit={canEdit} onDirtyChange={handleOrganizationDirty} />
      )}
      {activeTab === 'homepage' && (
        <HomepageSection      canEdit={canEdit} onDirtyChange={handleHomepageDirty} />
      )}
      {activeTab === 'classement' && (
        <ClassementSection    canEdit={canEdit} onDirtyChange={handleClassementDirty} />
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
      {activeTab === 'legal' && (
        <LegalSection          canEdit={canEdit} onDirtyChange={handleLegalDirty} />
      )}
      {activeTab === 'statistiques' && (
        <StatisticsSection     canEdit={canEdit} onDirtyChange={handleStatisticsDirty} />
      )}
    </div>
  );
}

// ============================================
// PAGE HEADER (lit ?tab pour afficher le sous-titre)
// ============================================

function PreferencesHeader() {
  const { activeTab } = usePreferencesTab();
  const activeLabel =
    PREFERENCE_TABS.find((t) => t.id === activeTab)?.label ?? '';
  return <AdminPageHeader title="Préférences" subtitle={activeLabel} />;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PreferencesContent() {
  const { role, isLoading } = useCurrentUserRole();
  const { setDirty } = usePreferencesDirty();

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
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <PreferencesHeader />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <PreferencesInnerContent canEdit={canEdit} onDirtyChange={setDirty} />
      </Suspense>
    </div>
  );
}
