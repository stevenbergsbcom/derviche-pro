/**
 * Section Informations professionnelles du formulaire d'édition
 * Derviche Diffusion - Session 111
 */

'use client';

import { Info, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CrmIdInput } from '@/components/admin/crm-id-input';
import { LABELS } from '../constants';
import type { ProfessionalInfoSectionProps } from '../types';

export function ProfessionalInfoSection({
  organization,
  function: functionValue,
  afcNumber,
  crmId,
  crmStructureId,
  isGuest,
  onChange,
  disabled,
}: ProfessionalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">{LABELS.sectionProfessional}</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Structure / Organisation */}
        <div className="space-y-2">
          <Label htmlFor="organization">{LABELS.organization}</Label>
          <Input
            id="organization"
            value={organization || ''}
            onChange={(e) => onChange('organization', e.target.value || null)}
            disabled={disabled}
            autoComplete="organization"
          />
        </div>

        {/* Fonction */}
        <div className="space-y-2">
          <Label htmlFor="function">{LABELS.function}</Label>
          <Input
            id="function"
            value={functionValue || ''}
            onChange={(e) => onChange('function', e.target.value || null)}
            disabled={disabled}
            autoComplete="organization-title"
          />
        </div>

        {/* Numéro AFC */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="afcNumber">{LABELS.afcNumber}</Label>
          <Input
            id="afcNumber"
            value={afcNumber || ''}
            onChange={(e) => onChange('afcNumber', e.target.value || null)}
            disabled={disabled}
          />
        </div>

        {/*
          ID CRM Zoho contact (S174)
          - Résa guest (isGuest=true) → champ éditable, valeur sur reservations.crm_id
          - Résa avec compte (isGuest=false) → champ lecture seule, valeur héritée
            de profiles.crm_id via la jointure `booked_by` (modifiable depuis la
            fiche du pro, pas depuis la résa — source de vérité unique).
        */}
        <div className="sm:col-span-2">
          {isGuest ? (
            <CrmIdInput
              value={crmId}
              onChange={(value) => onChange('crmId', value)}
              disabled={disabled}
            />
          ) : (
            <div className="space-y-2">
              <Label
                htmlFor="crm_id_readonly"
                className="flex items-center gap-1.5 text-sm"
              >
                ID CRM (Zoho)
                <Lock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </Label>
              <Input
                id="crm_id_readonly"
                type="text"
                value={crmId ?? ''}
                placeholder="—"
                readOnly
                disabled
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Hérité de la fiche du professionnel. Pour modifier,
                  ouvrir la fiche du pro depuis l&apos;onglet Professionnels.
                </span>
              </p>
            </div>
          )}
        </div>

        {/*
          ID CRM Zoho structure (Session B)
          - Résa guest → éditable, valeur sur reservations.crm_structure_id
          - Résa avec compte → lecture seule, valeur héritée de
            profiles.crm_structure_id via `booked_by`.
        */}
        <div className="sm:col-span-2">
          {isGuest ? (
            <CrmIdInput
              id="crm_structure_id"
              label="ID CRM structure (Zoho)"
              value={crmStructureId}
              onChange={(value) => onChange('crmStructureId', value)}
              disabled={disabled}
              helpText="Identifiant de la structure du pro dans votre CRM Zoho (~17 chiffres). Optionnel."
            />
          ) : (
            <div className="space-y-2">
              <Label
                htmlFor="crm_structure_id_readonly"
                className="flex items-center gap-1.5 text-sm"
              >
                ID CRM structure (Zoho)
                <Lock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </Label>
              <Input
                id="crm_structure_id_readonly"
                type="text"
                value={crmStructureId ?? ''}
                placeholder="—"
                readOnly
                disabled
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Hérité de la fiche du professionnel. Pour modifier,
                  ouvrir la fiche du pro depuis l&apos;onglet Professionnels.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
