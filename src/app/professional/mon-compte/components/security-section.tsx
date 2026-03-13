/**
 * SecuritySection — Carte compte et sécurité
 * Derviche Diffusion - Mon Compte
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, Key } from 'lucide-react';

import type { ProProfile } from '../types';

// ============================================
// PROPS
// ============================================

interface SecuritySectionProps {
  profile: ProProfile;
  onOpenPasswordDialog: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function SecuritySection({ profile, onOpenPasswordDialog }: SecuritySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4 text-derviche" />
          Compte et sécurité
        </CardTitle>
        <CardDescription>Email et mot de passe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Email
          </p>
          <p className="font-medium">{profile.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            L&apos;email ne peut pas être modifié directement. Contactez Derviche Diffusion si
            nécessaire.
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Membre depuis</p>
          <p className="font-medium">
            {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">Mot de passe</p>
              <p className="text-xs text-muted-foreground">
                Changez régulièrement votre mot de passe
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenPasswordDialog}>
              <Key className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
