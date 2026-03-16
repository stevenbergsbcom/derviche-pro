/**
 * DangerZoneSection — Carte zone dangereuse (suppression de compte)
 * Derviche Diffusion - Mon Compte
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2 } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface DangerZoneSectionProps {
  /** Ouvre le dialog de confirmation de suppression */
  onOpenDeleteDialog: () => void;
}

// ============================================
// COMPONENT
// ============================================

/** Zone dangereuse avec le bouton de suppression du compte */
export function DangerZoneSection({ onOpenDeleteDialog }: DangerZoneSectionProps) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="w-4 h-4" />
          Zone dangereuse
        </CardTitle>
        <CardDescription>Actions irréversibles sur votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Supprimer mon compte</p>
            <p className="text-xs text-muted-foreground">
              Supprime définitivement votre compte et toutes vos données personnelles. Vos
              réservations futures seront annulées. Cette action est irréversible.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={onOpenDeleteDialog}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
