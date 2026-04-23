'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';

interface SecurityCardProps {
  onOpenPasswordDialog: () => void;
}

/** Carte de sécurité avec accès au changement de mot de passe */
export function SecurityCard({ onOpenPasswordDialog }: SecurityCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Sécurité
        </CardTitle>
        <CardDescription>Gérez votre mot de passe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Mot de passe</p>
            <p className="text-muted-foreground text-sm">
              Changer votre mot de passe régulièrement améliore la sécurité
            </p>
          </div>
          <Button variant="outline" onClick={onOpenPasswordDialog}>
            <Key className="mr-2 h-4 w-4" />
            Changer le mot de passe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
