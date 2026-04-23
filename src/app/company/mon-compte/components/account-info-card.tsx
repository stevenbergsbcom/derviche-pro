'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail } from 'lucide-react';
import type { UserProfile } from './types';
import { formatRole, getRoleBadgeClass } from './types';

interface AccountInfoCardProps {
  userData: UserProfile;
}

/** Carte d'informations de compte et d'accès (email, rôle, ancienneté) */
export function AccountInfoCard({ userData }: AccountInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compte et accès
        </CardTitle>
        <CardDescription>Informations de connexion et permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Email
          </p>
          <p className="font-medium">{userData.email}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            L&apos;email ne peut pas être modifié. Contactez Derviche Diffusion si
            nécessaire.
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Rôle</p>
          <Badge className={getRoleBadgeClass(userData.role)}>
            {formatRole(userData.role)}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Membre depuis</p>
          <p className="font-medium">
            {new Date(userData.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
