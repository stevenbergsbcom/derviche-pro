/**
 * Sous-composant : formulaire d'informations compagnie
 * Extrait de company-dialog.tsx — S160
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { InformationsFormProps } from './types';

export function InformationsForm({
  formData,
  validationErrors,
  isSubmitting,
  error,
  onFieldChange,
}: InformationsFormProps) {
  return (
    <div className="space-y-4 py-4 px-1">
      {/* Erreur serveur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="company-name">
          Nom de la compagnie <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company-name"
          value={formData.name ?? ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="Ex: Compagnie du Soleil"
          disabled={isSubmitting}
          className={validationErrors.name ? 'border-destructive' : ''}
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>

      {/* Ville */}
      <div className="space-y-2">
        <Label htmlFor="company-city">Ville</Label>
        <Input
          id="company-city"
          value={formData.city ?? ''}
          onChange={(e) => onFieldChange('city', e.target.value)}
          placeholder="Ex: Lyon"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="company-description">Description</Label>
        <Textarea
          id="company-description"
          value={formData.description ?? ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Présentation de la compagnie..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Site web */}
      <div className="space-y-2">
        <Label htmlFor="company-website">Site web</Label>
        <Input
          id="company-website"
          type="url"
          value={formData.website ?? ''}
          onChange={(e) => onFieldChange('website', e.target.value)}
          placeholder="https://www.compagnie.fr"
          disabled={isSubmitting}
        />
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <Label htmlFor="company-contact-name">Nom du contact</Label>
        <Input
          id="company-contact-name"
          value={formData.contact_name ?? ''}
          onChange={(e) => onFieldChange('contact_name', e.target.value)}
          placeholder="Ex: Jean Dupont"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company-contact-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company-contact-email"
            type="email"
            value={formData.contact_email ?? ''}
            onChange={(e) => onFieldChange('contact_email', e.target.value)}
            placeholder="contact@compagnie.fr"
            disabled={isSubmitting}
            className={validationErrors.contact_email ? 'border-destructive' : ''}
          />
          {validationErrors.contact_email && (
            <p className="text-sm text-destructive">{validationErrors.contact_email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-contact-phone">Téléphone</Label>
          <Input
            id="company-contact-phone"
            type="tel"
            value={formData.contact_phone ?? ''}
            onChange={(e) => onFieldChange('contact_phone', e.target.value || null)}
            placeholder="01 23 45 67 89"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
