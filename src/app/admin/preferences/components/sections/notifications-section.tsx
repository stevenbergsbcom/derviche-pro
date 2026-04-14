/**
 * Section Notifications — Préférences emails admin
 * Derviche Diffusion - Admin Preferences
 *
 * Config globale modifiable par super-admin uniquement.
 * Contrôle quels événements de réservation déclenchent un email
 * et à qui les envoyer (manager DD et/ou adresse personnalisée).
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../shared';

import { useNotificationSettings } from '@/hooks/app-settings';
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
// HELPERS
// ============================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    email_notification_send_to_manager: true,
    email_notification_custom_recipient: '',
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
      formData.email_notification_modification !== initialData.email_notification_modification ||
      formData.email_notification_send_to_manager !== initialData.email_notification_send_to_manager ||
      formData.email_notification_custom_recipient !== initialData.email_notification_custom_recipient;

    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [formData, initialData, hasInitialData]);

  // Toggle local pour afficher/cacher le champ email personnalisé
  const [customRecipientOpen, setCustomRecipientOpen] = useState(false);

  // Synchroniser avec les données BDD au chargement
  useEffect(() => {
    if (data) {
      setCustomRecipientOpen(data.email_notification_custom_recipient.trim() !== '');
    }
  }, [data]);

  // Aucun destinataire = notifications désactivées
  const customEmailValid = customRecipientOpen && isValidEmail(formData.email_notification_custom_recipient.trim());
  const hasAnyRecipient = formData.email_notification_send_to_manager || customEmailValid;

  // Toggle un switch booléen
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
      title="Notifications email"
      description="Configurez les événements qui déclenchent une notification email et les destinataires."
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={onSubmit}
    >
      {/* ── Bloc 1 : Destinataires ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Destinataires</h4>

        {/* Manager du spectacle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="send_to_manager" className="text-base">
              Manager du spectacle
            </Label>
            <p className="text-sm text-muted-foreground">
              Le responsable DD assigné au spectacle reçoit les notifications
            </p>
          </div>
          <Switch
            id="send_to_manager"
            checked={formData.email_notification_send_to_manager}
            onCheckedChange={() => handleToggle('email_notification_send_to_manager')}
            disabled={!canEdit}
          />
        </div>

        {/* Adresse personnalisée */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="custom_recipient_toggle" className="text-base">
                Adresse personnalisée
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoyer les notifications à une adresse email spécifique
              </p>
            </div>
            <Switch
              id="custom_recipient_toggle"
              checked={customRecipientOpen}
              onCheckedChange={(checked) => {
                setCustomRecipientOpen(checked);
                if (!checked) {
                  setFormData((prev) => ({
                    ...prev,
                    email_notification_custom_recipient: '',
                  }));
                }
              }}
              disabled={!canEdit}
            />
          </div>
          {customRecipientOpen && (
            <div className="space-y-1">
              <Input
                id="custom_recipient_email"
                type="email"
                placeholder="exemple@domaine.com"
                value={formData.email_notification_custom_recipient}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email_notification_custom_recipient: e.target.value,
                  }))
                }
                disabled={!canEdit}
                className="max-w-sm"
              />
              {formData.email_notification_custom_recipient.trim() !== '' &&
                !isValidEmail(formData.email_notification_custom_recipient.trim()) && (
                  <p className="text-xs text-destructive">Adresse email invalide</p>
                )}
            </div>
          )}
        </div>

        {!hasAnyRecipient && (
          <p className="text-xs text-warning font-medium">
            Aucun destinataire configuré — les notifications ne seront pas envoyées.
          </p>
        )}
      </div>

      {/* ── Bloc 2 : Événements déclencheurs ── */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-semibold text-foreground">Événements</h4>

        {/* Nouvelle réservation */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notif_new_reservation" className="text-base">
              Nouvelle réservation
            </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email à chaque nouvelle réservation
            </p>
          </div>
          <Switch
            id="notif_new_reservation"
            checked={formData.email_notification_new_reservation}
            onCheckedChange={() => handleToggle('email_notification_new_reservation')}
            disabled={!canEdit || !hasAnyRecipient}
          />
        </div>

        {/* Annulation */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notif_cancellation" className="text-base">
              Annulation de réservation
            </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email à chaque annulation
            </p>
          </div>
          <Switch
            id="notif_cancellation"
            checked={formData.email_notification_cancellation}
            onCheckedChange={() => handleToggle('email_notification_cancellation')}
            disabled={!canEdit || !hasAnyRecipient}
          />
        </div>

        {/* Modification */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notif_modification" className="text-base">
              Modification de réservation
            </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email à chaque modification de créneau
            </p>
          </div>
          <Switch
            id="notif_modification"
            checked={formData.email_notification_modification}
            onCheckedChange={() => handleToggle('email_notification_modification')}
            disabled={!canEdit || !hasAnyRecipient}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Seul un super-admin peut modifier ces préférences.
      </p>
    </SettingsCard>
  );
}
