/**
 * Section Page d'accueil - Paramètres du contenu de la homepage
 * Derviche Diffusion - Admin Preferences
 *
 * 6 SettingsCard indépendantes : Hero, Avantages, Spectacles, Chiffres clés, Contact, Footer
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Megaphone,
  Star,
  Theater,
  BarChart3,
  MessageCircle,
  PanelBottom,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SettingsCard } from '../shared';

import { useHomepageSettings } from '@/hooks/useAppSettings';
import type { HomepageSettings } from '@/lib/services/app-settings';

// ============================================
// ICON OPTIONS (pour les cartes avantages)
// ============================================

const ICON_OPTIONS = [
  { value: 'search', label: 'Recherche' },
  { value: 'calendar', label: 'Calendrier' },
  { value: 'message-circle', label: 'Message' },
  { value: 'star', label: 'Étoile' },
  { value: 'heart', label: 'Cœur' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'shield', label: 'Bouclier' },
  { value: 'zap', label: 'Éclair' },
] as const;

// ============================================
// SCHEMAS ZOD
// ============================================

const heroSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(500),
  description: z.string().min(1, 'La description est requise').max(1000),
  secondary_text: z.string().max(500),
  cta_primary_text: z.string().min(1, 'Le texte du bouton est requis').max(100),
  cta_primary_url: z.string().min(1, 'L\'URL est requise').max(200),
  cta_secondary_text: z.string().max(100),
  cta_secondary_url: z.string().max(200),
});

const avantageCardSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1, 'Le titre est requis').max(100),
  description: z.string().min(1, 'La description est requise').max(500),
});

const avantagesSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  cards: z.array(avantageCardSchema).min(1).max(6),
});

const spectaclesSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300),
  cta_text: z.string().min(1).max(100),
});

const statCardSchema = z.object({
  number: z.string().min(1, 'Le nombre est requis').max(20),
  label: z.string().min(1, 'Le label est requis').max(100),
});

const impactSchema = z.object({
  enabled: z.boolean(),
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  stats: z.array(statCardSchema).min(1).max(6),
});

const contactSchema = z.object({
  label: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(500),
});

const footerSchema = z.object({
  description: z.string().max(500),
  facebook_url: z.union([z.string().url('URL invalide'), z.literal('')]),
  instagram_url: z.union([z.string().url('URL invalide'), z.literal('')]),
  copyright_text: z.string().max(200),
});

type HeroFormData = z.infer<typeof heroSchema>;
type AvantagesFormData = z.infer<typeof avantagesSchema>;
type SpectaclesFormData = z.infer<typeof spectaclesSchema>;
type ImpactFormData = z.infer<typeof impactSchema>;
type ContactFormData = z.infer<typeof contactSchema>;
type FooterFormData = z.infer<typeof footerSchema>;

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

// ============================================
// SHARED CARD PROPS
// ============================================

interface CardProps {
  data: HomepageSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onUpdate: (value: Partial<HomepageSettings>) => Promise<{ success: boolean; error?: string }>;
  onDirtyChange: (isDirty: boolean) => void;
}

// ============================================
// HERO CARD
// ============================================

function HeroCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      title: '',
      description: '',
      secondary_text: '',
      cta_primary_text: '',
      cta_primary_url: '',
      cta_secondary_text: '',
      cta_secondary_url: '',
    },
  });

  useEffect(() => {
    if (data?.homepage_hero && !isInitialized) {
      reset(data.homepage_hero);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: HeroFormData) => {
    const result = await onUpdate({ homepage_hero: formData });
    if (result.success) {
      toast.success('Section Hero enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Megaphone}
      title="Hero"
      description="Titre, description et boutons d'action de la section principale"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hero_title">Titre</Label>
          <Textarea
            id="hero_title"
            rows={2}
            placeholder="Découvrez les spectacles..."
            disabled={!canEdit}
            {...register('title')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          <p className="text-xs text-muted-foreground">
            Utilisez \n pour un retour à la ligne
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero_description">Description</Label>
          <Textarea
            id="hero_description"
            rows={3}
            placeholder="Derviche est une agence..."
            disabled={!canEdit}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero_secondary_text">Texte secondaire</Label>
          <Input
            id="hero_secondary_text"
            placeholder="Comme les derviches tourneurs..."
            disabled={!canEdit}
            {...register('secondary_text')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero_cta_primary_text">Bouton principal — texte</Label>
            <Input
              id="hero_cta_primary_text"
              placeholder="Réserver ma place"
              disabled={!canEdit}
              {...register('cta_primary_text')}
            />
            {errors.cta_primary_text && (
              <p className="text-sm text-destructive">{errors.cta_primary_text.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_cta_primary_url">Bouton principal — URL</Label>
            <Input
              id="hero_cta_primary_url"
              placeholder="/catalogue"
              disabled={!canEdit}
              {...register('cta_primary_url')}
            />
            {errors.cta_primary_url && (
              <p className="text-sm text-destructive">{errors.cta_primary_url.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero_cta_secondary_text">Bouton secondaire — texte</Label>
            <Input
              id="hero_cta_secondary_text"
              placeholder="Découvrir la plateforme"
              disabled={!canEdit}
              {...register('cta_secondary_text')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_cta_secondary_url">Bouton secondaire — URL</Label>
            <Input
              id="hero_cta_secondary_url"
              placeholder="#avantages"
              disabled={!canEdit}
              {...register('cta_secondary_url')}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

// ============================================
// AVANTAGES CARD
// ============================================

function AvantagesCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AvantagesFormData>({
    resolver: zodResolver(avantagesSchema),
    defaultValues: {
      label: '',
      title: '',
      cards: [
        { icon: 'search', title: '', description: '' },
        { icon: 'calendar', title: '', description: '' },
        { icon: 'message-circle', title: '', description: '' },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: 'cards' });
  const watchedCards = useWatch({ control, name: 'cards' });

  useEffect(() => {
    if (data?.homepage_avantages && !isInitialized) {
      reset(data.homepage_avantages);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: AvantagesFormData) => {
    const result = await onUpdate({ homepage_avantages: formData });
    if (result.success) {
      toast.success('Section Avantages enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Star}
      title="Avantages"
      description="Label, titre et cartes de la section plateforme"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="avantages_label">Label</Label>
            <Input
              id="avantages_label"
              placeholder="La plateforme"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avantages_title">Titre</Label>
            <Input
              id="avantages_title"
              placeholder="Simplifiez votre programmation"
              disabled={!canEdit}
              {...register('title')}
            />
          </div>
        </div>

        {fields.map((field, index) => {
          const watchedIcon = watchedCards?.[index]?.icon ?? field.icon;
          return (
            <div
              key={field.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Carte {index + 1}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <Select
                    value={watchedIcon}
                    onValueChange={(val) => setValue(`cards.${index}.icon`, val, { shouldDirty: true })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Titre</Label>
                  <Input
                    placeholder="Accès direct"
                    disabled={!canEdit}
                    {...register(`cards.${index}.title`)}
                  />
                  {errors.cards?.[index]?.title && (
                    <p className="text-sm text-destructive">
                      {errors.cards[index].title?.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Parcourez notre catalogue complet..."
                  disabled={!canEdit}
                  {...register(`cards.${index}.description`)}
                />
                {errors.cards?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {errors.cards[index].description?.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}

// ============================================
// SPECTACLES CARD
// ============================================

function SpectaclesCard({
  data,
  isLoading,
  isSaving,
  canEdit,
  onUpdate,
  onDirtyChange,
}: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SpectaclesFormData>({
    resolver: zodResolver(spectaclesSchema),
    defaultValues: { label: '', title: '', subtitle: '', cta_text: '' },
  });

  useEffect(() => {
    if (data?.homepage_spectacles && !isInitialized) {
      reset(data.homepage_spectacles);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: SpectaclesFormData) => {
    const result = await onUpdate({ homepage_spectacles: formData });
    if (result.success) {
      toast.success('Section Spectacles enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={Theater}
      title="Spectacles"
      description="Titres et bouton de la section carousel"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="spectacles_label">Label</Label>
          <Input
            id="spectacles_label"
            placeholder="Sélection"
            disabled={!canEdit}
            {...register('label')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_title">Titre</Label>
          <Input
            id="spectacles_title"
            placeholder="Spectacles à découvrir"
            disabled={!canEdit}
            {...register('title')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_subtitle">Sous-titre</Label>
          <Input
            id="spectacles_subtitle"
            placeholder="Explorez les spectacles en tournée cette saison"
            disabled={!canEdit}
            {...register('subtitle')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spectacles_cta_text">Texte du bouton</Label>
          <Input
            id="spectacles_cta_text"
            placeholder="Voir tout le catalogue"
            disabled={!canEdit}
            {...register('cta_text')}
          />
          {errors.cta_text && (
            <p className="text-sm text-destructive">{errors.cta_text.message}</p>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}

// ============================================
// IMPACT (CHIFFRES CLÉS) CARD
// ============================================

function ImpactCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ImpactFormData>({
    resolver: zodResolver(impactSchema),
    defaultValues: {
      enabled: true,
      label: '',
      title: '',
      description: '',
      stats: [
        { number: '', label: '' },
        { number: '', label: '' },
        { number: '', label: '' },
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: 'stats' });
  const enabledValue = useWatch({ control, name: 'enabled' });

  useEffect(() => {
    if (data?.homepage_impact && !isInitialized) {
      reset(data.homepage_impact);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: ImpactFormData) => {
    const result = await onUpdate({ homepage_impact: formData });
    if (result.success) {
      toast.success('Section Chiffres clés enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={BarChart3}
      title="Chiffres clés"
      description="Statistiques et texte de la section impact"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Afficher la section</Label>
            <p className="text-sm text-muted-foreground">
              Affiche la section chiffres clés sur la page d&apos;accueil
            </p>
          </div>
          <Switch
            checked={enabledValue}
            onCheckedChange={(v) => setValue('enabled', v, { shouldDirty: true })}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="impact_label">Label</Label>
            <Input
              id="impact_label"
              placeholder="Notre impact"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="impact_title">Titre</Label>
            <Input
              id="impact_title"
              placeholder="Les chiffres qui parlent..."
              disabled={!canEdit}
              {...register('title')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="impact_description">Description</Label>
          <Textarea
            id="impact_description"
            rows={3}
            placeholder="Depuis 2016, Derviche rassemble..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Statistique {index + 1}
              </p>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="120"
                  disabled={!canEdit}
                  {...register(`stats.${index}.number`)}
                />
                {errors.stats?.[index]?.number && (
                  <p className="text-sm text-destructive">
                    {errors.stats[index].number?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="Spectacles représentés"
                  disabled={!canEdit}
                  {...register(`stats.${index}.label`)}
                />
                {errors.stats?.[index]?.label && (
                  <p className="text-sm text-destructive">
                    {errors.stats[index].label?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}

// ============================================
// CONTACT CARD
// ============================================

function ContactCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { label: '', title: '', description: '' },
  });

  useEffect(() => {
    if (data?.homepage_contact && !isInitialized) {
      reset(data.homepage_contact);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: ContactFormData) => {
    const result = await onUpdate({ homepage_contact: formData });
    if (result.success) {
      toast.success('Section Contact enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={MessageCircle}
      title="Contact"
      description="Titres de la section contact"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_label">Label</Label>
            <Input
              id="contact_label"
              placeholder="Contact"
              disabled={!canEdit}
              {...register('label')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_title">Titre</Label>
            <Input
              id="contact_title"
              placeholder="Nous contacter"
              disabled={!canEdit}
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_description">Description</Label>
          <Textarea
            id="contact_description"
            rows={2}
            placeholder="Une question ? Notre équipe..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Les coordonnées affichées (email, téléphone, adresse) proviennent de
            l&apos;onglet <strong>Organisation</strong>.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}

// ============================================
// FOOTER CARD
// ============================================

function FooterCard({ data, isLoading, isSaving, canEdit, onUpdate, onDirtyChange }: CardProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FooterFormData>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      description: '',
      facebook_url: '',
      instagram_url: '',
      copyright_text: '',
    },
  });

  useEffect(() => {
    if (data?.homepage_footer && !isInitialized) {
      reset(data.homepage_footer);
      setIsInitialized(true);
    }
  }, [data, reset, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    onDirtyChange(isDirty);
  }, [isDirty, isInitialized, onDirtyChange]);

  const onSubmit = async (formData: FooterFormData) => {
    const result = await onUpdate({ homepage_footer: formData });
    if (result.success) {
      toast.success('Section Footer enregistrée');
      reset(formData);
    } else {
      toast.error(result.error ?? 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <SettingsCard
      icon={PanelBottom}
      title="Footer"
      description="Description, réseaux sociaux et copyright"
      isLoading={isLoading}
      isSaving={isSaving}
      canEdit={canEdit}
      hasChanges={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="footer_description">Description</Label>
          <Textarea
            id="footer_description"
            rows={2}
            placeholder="Agence de production et de diffusion..."
            disabled={!canEdit}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="footer_facebook_url">URL Facebook</Label>
            <Input
              id="footer_facebook_url"
              type="url"
              placeholder="https://www.facebook.com/..."
              disabled={!canEdit}
              {...register('facebook_url')}
            />
            {errors.facebook_url && (
              <p className="text-sm text-destructive">{errors.facebook_url.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer_instagram_url">URL Instagram</Label>
            <Input
              id="footer_instagram_url"
              type="url"
              placeholder="https://www.instagram.com/..."
              disabled={!canEdit}
              {...register('instagram_url')}
            />
            {errors.instagram_url && (
              <p className="text-sm text-destructive">{errors.instagram_url.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_copyright_text">Texte copyright</Label>
          <Input
            id="footer_copyright_text"
            placeholder="© {year} Derviche Diffusion. Tous droits réservés."
            disabled={!canEdit}
            {...register('copyright_text')}
          />
          <p className="text-xs text-muted-foreground">
            Utilisez <code className="bg-muted px-1 rounded">{'{year}'}</code> pour
            insérer l&apos;année courante automatiquement.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Les coordonnées du footer (email, adresse) proviennent de
            l&apos;onglet <strong>Organisation</strong>.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
