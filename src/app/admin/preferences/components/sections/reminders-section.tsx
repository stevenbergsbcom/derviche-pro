/**
 * Section Rappels - Paramètres des emails de rappel automatiques
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../shared';

import { useReminderSettings } from '@/hooks/useAppSettings';
import type { ReminderSettings } from '@/lib/services/app-settings';

// ============================================
// PROPS
// ============================================

interface RemindersSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function RemindersSection({ canEdit, onDirtyChange }: RemindersSectionProps) {
  const { data, isLoading, isSaving, error, update } = useReminderSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // État local pour les switches
  const [formData, setFormData] = useState<ReminderSettings>({
    reminder_enabled_7d: true,
    reminder_enabled_2d: true,
    reminder_enabled_12h: true,
  });

  // État initial pour détecter les changements
  // Note : initialData !== null joue le rôle de isInitialized dans les autres sections.
  // On ne notifie le parent qu'une fois les données initiales chargées.
  const [initialData, setInitialData] = useState<ReminderSettings | null>(null);
  const hasInitialData = initialData !== null;

  // Mettre à jour quand les données arrivent
  useEffect(() => {
    if (data) {
      setFormData(data);
      setInitialData(data);
    }
  }, [data]);

  // Détecter les changements et notifier le parent (sans onDirtyChange dans les deps)
  useEffect(() => {
    // Ne rien faire tant que les données initiales ne sont pas chargées
    if (!hasInitialData || !initialData) return;

    const changed =
      formData.reminder_enabled_7d !== initialData.reminder_enabled_7d ||
      formData.reminder_enabled_2d !== initialData.reminder_enabled_2d ||
      formData.reminder_enabled_12h !== initialData.reminder_enabled_12h;
    setHasChanges(changed);
    onDirtyChangeRef.current?.(changed);
  }, [formData, initialData, hasInitialData]);

  // Toggle un switch
  const handleToggle = (key: keyof ReminderSettings) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Soumission
  const onSubmit = async () => {
    const result = await update(formData);

    if (result.success) {
      toast.success('Paramètres de rappels enregistrés');
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
        title="Rappels automatiques"
        description="Configuration des emails de rappel"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-4">
    <SettingsCard
      icon={Bell}
      title="Rappels automatiques"
      description="Emails de rappel envoyés automatiquement avant chaque représentation"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={hasChanges}
      onSubmit={onSubmit}
    >
      {/* Rappel J-7 */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="reminder_7d" className="text-base">
            Rappel J-7
          </Label>
          <p className="text-sm text-muted-foreground">
            Envoyer un rappel 7 jours avant la représentation
          </p>
        </div>
        <Switch
          id="reminder_7d"
          checked={formData.reminder_enabled_7d}
          onCheckedChange={() => handleToggle('reminder_enabled_7d')}
          disabled={!canEdit}
        />
      </div>

      {/* Rappel J-2 */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="reminder_2d" className="text-base">
            Rappel J-2
          </Label>
          <p className="text-sm text-muted-foreground">
            Envoyer un rappel 2 jours avant la représentation
          </p>
        </div>
        <Switch
          id="reminder_2d"
          checked={formData.reminder_enabled_2d}
          onCheckedChange={() => handleToggle('reminder_enabled_2d')}
          disabled={!canEdit}
        />
      </div>

      {/* Rappel H-12 */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="reminder_12h" className="text-base">
            Rappel H-12
          </Label>
          <p className="text-sm text-muted-foreground">
            Envoyer un rappel 12 heures avant la représentation
          </p>
        </div>
        <Switch
          id="reminder_12h"
          checked={formData.reminder_enabled_12h}
          onCheckedChange={() => handleToggle('reminder_enabled_12h')}
          disabled={!canEdit}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Les rappels sont envoyés uniquement aux réservations confirmées.
      </p>
    </SettingsCard>
    </div>
  );
}
