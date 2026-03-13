/**
 * PersonalSection — Carte informations personnelles
 * Derviche Diffusion - Mon Compte
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Save, Loader2 } from 'lucide-react';

import type { SectionCardProps } from '../types';
import { ReadField } from './read-field';

export function PersonalSection({
  profile,
  formData,
  editingSection,
  isSaving,
  onFormChange,
  onEdit,
  onSave,
  onCancelEdit,
}: SectionCardProps) {
  const isEditing = editingSection === 'personal';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-derviche" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Prénom, nom, téléphone, email secondaire</CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Modifier les informations personnelles"
              onClick={() => onEdit('personal')}
            >
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onFormChange({ firstName: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onFormChange({ lastName: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onFormChange({ phone: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">Téléphone secondaire</Label>
                <Input
                  id="phone2"
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) => onFormChange({ phone2: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email2">Email secondaire</Label>
                <Input
                  id="email2"
                  type="email"
                  value={formData.email2}
                  onChange={(e) => onFormChange({ email2: e.target.value })}
                  disabled={isSaving}
                  placeholder="contact@exemple.fr"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onCancelEdit('personal')}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                onClick={() => void onSave('personal')}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadField label="Prénom" value={profile.firstName} />
            <ReadField label="Nom" value={profile.lastName} />
            <ReadField label="Téléphone" value={profile.phone} />
            <ReadField label="Téléphone secondaire" value={profile.phone2} />
            <ReadField label="Email secondaire" value={profile.email2} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
