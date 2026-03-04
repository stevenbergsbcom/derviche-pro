/**
 * Section Templates Email — Préférences admin
 * Derviche Diffusion
 *
 * Affiche les 4 templates email sous forme d'accordéons dépliables.
 * Chaque template est éditable via EmailTemplateForm (super-admin uniquement).
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { EmailTemplateForm } from '../EmailTemplateForm';
import { EMAIL_TEMPLATE_NAMES } from '@/types/email-templates';
import type { EmailTemplate, EmailTemplateKey } from '@/types/email-templates';

// ============================================
// CONSTANTES
// ============================================

/** Templates transactionnels (confirmation, annulation, modification, admin) */
const TRANSACTIONAL_KEYS: EmailTemplateKey[] = [
  'reservation_confirmation',
  'reservation_cancellation',
  'reservation_modification',
  'admin_notification',
];

/** Templates de rappels automatiques (J-7, J-2, H-12) */
const REMINDER_KEYS: EmailTemplateKey[] = [
  'reminder_7d',
  'reminder_2d',
  'reminder_12h',
];

/** Toutes les clés — utilisé pour le chargement initial */
const TEMPLATE_KEYS: EmailTemplateKey[] = [
  ...TRANSACTIONAL_KEYS,
  ...REMINDER_KEYS,
];

// ============================================
// PROPS
// ============================================

interface EmailTemplatesSectionProps {
  canEdit: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// SKELETON
// ============================================

function TemplatesSkeleton() {
  return (
    <div className="space-y-2">
      {TEMPLATE_KEYS.map((key) => (
        <div key={key} className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// SOUS-COMPOSANT : Item d'accordéon réutilisable
// ============================================

interface TemplateAccordionItemProps {
  template: EmailTemplate;
  isDirty: boolean;
  canEdit: boolean;
  onDirtyChange: (key: string, isDirty: boolean) => void;
  onSaved: (key: string) => void;
}

function TemplateAccordionItem({
  template,
  isDirty,
  canEdit,
  onDirtyChange,
  onSaved,
}: TemplateAccordionItemProps) {
  const templateName = EMAIL_TEMPLATE_NAMES[template.template_key] ?? template.name;

  return (
    <AccordionItem
      value={template.template_key}
      // last:!border-b : force la bordure basse sur le dernier item
      // (écrase le last:border-b-0 de shadcn qui est prévu pour accordion groupé)
      className="border rounded-lg px-1 last:!border-b [&[data-state=open]]:bg-muted/30"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{templateName}</span>
          {isDirty && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-600 bg-orange-50 shrink-0"
            >
              Non sauvegardé
            </Badge>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-5 pt-2">
        <EmailTemplateForm
          template={template}
          canEdit={canEdit}
          onDirtyChange={(dirty) => onDirtyChange(template.template_key, dirty)}
          onSaved={() => onSaved(template.template_key)}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Séparateur entre les groupes de templates */
function TemplateGroupSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function EmailTemplatesSection({ canEdit, onDirtyChange }: EmailTemplatesSectionProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // État dirty par template_key
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  // Ref pour la callback dirty (évite les boucles infinies)
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => { onDirtyChangeRef.current = onDirtyChange; });

  // Notifier le parent si au moins un template est dirty
  useEffect(() => {
    const anyDirty = Object.values(dirtyMap).some(Boolean);
    onDirtyChangeRef.current?.(anyDirty);
  }, [dirtyMap]);

  // Chargement des 4 templates
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const results = await Promise.all(
        TEMPLATE_KEYS.map(async (key) => {
          const res = await fetch(`/api/admin/email-templates/${key}`);
          if (!res.ok) {
            return { success: false as const, error: `HTTP ${res.status}` };
          }
          return res.json() as Promise<{ success: boolean; data?: EmailTemplate; error?: string }>;
        })
      );

      // Traitement après résolution complète de Promise.all
      // (on n'interrompt pas la boucle pour traiter toutes les réponses)
      const firstError = results.findIndex((r) => !r?.success || !r.data);
      if (firstError !== -1) {
        setLoadError(`Erreur lors du chargement du template "${TEMPLATE_KEYS[firstError]}"`);
        return;
      }

      const loaded = results.map((r) => r.data as EmailTemplate);
      setTemplates(loaded);
    } catch {
      setLoadError('Erreur réseau — impossible de charger les templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleDirtyChange = useCallback((key: string, isDirty: boolean) => {
    setDirtyMap((prev) => ({ ...prev, [key]: isDirty }));
  }, []);

  const handleSaved = useCallback((key: string) => {
    setDirtyMap((prev) => ({ ...prev, [key]: false }));
  }, []);

  // ── Chargement ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-5 w-5" />
          <span className="text-sm font-medium">Chargement des templates...</span>
        </div>
        <TemplatesSkeleton />
      </div>
    );
  }

  // ── Erreur ──
  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => void loadTemplates()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Personnalisez le contenu textuel des emails envoyés aux professionnels.
          Utilisez les badges <span className="font-mono text-xs bg-muted px-1 rounded">{'{{variable}}'}</span> pour
          insérer des données dynamiques.
        </p>
        {!canEdit && (
          <p className="text-xs text-muted-foreground italic">
            Lecture seule — seul un super-administrateur peut modifier les templates.
          </p>
        )}
      </div>

      {/* Groupe 1 : Emails transactionnels */}
      <TemplateGroupSeparator label="Emails transactionnels" />
      <Accordion type="single" collapsible className="space-y-2">
        {templates
          .filter((t) => (TRANSACTIONAL_KEYS as string[]).includes(t.template_key))
          .map((template) => (
            <TemplateAccordionItem
              key={template.template_key}
              template={template}
              isDirty={dirtyMap[template.template_key] ?? false}
              canEdit={canEdit}
              onDirtyChange={handleDirtyChange}
              onSaved={handleSaved}
            />
          ))}
      </Accordion>

      {/* Groupe 2 : Rappels automatiques */}
      <TemplateGroupSeparator label="Rappels automatiques" />
      <Accordion type="single" collapsible className="space-y-2">
        {templates
          .filter((t) => (REMINDER_KEYS as string[]).includes(t.template_key))
          .map((template) => (
            <TemplateAccordionItem
              key={template.template_key}
              template={template}
              isDirty={dirtyMap[template.template_key] ?? false}
              canEdit={canEdit}
              onDirtyChange={handleDirtyChange}
              onSaved={handleSaved}
            />
          ))}
      </Accordion>
    </div>
  );
}
