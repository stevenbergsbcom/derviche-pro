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

// Composants admin réutilisables
import {
    AdminPageHeader,
    SearchInput,
    DeleteConfirmDialog,
} from '@/components/admin';

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingVenue, setEditingVenue] = useState<VenueRow | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<VenueRow | null>(null);
    const [viewingVenue, setViewingVenue] = useState<VenueRow | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

    // Filtrer les lieux selon la recherche
    const filteredVenues = useMemo(() => {
        if (!searchQuery.trim()) {
            return venues;
        }
        return venues.filter(
            (venue) =>
                searchMatch(venue.name, searchQuery) ||
                searchMatch(venue.city, searchQuery) ||
                searchMatch(venue.postal_code || '', searchQuery)
        );
    }, [searchQuery, venues]);

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
        // Vérifier si le lieu est utilisé
        const { used, count } = await checkUsage(venue.id);
        if (used) {
            setDeleteWarning(`Ce lieu est utilisé par ${count} représentation(s). Supprimez d'abord les représentations associées.`);
        } else {
            setDeleteWarning(null);
        }
        setVenueToDelete(venue);
    };

    const handleConfirmDelete = async () => {
        if (venueToDelete && !deleteWarning) {
            setIsSubmitting(true);
            const result = await remove(venueToDelete.id);
            setIsSubmitting(false);
            
            if (result.success) {
                setVenueToDelete(null);
            } else {
                // Afficher l'erreur (on pourrait ajouter un toast ici)
                console.error('Erreur suppression:', result.error);
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

    const handleViewToDelete = () => {
        if (viewingVenue) {
            const venueToRemove = viewingVenue;
            setViewingVenue(null);
            handleDeleteClick(venueToRemove);
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
                console.error('Erreur mise à jour:', result.error);
            }
        } else {
            const result = await create(formData as VenueInsert);
            if (result.success) {
                setIsFormDialogOpen(false);
            } else {
                console.error('Erreur création:', result.error);
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

            {/* Recherche */}
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher un lieu..."
            />

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
                confirmDisabled={!!deleteWarning}
            />
        </div>
    );
}
