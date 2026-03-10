'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  ArrowLeft,
  Copy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// Composants admin réutilisables
import { DeleteConfirmDialog } from '@/components/admin';

// Composants spécifiques aux représentations
import {
  RepresentationFormDialog,
  VenueQuickCreateDialog,
  GenerateSeriesDialog,
} from '@/components/admin/representations';

// Composants locaux
import {
  RepresentationFilters,
  RepresentationTableRow,
  RepresentationCard,
} from './components';

// Hook principal
import { useRepresentationsPage } from './hooks';

// Helpers pour le formatage
import { formatDate } from './helpers';

// ============================================
// COMPOSANT PRINCIPAL (ORCHESTRATEUR)
// ============================================

export default function AdminRepresentationsPage() {
  const {
    // Données
    show,
    representations,
    venues,
    internalUsers,

    // Filtres
    monthFilter,
    venueFilter,
    dateSearch,
    availableMonths,
    usedVenues,
    filteredRepresentations,
    hasActiveFilters,

    // Tri & masquage
    sortDir,
    hidePast,
    pastCount,
    todayStr,
    setSortDir,
    setHidePast,

    // États UI
    isLoading,
    loadingError,
    isExterne,

    // Modales
    isFormDialogOpen,
    editingRepresentation,
    editingReservationsCount,
    representationToDelete,
    deleteReservationsCount,
    deleteError,
    isNewVenueDialogOpen,
    newVenueSource,
    isGenerateSeriesOpen,
    newlyCreatedVenueId,
    isSubmitting,

    // Actions - Filtres
    setMonthFilter,
    setVenueFilter,
    setDateSearch,
    resetFilters,

    // Actions - Modales
    setIsFormDialogOpen,
    setIsGenerateSeriesOpen,
    setIsNewVenueDialogOpen,
    clearEditingState,
    clearDeleteState,
    clearNewlyCreatedVenueId,

    // Actions - CRUD
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleFormSubmit,
    handleGenerateSeriesSubmit,

    // Actions - Venues
    handleOpenNewVenueDialog,
    handleCreateVenue,
    handleVenueCreated,

    // Actions - Refresh
    refreshAllData,
  } = useRepresentationsPage();

  // ============================================
  // ÉTATS DE CHARGEMENT ET D'ERREUR
  // ============================================

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-derviche" aria-hidden="true" />
        <span className="sr-only">Chargement des représentations...</span>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] gap-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle className="w-12 h-12 text-destructive" aria-hidden="true" />
        <p className="text-destructive">Erreur : {loadingError}</p>
        <Button
          onClick={() => void refreshAllData()}
          variant="outline"
          aria-label="Réessayer le chargement des données"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Si show est null mais les données sont chargées, le hook gère la redirection
  if (!show) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-derviche" aria-hidden="true" />
        <span className="sr-only">Redirection...</span>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header contextuel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/spectacles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-derviche transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Retour aux spectacles
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-derviche-dark truncate">
            Représentations de « {show.title} »
          </h1>
          <p className="text-sm text-muted-foreground">
            {show.company?.name || 'Compagnie inconnue'}
          </p>
        </div>

        {/* Boutons (masqués pour les externes) */}
        {!isExterne && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsGenerateSeriesOpen(true)}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              aria-label="Générer une série de représentations"
            >
              <Copy className="w-4 h-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Générer une série</span>
            </Button>
            <Button
              onClick={handleCreate}
              className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
              disabled={isSubmitting}
              aria-label="Ajouter une représentation"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              <span className="sm:hidden">Ajouter</span>
              <span className="hidden sm:inline">Ajouter une représentation</span>
            </Button>
          </div>
        )}
      </div>

      {/* Barre de filtres */}
      <RepresentationFilters
        filteredCount={filteredRepresentations.length}
        totalCount={representations.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        availableMonths={availableMonths}
        venueFilter={venueFilter}
        onVenueFilterChange={setVenueFilter}
        usedVenues={usedVenues}
        dateSearch={dateSearch}
        onDateSearchChange={setDateSearch}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        hidePast={hidePast}
        onHidePastChange={setHidePast}
        pastCount={pastCount}
      />

      {/* Tableau desktop */}
      <div className="hidden lg:block rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Places max</TableHead>
              <TableHead>Accueil</TableHead>
              {!isExterne && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRepresentations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isExterne ? 5 : 6}
                  className="text-center text-muted-foreground py-8"
                >
                  Aucune représentation trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredRepresentations.map((rep) => (
                <RepresentationTableRow
                  key={rep.id}
                  representation={rep}
                  internalUsers={internalUsers}
                  isExterne={isExterne}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isSubmitting={isSubmitting}
                  isPast={rep.date < todayStr}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cartes mobile */}
      <div className="lg:hidden space-y-4">
        {filteredRepresentations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune représentation trouvée
            </CardContent>
          </Card>
        ) : (
          filteredRepresentations.map((rep) => (
            <RepresentationCard
              key={rep.id}
              representation={rep}
              internalUsers={internalUsers}
              isExterne={isExterne}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isSubmitting={isSubmitting}
              isPast={rep.date < todayStr}
            />
          ))
        )}
      </div>

      {/* === MODALES === */}

      {/* Formulaire création/édition */}
      <RepresentationFormDialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          setIsFormDialogOpen(open);
          if (!open) {
            clearEditingState();
          }
        }}
        editingRepresentation={editingRepresentation}
        onSubmit={handleFormSubmit}
        venues={venues}
        dervisheUsers={internalUsers}
        onOpenNewVenueDialog={() => handleOpenNewVenueDialog('simple')}
        newlyCreatedVenueId={newVenueSource === 'simple' ? newlyCreatedVenueId : null}
        onClearNewlyCreatedVenueId={clearNewlyCreatedVenueId}
        hasReservations={editingReservationsCount > 0}
      />

      {/* Génération de série */}
      <GenerateSeriesDialog
        open={isGenerateSeriesOpen}
        onOpenChange={setIsGenerateSeriesOpen}
        onSubmit={handleGenerateSeriesSubmit}
        venues={venues}
        dervisheUsers={internalUsers}
        existingRepresentations={representations}
        onOpenNewVenueDialog={() => handleOpenNewVenueDialog('series')}
        newlyCreatedVenueId={newVenueSource === 'series' ? newlyCreatedVenueId : null}
        onClearNewlyCreatedVenueId={clearNewlyCreatedVenueId}
      />

      {/* Création de lieu */}
      <VenueQuickCreateDialog
        open={isNewVenueDialogOpen}
        onOpenChange={setIsNewVenueDialogOpen}
        onCreateVenue={handleCreateVenue}
        onVenueCreated={handleVenueCreated}
      />

      {/* Confirmation de suppression */}
      <DeleteConfirmDialog
        open={!!representationToDelete}
        onOpenChange={(open) => {
          if (!open) {
            clearDeleteState();
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
        isSubmitting={isSubmitting}
        confirmDisabled={deleteReservationsCount > 0}
        error={deleteError}
        title={deleteReservationsCount > 0 ? 'Suppression impossible' : 'Supprimer cette représentation ?'}
        description={
          representationToDelete && deleteReservationsCount > 0 ? (
            <div className="space-y-2 mt-2">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    {deleteReservationsCount} réservation{deleteReservationsCount > 1 ? 's' : ''} existante
                    {deleteReservationsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Impossible de supprimer une représentation avec des réservations. Annulez d&apos;abord
                    les réservations concernées.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Représentation du <strong>{formatDate(representationToDelete.date)}</strong> à{' '}
                <strong>{representationToDelete.time}</strong>
              </p>
            </div>
          ) : (
            <span>
              Êtes-vous sûr de vouloir supprimer la représentation du{' '}
              <strong>{representationToDelete && formatDate(representationToDelete.date)}</strong> à{' '}
              <strong>{representationToDelete?.time}</strong> ? Cette action est irréversible.
            </span>
          )
        }
      />
    </div>
  );
}
