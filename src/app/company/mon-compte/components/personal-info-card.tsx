'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Save, Loader2 } from 'lucide-react';
import type { UserProfile, ProfileFormData } from './types';

interface PersonalInfoCardProps {
  userData: UserProfile;
  formData: ProfileFormData;
  isEditing: boolean;
  isSaving: boolean;
  onFormDataChange: (data: ProfileFormData) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

/** Carte d'informations personnelles avec mode lecture et édition */
export function PersonalInfoCard({
  userData,
  formData,
  isEditing,
  isSaving,
  onFormDataChange,
  onStartEdit,
  onCancelEdit,
  onSave,
}: PersonalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Vos informations de profil</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={onStartEdit}>
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
                  onChange={(e) =>
                    onFormDataChange({ ...formData, firstName: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, lastName: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  onFormDataChange({ ...formData, phone: e.target.value })
                }
                disabled={isSaving}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onCancelEdit}
                className="flex-1"
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                onClick={onSave}
                className="flex-1 bg-derviche hover:bg-derviche-light"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Prénom</p>
                <p className="font-medium">{userData.firstName || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Nom</p>
                <p className="font-medium">{userData.lastName || 'Non renseigné'}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Téléphone</p>
              <p className="font-medium">{userData.phone || 'Non renseigné'}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
