/**
 * Section Google Calendar — Préférences intégration calendrier
 * Derviche Diffusion - Admin Preferences
 *
 * Switch principal : activer/désactiver l'intégration Google Calendar.
 * Switches secondaires : envoyer un email Google à l'annulation / modification.
 * Note : la création envoie TOUJOURS un email Google (non configurable).
 *
 * Visible et modifiable par super-admin uniquement.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../shared';

import { useGoogleCalendarSettings } from '@/hooks/useAppSettings';
import type { GoogleCalendarSettings } from '@/lib/services/app-settings';

// ============================================
// PROPS
// ============================================

interface GoogleCalendarSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

const DEFAULT_SETTINGS: GoogleCalendarSettings = {
  google_calendar_enabled: false,
  google_calendar_notify_on_cancellation: false,
  google_calendar_notify_on_modification: false,
};

// ============================================
// COMPONENT
// ============================================

export function GoogleCalendarSection({ canEdit, onDirtyChange }: GoogleCalendarSectionProps) {
  const { data, isLoading, isSaving, error, update } = useGoogleCalendarSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local pour les switches
  const [formData, setFormData] = useState<GoogleCalendarSettings>(DEFAULT_SETTINGS);

  // État initial pour détecter les changements
  const [initialData, setInitialData] = useState<GoogleCalendarSettings | null>(null);
  const hasInitialData = initialData !== null;

  // Initialiser avec les données BDD
  useEffect(() => {
    if (data) {
      setFormData(data);
      setInitialData(data);
    }
  }, [data]);

  // Détecter les changements et notifier le parent
  useEffect(() => {
    if (!hasInitialData || !initialData) return;

    const changed =
      formData.google_calendar_enabled               !== initialData.google_calendar_enabled ||
      formData.google_calendar_notify_on_cancellation !== initialData.google_calendar_notify_on_cancellation ||
      formData.google_calendar_notify_on_modification !== initialData.google_calendar_notify_on_modification;

    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [formData, initialData, hasInitialData]);

  // Toggle un switch
  const handleToggle = (key: keyof GoogleCalendarSettings) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Soumission
  const onSubmit = async () => {
    const result = await update(formData);

    if (result.success) {
      toast.success('Paramètres Google Calendar enregistrés');
      setInitialData(formData);
      setHasChanges(false);
      onDirtyChange?.(false);
    } else {
      toast.error(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  // Erreur de chargement
  if (error) {
    return (
      <SettingsCard
        icon={Calendar}
        title="Google Calendar"
        description="Intégration avec Google Calendar"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }



  return (
    <SettingsCard
      icon={Calendar}
      title="Google Calendar"
      description="Synchronise automatiquement les réservations dans le calendrier Google de Derviche Diffusion."
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={onSubmit}
    >
      {/* Switch principal — activer l'intégration */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="calendar_enabled" className="text-base">
            Activer l&apos;intégration Google Calendar
          </Label>
          <p className="text-sm text-muted-foreground">
            Crée un événement dans le calendrier DD à chaque réservation confirmée.
            Le professionnel reçoit une invitation Google.
          </p>
        </div>
        <Switch
          id="calendar_enabled"
          checked={formData.google_calendar_enabled}
          onCheckedChange={() => handleToggle('google_calendar_enabled')}
          disabled={!canEdit}
        />
      </div>

      {/* Séparateur visuel */}
      <div className="border-t pt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Emails Google envoyés à l&apos;invité
        </p>

        {/* Création — toujours actif, non modifiable */}
        <div className="flex items-center justify-between rounded-lg border p-4 mb-3 bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base text-muted-foreground">
              Nouvelle réservation
            </Label>
            <p className="text-sm text-muted-foreground">
              Un email Google est toujours envoyé lors de la création — non configurable.
            </p>
          </div>
          <Switch checked={true} disabled={true} aria-readonly />
        </div>

        {/* Annulation */}
        <div className="flex items-center justify-between rounded-lg border p-4 mb-3">
          <div className="space-y-0.5">
            <Label
              htmlFor="calendar_notify_cancellation"
              className={!canEdit || !formData.google_calendar_enabled ? 'text-muted-foreground' : 'text-base'}
            >
              Annulation de réservation
            </Label>
            <p className="text-sm text-muted-foreground">
              Envoyer un email Google au professionnel quand sa réservation est annulée
            </p>
          </div>
          <Switch
            id="calendar_notify_cancellation"
            checked={formData.google_calendar_notify_on_cancellation}
            onCheckedChange={() => handleToggle('google_calendar_notify_on_cancellation')}
            disabled={!canEdit || !formData.google_calendar_enabled}
          />
        </div>

        {/* Modification */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="calendar_notify_modification"
              className={!canEdit || !formData.google_calendar_enabled ? 'text-muted-foreground' : 'text-base'}
            >
              Modification de créneau
            </Label>
            <p className="text-sm text-muted-foreground">
              Envoyer un email Google au professionnel quand il change de créneau
            </p>
          </div>
          <Switch
            id="calendar_notify_modification"
            checked={formData.google_calendar_notify_on_modification}
            onCheckedChange={() => handleToggle('google_calendar_notify_on_modification')}
            disabled={!canEdit || !formData.google_calendar_enabled}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Nécessite les variables d&apos;environnement{' '}
        <code className="bg-muted px-1 rounded text-[11px]">GOOGLE_OAUTH_CLIENT_ID</code>,{' '}
        <code className="bg-muted px-1 rounded text-[11px]">GOOGLE_OAUTH_CLIENT_SECRET</code>,{' '}
        <code className="bg-muted px-1 rounded text-[11px]">GOOGLE_OAUTH_REFRESH_TOKEN</code>{' '}
        et{' '}
        <code className="bg-muted px-1 rounded text-[11px]">GOOGLE_CALENDAR_ID</code>.
        Seul un super-admin peut modifier ces préférences.
      </p>
    </SettingsCard>
  );
}
