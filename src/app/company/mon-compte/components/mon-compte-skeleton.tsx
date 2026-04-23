'use client';

import { User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Squelette de chargement pour la page Mon Compte — Espace Compagnie */
export function MonCompteSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
          <User className="w-7 h-7 text-gold" />
          Mon compte
        </h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
