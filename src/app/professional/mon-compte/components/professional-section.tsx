/**
 * ProfessionalSection — Carte informations professionnelles
 * Derviche Diffusion - Mon Compte
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Save, Loader2 } from 'lucide-react';

import type { SectionCardProps } from '../types';
import { ReadField } from './read-field';

export function ProfessionalSection({
  profile,
  formData,
  editingSection,
  isSaving,
  onFormChange,
  onEdit,
  onSave,
  onCancelEdit,
}: SectionCardProps) {
  const isEditing = editingSection === 'professional';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-derviche" />
              Informations professionnelles
            </CardTitle>
            <CardDescription>Structure, fonction, numéro AFC</CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Modifier les informations professionnelles"
              onClick={() => onEdit('professional')}
            >
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="organization">Structure / Organisation</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => onFormChange({ organization: e.target.value })}
                disabled={isSaving}
                placeholder="Nom de votre structure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proFunction">Fonction</Label>
              <Input
                id="proFunction"
                value={formData.function}
                onChange={(e) => onFormChange({ function: e.target.value })}
                disabled={isSaving}
                placeholder="Votre fonction dans la structure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afcNumber">Numéro AFC</Label>
              <Input
                id="afcNumber"
                value={formData.afcNumber}
                onChange={(e) => onFormChange({ afcNumber: e.target.value })}
                disabled={isSaving}
                placeholder="Ex: 12345"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onCancelEdit('professional')}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                onClick={() => void onSave('professional')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <ReadField label="Structure / Organisation" value={profile.organization} />
            <ReadField label="Fonction" value={profile.function} />
            <ReadField label="Numéro AFC" value={profile.afcNumber} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
