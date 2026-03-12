/**
 * Section Page d'accueil — Orchestrateur
 * Derviche Diffusion - Admin Preferences
 *
 * 6 SettingsCard indépendantes : Hero, Avantages, Spectacles, Chiffres clés, Contact, Footer
 * Chaque carte est dans son propre fichier pour maintenabilité.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Megaphone } from 'lucide-react';

import { SettingsCard } from '../../shared';
import { useHomepageSettings } from '@/hooks/useAppSettings';

import { HeroCard } from './hero-card';
import { AvantagesCard } from './advantages-card';
import { SpectaclesCard } from './shows-card';
import { ImpactCard } from './impact-card';
import { ContactCard } from './contact-card';
import { FooterCard } from './footer-card';

// ============================================
// PROPS
// ============================================

interface HomepageSectionProps {
  canEdit: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function HomepageSection({ canEdit, onDirtyChange }: HomepageSectionProps) {
  const { data, isLoading, isSaving, error, update } = useHomepageSettings();

  // Track dirty state across all sub-forms
  const [dirtyForms, setDirtyForms] = useState<Record<string, boolean>>({});
  const onDirtyChangeRef = useRef(onDirtyChange);

  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  useEffect(() => {
    const anyDirty = Object.values(dirtyForms).some(Boolean);
    onDirtyChangeRef.current?.(anyDirty);
  }, [dirtyForms]);

  const setFormDirty = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => ({ ...prev, [formId]: isDirty }));
  }, []);

  // Callbacks stables par section
  const handleHeroDirty       = useCallback((d: boolean) => setFormDirty('hero', d), [setFormDirty]);
  const handleAvantagesDirty  = useCallback((d: boolean) => setFormDirty('avantages', d), [setFormDirty]);
  const handleSpectaclesDirty = useCallback((d: boolean) => setFormDirty('spectacles', d), [setFormDirty]);
  const handleImpactDirty     = useCallback((d: boolean) => setFormDirty('impact', d), [setFormDirty]);
  const handleContactDirty    = useCallback((d: boolean) => setFormDirty('contact', d), [setFormDirty]);
  const handleFooterDirty     = useCallback((d: boolean) => setFormDirty('footer', d), [setFormDirty]);

  if (error) {
    return (
      <SettingsCard
        icon={Megaphone}
        title="Page d'accueil"
        description="Erreur de chargement"
        canEdit={false}
      >
        <p className="text-sm text-destructive">Erreur : {error}</p>
      </SettingsCard>
    );
  }

  // Ordre des cartes aligné avec la page d'accueil publique :
  // Hero → Avantages → Spectacles → Impact → Contact → Footer
  return (
    <div className="space-y-6">
      <HeroCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleHeroDirty}
      />
      <AvantagesCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleAvantagesDirty}
      />
      <SpectaclesCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleSpectaclesDirty}
      />
      <ImpactCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleImpactDirty}
      />
      <ContactCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleContactDirty}
      />
      <FooterCard
        data={data}
        isLoading={isLoading}
        isSaving={isSaving}
        canEdit={canEdit}
        onUpdate={update}
        onDirtyChange={handleFooterDirty}
      />
    </div>
  );
}
