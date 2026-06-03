/**
 * Section Informations professionnelles du formulaire
 * Derviche Diffusion - Session 104
 */

'use client';

import { Building } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CrmIdInput } from '@/components/admin/crm-id-input';
import type { ProfessionalInfoSectionProps } from '../types';
import { LABELS, PLACEHOLDERS } from '../constants';

export function ProfessionalInfoSection({
  organization,
  function: functionField, // 'function' est un mot réservé
  afcNumber,
  crmId,
  crmStructureId,
  onChange,
  disabled,
}: ProfessionalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Building className="w-4 h-4" aria-hidden="true" />
        {LABELS.sectionProfessional}
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Organisation */}
        <div className="space-y-2">
          <Label htmlFor="organization">{LABELS.organization}</Label>
          <Input
            id="organization"
            value={organization || ''}
            onChange={(e) => onChange('organization', e.target.value || null)}
            placeholder={PLACEHOLDERS.organization}
            disabled={disabled}
            autoComplete="organization"
          />
        </div>
        
        {/* Fonction */}
        <div className="space-y-2">
          <Label htmlFor="function">{LABELS.function}</Label>
          <Input
            id="function"
            value={functionField || ''}
            onChange={(e) => onChange('function', e.target.value || null)}
            placeholder={PLACEHOLDERS.function}
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
            placeholder={PLACEHOLDERS.afcNumber}
            disabled={disabled}
          />
        </div>

        {/*
          ID CRM Zoho contact (S174)
          Une résa créée depuis l'admin est toujours en mode guest
          (user_id IS NULL côté BDD) → le champ est toujours pertinent.
        */}
        <div className="sm:col-span-2">
          <CrmIdInput
            value={crmId}
            onChange={(value) => onChange('crmId', value)}
            disabled={disabled}
          />
        </div>

        {/*
          ID CRM Zoho structure (Session B)
          Toujours guest côté admin — donc toujours éditable.
        */}
        <div className="sm:col-span-2">
          <CrmIdInput
            id="crm_structure_id"
            label="ID CRM structure (Zoho)"
            value={crmStructureId}
            onChange={(value) => onChange('crmStructureId', value)}
            disabled={disabled}
            helpText="Identifiant de la structure du pro dans votre CRM Zoho (~17 chiffres). Optionnel."
          />
        </div>
      </div>
    </div>
  );
}
