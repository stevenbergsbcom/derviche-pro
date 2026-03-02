/**
 * Section Notifications — Préférences emails admin
 * Derviche Diffusion - Admin Preferences
 *
 * Config globale modifiable par super-admin uniquement.
 * Contrôle quels événements de réservation déclenchent un email aux admins.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../shared';

import { useNotificationSettings } from '@/hooks/useAppSettings';
import type { NotificationSettings } from '@/lib/services/app-settings';

// ============================================
// PROPS
// ============================================

interface NotificationsSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function NotificationsSection({ canEdit, onDirtyChange }: NotificationsSectionProps) {
  const { data, isLoading, isSaving, error, update } = useNotificationSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local pour les switches
  const [formData, setFormData] = useState<NotificationSettings>({
    email_notification_new_reservation: true,
    email_notification_cancellation: true,
    email_notification_modification: false,
  });

  // État initial pour détecter les changements
  const [initialData, setInitialData] = useState<NotificationSettings | null>(null);
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
      formData.email_notification_new_reservation !== initialData.email_notification_new_reservation ||
      formData.email_notification_cancellation !== initialData.email_notification_cancellation ||
      formData.email_notification_modification !== initialData.email_notification_modification;

    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [formData, initialData, hasInitialData]);

  // Toggle un switch
  const handleToggle = (key: keyof NotificationSettings) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Soumission
  const onSubmit = async () => {
    const result = await update(formData);

    if (result.success) {
      toast.success('Préférences de notifications enregistrées');
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
        icon={Bell}
        title="Notifications email"
        description="Emails envoyés aux administrateurs"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      icon={Bell}
      title="Notifications email — Manager"
      description="Choisissez quels événements déclenchent un email de notification. Les emails sont envoyés uniquement au manager Derviche assigné à chaque spectacle (champ « Responsable DD » dans la fiche spectacle)."
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={onSubmit}
    >
      {/* Nouvelle réservation */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="notif_new_reservation" className="text-base">
            Nouvelle réservation
          </Label>
          <p className="text-sm text-muted-foreground">
            Le manager DD du spectacle reçoit un email à chaque nouvelle réservation
          </p>
        </div>
        <Switch
          id="notif_new_reservation"
          checked={formData.email_notification_new_reservation}
          onCheckedChange={() => handleToggle('email_notification_new_reservation')}
          disabled={!canEdit}
        />
      </div>

      {/* Annulation */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="notif_cancellation" className="text-base">
            Annulation de réservation
          </Label>
          <p className="text-sm text-muted-foreground">
            Le manager DD du spectacle reçoit un email à chaque annulation
          </p>
        </div>
        <Switch
          id="notif_cancellation"
          checked={formData.email_notification_cancellation}
          onCheckedChange={() => handleToggle('email_notification_cancellation')}
          disabled={!canEdit}
        />
      </div>

      {/* Modification */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="notif_modification" className="text-base">
            Modification de réservation
          </Label>
          <p className="text-sm text-muted-foreground">
            Le manager DD du spectacle reçoit un email à chaque modification (désactivé par défaut)
          </p>
        </div>
        <Switch
          id="notif_modification"
          checked={formData.email_notification_modification}
          onCheckedChange={() => handleToggle('email_notification_modification')}
          disabled={!canEdit}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Si aucun Responsable DD n&apos;est assigné à un spectacle, aucune notification n&apos;est envoyée.
        Seul un super-admin peut modifier ces préférences.
      </p>
    </SettingsCard>
  );
}
