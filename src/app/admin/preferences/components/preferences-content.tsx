/**
 * PreferencesContent - Conteneur principal de la page Préférences
 * Gère les onglets, le rôle utilisateur et affiche la section active
 * Derviche Diffusion
 */

'use client';

import { Suspense } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { PreferencesTabs, usePreferencesTab } from './preferences-tabs';
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

function PreferencesInnerContent({ canEdit }: { canEdit: boolean }) {
  const { activeTab, setActiveTab } = usePreferencesTab();

  return (
    <>
      {/* Navigation par onglets */}
      <PreferencesTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenu de l'onglet actif */}
      <div className="mt-6">
        {activeTab === 'organization' && <OrganizationSection canEdit={canEdit} />}
        {activeTab === 'appearance' && <AppearanceSection canEdit={canEdit} />}
        {activeTab === 'email' && <EmailSection canEdit={canEdit} />}
        {activeTab === 'reminders' && <RemindersSection canEdit={canEdit} />}
        {activeTab === 'rgpd' && <RgpdSection canEdit={canEdit} />}
      </div>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PreferencesContent() {
  const { role, isLoading } = useCurrentUserRole();

  // L'utilisateur peut modifier si super-admin
  const canEdit = role === 'super-admin';

  // État de chargement du rôle
  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  // Externe n'a pas accès
  if (role === 'externe') {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Préférences" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès restreint</AlertTitle>
          <AlertDescription>
            Vous n&apos;avez pas accès à cette page. Veuillez contacter un administrateur.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Préférences" />

      {/* Message pour les admins (non super-admin) */}
      {role === 'admin' && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Mode lecture seule</AlertTitle>
          <AlertDescription>
            Vous pouvez consulter les paramètres mais seuls les super-administrateurs peuvent les
            modifier.
          </AlertDescription>
        </Alert>
      )}

      {/* Contenu avec Suspense pour useSearchParams */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <PreferencesInnerContent canEdit={canEdit} />
      </Suspense>
    </div>
  );
}
