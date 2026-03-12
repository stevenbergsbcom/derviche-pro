/**
 * Section Légal - Paramètres des pages légales
 * Derviche Diffusion - Admin Preferences
 *
 * Permet de modifier le contenu des 3 pages légales :
 * - Mentions légales
 * - Politique de confidentialité
 * - Conditions Générales d'Utilisation
 *
 * Utilise WysiwygEditor pour l'édition riche (gras, italique, liens).
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Shield, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { SettingsCard } from '../shared';

import { useLegalSettings } from '@/hooks/useAppSettings';

// ============================================
// CONSTANTS
// ============================================

const MAX_CHARS = 10000;

// ============================================
// PROPS
// ============================================

interface LegalSectionProps {
  /** Utilisateur peut modifier (super-admin) */
  canEdit: boolean;
  /** Callback pour notifier le parent des changements non sauvegardés */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function LegalSection({ canEdit, onDirtyChange }: LegalSectionProps) {
  const { data, isLoading, isSaving, error, update } = useLegalSettings();

  // --- State par champ ---
  const [mentionsValue, setMentionsValue] = useState('');
  const [mentionsOriginal, setMentionsOriginal] = useState('');
  const [mentionsInitialized, setMentionsInitialized] = useState(false);

  const [privacyValue, setPrivacyValue] = useState('');
  const [privacyOriginal, setPrivacyOriginal] = useState('');
  const [privacyInitialized, setPrivacyInitialized] = useState(false);

  const [cguValue, setCguValue] = useState('');
  const [cguOriginal, setCguOriginal] = useState('');
  const [cguInitialized, setCguInitialized] = useState(false);

  // --- Initialisation depuis les données ---
  useEffect(() => {
    if (data && !mentionsInitialized) {
      const val = data.legal_mentions || '';
      setMentionsValue(val);
      setMentionsOriginal(val);
      setMentionsInitialized(true);
    }
  }, [data, mentionsInitialized]);

  useEffect(() => {
    if (data && !privacyInitialized) {
      const val = data.legal_privacy || '';
      setPrivacyValue(val);
      setPrivacyOriginal(val);
      setPrivacyInitialized(true);
    }
  }, [data, privacyInitialized]);

  useEffect(() => {
    if (data && !cguInitialized) {
      const val = data.legal_cgu || '';
      setCguValue(val);
      setCguOriginal(val);
      setCguInitialized(true);
    }
  }, [data, cguInitialized]);

  // --- Dirty tracking ---
  const mentionsDirty = mentionsInitialized && mentionsValue !== mentionsOriginal;
  const privacyDirty = privacyInitialized && privacyValue !== privacyOriginal;
  const cguDirty = cguInitialized && cguValue !== cguOriginal;

  // Ref pour la callback (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  // Notifier le parent quand un des sous-formulaires change
  useEffect(() => {
    const anyDirty = mentionsDirty || privacyDirty || cguDirty;
    onDirtyChangeRef.current?.(anyDirty);
  }, [mentionsDirty, privacyDirty, cguDirty]);

  // --- Validation helper ---
  const validateContent = useCallback((value: string, label: string): boolean => {
    const stripped = value.replace(/<[^>]*>/g, '').trim();
    if (!stripped) {
      toast.error(`Le contenu ${label} est requis`);
      return false;
    }
    if (value.length > MAX_CHARS) {
      toast.error(`Maximum ${MAX_CHARS} caractères pour ${label}`);
      return false;
    }
    return true;
  }, []);

  // --- Submit handlers ---
  const onSubmitMentions = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      if (!validateContent(mentionsValue, 'des mentions légales')) return;
      const result = await update({ legal_mentions: mentionsValue });
      if (result.success) {
        toast.success('Mentions légales enregistrées');
        setMentionsOriginal(mentionsValue);
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    },
    [mentionsValue, update, validateContent]
  );

  const onSubmitPrivacy = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      if (!validateContent(privacyValue, 'de la politique de confidentialité')) return;
      const result = await update({ legal_privacy: privacyValue });
      if (result.success) {
        toast.success('Politique de confidentialité enregistrée');
        setPrivacyOriginal(privacyValue);
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    },
    [privacyValue, update, validateContent]
  );

  const onSubmitCgu = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      if (!validateContent(cguValue, 'des CGU')) return;
      const result = await update({ legal_cgu: cguValue });
      if (result.success) {
        toast.success('CGU enregistrées');
        setCguOriginal(cguValue);
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    },
    [cguValue, update, validateContent]
  );

  // Erreur de chargement
  if (error) {
    return (
      <SettingsCard
        icon={FileText}
        title="Pages légales"
        description="Contenu des pages légales du site"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mentions légales */}
      <SettingsCard
        icon={FileText}
        title="Mentions légales"
        description="Contenu affiché sur la page /mentions-legales"
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        hasChanges={mentionsDirty}
        onSubmit={onSubmitMentions}
      >
        <div className="space-y-2">
          <Label>Contenu</Label>
          <WysiwygEditor
            value={mentionsValue}
            onChange={setMentionsValue}
            placeholder="Contenu des mentions légales..."
            rows={12}
          />
          <p className="text-xs text-muted-foreground">
            Mise en forme : gras, italique, liens. Raccourcis : Ctrl+B, Ctrl+I, Ctrl+K.
          </p>
        </div>
      </SettingsCard>

      {/* Politique de confidentialité */}
      <SettingsCard
        icon={Shield}
        title="Politique de confidentialité"
        description="Contenu affiché sur la page /politique-confidentialite"
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        hasChanges={privacyDirty}
        onSubmit={onSubmitPrivacy}
      >
        <div className="space-y-2">
          <Label>Contenu</Label>
          <WysiwygEditor
            value={privacyValue}
            onChange={setPrivacyValue}
            placeholder="Contenu de la politique de confidentialité..."
            rows={12}
          />
          <p className="text-xs text-muted-foreground">
            Mise en forme : gras, italique, liens. Raccourcis : Ctrl+B, Ctrl+I, Ctrl+K.
          </p>
        </div>
      </SettingsCard>

      {/* CGU */}
      <SettingsCard
        icon={ScrollText}
        title="Conditions Générales d'Utilisation"
        description="Contenu affiché sur la page /cgu"
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        hasChanges={cguDirty}
        onSubmit={onSubmitCgu}
      >
        <div className="space-y-2">
          <Label>Contenu</Label>
          <WysiwygEditor
            value={cguValue}
            onChange={setCguValue}
            placeholder="Contenu des conditions générales d'utilisation..."
            rows={12}
          />
          <p className="text-xs text-muted-foreground">
            Mise en forme : gras, italique, liens. Raccourcis : Ctrl+B, Ctrl+I, Ctrl+K.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}
