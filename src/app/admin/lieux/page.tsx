'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { VenueRow, VenueInsert } from '@/types/database';

// Hook Supabase
import { useVenues } from '@/hooks/useVenues';
import { logger } from '@/lib/logger';

// Composants admin réutilisables
import {
    AdminPageHeader,
    SearchInput,
    SortToggle,
    DeleteConfirmDialog,
} from '@/components/admin';
import type { SortDirection } from '@/components/admin';

// Composants spécifiques aux lieux
import {
    VenueFormDialog,
    VenueViewDialog,
    type VenueFormData,
} from '@/components/admin/lieux';

// Utilitaire de recherche
import { searchMatch } from '@/lib/utils';

export default function AdminLieuxPage() {
    // Hook Supabase pour les données
    const { venues, isLoading, error, refresh, create, update, remove, checkUsage } = useVenues();

    // États locaux
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortDir, setSortDir] = useState<SortDirection>('asc');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUsage, setIsCheckingUsage] = useState(false);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingVenue, setEditingVenue] = useState<VenueRow | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<VenueRow | null>(null);
    const [viewingVenue, setViewingVenue] = useState<VenueRow | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

    // Filtrer et trier les lieux
    const filteredVenues = useMemo(() => {
        const filtered = searchQuery.trim()
            ? venues.filter(
                  (venue) =>
                      searchMatch(venue.name, searchQuery) ||
                      searchMatch(venue.city, searchQuery) ||
                      searchMatch(venue.postal_code || '', searchQuery)
              )
            : venues;

        return [...filtered].sort((a, b) => {
            const cmp = a.name.localeCompare(b.name, 'fr');
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [searchQuery, venues, sortDir]);

    // === HANDLERS ===

    const handleCreate = () => {
        setEditingVenue(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (venue: VenueRow) => {
        setEditingVenue(venue);
        setIsFormDialogOpen(true);
    };

    const handleView = (venue: VenueRow) => {
        setViewingVenue(venue);
    };

    const handleDeleteClick = async (venue: VenueRow) => {
        setIsCheckingUsage(true);
        setVenueToDelete(venue);
        setDeleteWarning(null);

        const { used, count } = await checkUsage(venue.id);

        if (used) {
            setDeleteWarning(`Ce lieu est utilisé par ${count} représentation(s). Supprimez d'abord les représentations associées.`);
        }

        setIsCheckingUsage(false);
    };

    const handleConfirmDelete = async () => {
        if (venueToDelete && !deleteWarning) {
            setIsSubmitting(true);
            const result = await remove(venueToDelete.id);
            setIsSubmitting(false);

            if (result.success) {
                setVenueToDelete(null);
            } else {
                logger.error('Lieux - Erreur suppression', { error: result.error });
            }
        }
    };

    const handleViewToEdit = () => {
        if (viewingVenue) {
            const venueToEdit = viewingVenue;
            setViewingVenue(null);
            handleEdit(venueToEdit);
        }
    };

    const handleViewToDelete = async () => {
        if (viewingVenue) {
            const venueToRemove = viewingVenue;
            setViewingVenue(null);
            await handleDeleteClick(venueToRemove);
        }
    };

    const handleFormSubmit = async (formData: VenueFormData, isEditing: boolean) => {
        setIsSubmitting(true);

        if (isEditing && editingVenue) {
            const result = await update(editingVenue.id, formData);
            if (result.success) {
                setIsFormDialogOpen(false);
                setEditingVenue(null);
            } else {
                logger.error('Lieux - Erreur mise à jour', { error: result.error });
            }
        } else {
            const result = await create(formData as VenueInsert);
            if (result.success) {
                setIsFormDialogOpen(false);
            } else {
                logger.error('Lieux - Erreur création', { error: result.error });
            }
        }

        setIsSubmitting(false);
    };

    // État de chargement initial
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Chargement des lieux...</span>
                </div>
            </div>
        );
    }

    // Erreur de chargement
    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="Gestion des Lieux"
                    actionLabel="Ajouter un lieu"
                    onAction={handleCreate}
                />
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des lieux : {error}
                        <Button variant="link" onClick={refresh} className="ml-2">
                            Réessayer
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="Gestion des Lieux"
                actionLabel="Ajouter un lieu"
                onAction={handleCreate}
            />

            {/* Compteur */}
            <p className="text-sm text-muted-foreground">
                {filteredVenues.length} lieu{filteredVenues.length > 1 ? 'x' : ''}
                {searchQuery && ` (sur ${venues.length} au total)`}
            </p>

            {/* Recherche + Tri */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Rechercher un lieu..."
                    />
                </div>
                <SortToggle
                    direction={sortDir}
                    onToggle={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    label="Nom"
                />
            </div>

            {/* Tableau desktop */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Code postal</TableHead>
                            <TableHead>Capacité</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredVenues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    {searchQuery ? 'Aucun lieu trouvé' : 'Aucun lieu enregistré'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredVenues.map((venue) => (
                                <TableRow key={venue.id}>
                                    <TableCell className="font-medium">
                                        <button
                                            onClick={() => handleView(venue)}
                                            className="cursor-pointer hover:text-derviche hover:underline text-left"
                                        >
                                            {venue.name}
                                        </button>
                                    </TableCell>
                                    <TableCell>{venue.city}</TableCell>
                                    <TableCell>{venue.postal_code || '-'}</TableCell>
                                    <TableCell>{venue.capacity ? `${venue.capacity} places` : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleView(venue)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="sr-only">Voir</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEdit(venue)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(venue)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes mobile */}
            <div className="lg:hidden space-y-4">
                {filteredVenues.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {searchQuery ? 'Aucun lieu trouvé' : 'Aucun lieu enregistré'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredVenues.map((venue) => (
                        <Card key={venue.id}>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3
                                            className="font-semibold cursor-pointer hover:text-derviche hover:underline"
                                            onClick={() => handleView(venue)}
                                        >
                                            {venue.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {venue.city}
                                            {venue.postal_code && ` (${venue.postal_code})`}
                                        </p>
                                    </div>
                                    {venue.capacity && (
                                        <span className="text-sm text-muted-foreground">
                                            {venue.capacity} places
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleView(venue)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Voir
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(venue)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Modifier
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteClick(venue)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* === MODALES === */}

            <VenueFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                editingVenue={editingVenue}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
            />

            <VenueViewDialog
                venue={viewingVenue}
                onClose={() => setViewingVenue(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
            />

            <DeleteConfirmDialog
                open={!!venueToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setVenueToDelete(null);
                        setDeleteWarning(null);
                    }
                }}
                onConfirm={handleConfirmDelete}
                title="Supprimer ce lieu ?"
                description={
                    deleteWarning
                        ? deleteWarning
                        : `Êtes-vous sûr de vouloir supprimer le lieu « ${venueToDelete?.name} » ? Cette action est irréversible.`
                }
                confirmDisabled={!!deleteWarning || isCheckingUsage}
                isSubmitting={isSubmitting || isCheckingUsage}
            />
        </div>
    );
}
