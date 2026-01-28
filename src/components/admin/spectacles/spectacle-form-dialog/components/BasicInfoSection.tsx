/**
 * Section informations de base (titre, compagnie)
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BasicInfoSectionProps } from '../types';

export function BasicInfoSection({
  title,
  slug,
  companyId,
  companies,
  onTitleChange,
  onCompanyChange,
  onOpenNewCompanyDialog,
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Titre + Slug affiché */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        {slug && (
          <p className="text-xs text-muted-foreground">
            Slug : <span className="font-mono">{slug}</span>
          </p>
        )}
      </div>

      {/* Compagnie */}
      <div className="space-y-2">
        <Label htmlFor="companyId">Compagnie *</Label>
        <Select
          value={companyId ? String(companyId) : ''}
          onValueChange={(value) => {
            if (value === 'new') {
              onOpenNewCompanyDialog();
            } else {
              onCompanyChange(value);
            }
          }}
          required
        >
          <SelectTrigger id="companyId" aria-label="Choisir une compagnie">
            <SelectValue placeholder="Sélectionner une compagnie" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={String(company.id)}>
                {company.name}
              </SelectItem>
            ))}
            <div className="border-t my-1" />
            <SelectItem value="new" className="text-derviche font-medium">
              ➕ Créer une nouvelle compagnie...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
