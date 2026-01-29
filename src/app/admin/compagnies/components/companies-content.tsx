/**
 * Contenu principal de la page compagnies
 * Gère les états Loading/Error/Empty et affiche Table ou Cards
 * Session 107 - Refactorisation
 */

'use client';

import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin';
import { CompaniesTable } from './companies-table';
import { CompaniesCards } from './companies-cards';
import type { CompaniesContentProps } from '../types';

export function CompaniesContent({
  isLoading,
  error,
  searchQuery,
  companies,
  // totalCount est passé mais non utilisé ici (utilisé dans page.tsx)
  onRefresh,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onViewShows,
}: CompaniesContentProps) {
  // État de chargement initial
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Chargement des compagnies...</span>
        </div>
      </div>
    );
  }

  // Erreur de chargement
  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Gestion des Compagnies"
          actionLabel="Ajouter une compagnie"
          onAction={onCreate}
        />
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Erreur lors du chargement des compagnies : {error}
            <Button variant="link" onClick={onRefresh} className="ml-2">
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // État vide
  const isEmpty = companies.length === 0;
  const emptyMessage = searchQuery
    ? 'Aucune compagnie trouvée'
    : 'Aucune compagnie enregistrée';

  return (
    <>
      {/* Desktop : message vide dans la table */}
      {isEmpty ? (
        <div className="hidden lg:block rounded-md border bg-white">
          <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>
        </div>
      ) : (
        <CompaniesTable
          companies={companies}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewShows={onViewShows}
        />
      )}

      {/* Mobile : message vide ou cards */}
      {isEmpty ? (
        <div className="lg:hidden">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        </div>
      ) : (
        <CompaniesCards
          companies={companies}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewShows={onViewShows}
        />
      )}
    </>
  );
}
