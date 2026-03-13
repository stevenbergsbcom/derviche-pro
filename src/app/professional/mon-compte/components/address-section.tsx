/**
 * AddressSection — Carte adresse postale
 * Derviche Diffusion - Mon Compte
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save, Loader2 } from 'lucide-react';

import type { SectionCardProps } from '../types';
import { ReadField } from './read-field';

export function AddressSection({
  profile,
  formData,
  editingSection,
  isSaving,
  onFormChange,
  onEdit,
  onSave,
  onCancelEdit,
}: SectionCardProps) {
  const isEditing = editingSection === 'address';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-derviche" />
              Adresse
            </CardTitle>
            <CardDescription>Adresse postale complète</CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Modifier l'adresse"
              onClick={() => onEdit('address')}
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
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => onFormChange({ address: e.target.value })}
                disabled={isSaving}
                placeholder="Numéro et nom de rue"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => onFormChange({ postalCode: e.target.value })}
                  disabled={isSaving}
                  placeholder="75000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => onFormChange({ city: e.target.value })}
                  disabled={isSaving}
                  placeholder="Paris"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => onFormChange({ country: e.target.value })}
                disabled={isSaving}
                placeholder="France"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onCancelEdit('address')}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                onClick={() => void onSave('address')}
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
            <ReadField label="Adresse" value={profile.address} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadField label="Code postal" value={profile.postalCode} />
              <ReadField label="Ville" value={profile.city} />
            </div>
            <ReadField label="Pays" value={profile.country} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
