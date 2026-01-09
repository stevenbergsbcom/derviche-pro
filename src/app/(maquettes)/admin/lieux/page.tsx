'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    mockVenues,
    generateMockId,
    type MockVenue,
} from '@/lib/mock-data';

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

export default function AdminLieuxPage() {
    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Données
    const [venues, setVenues] = useState<MockVenue[]>(mockVenues);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingVenue, setEditingVenue] = useState<MockVenue | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<MockVenue | null>(null);
    const [viewingVenue, setViewingVenue] = useState<MockVenue | null>(null);

    // Filtrer les lieux selon la recherche
    const filteredVenues = useMemo(() => {
        if (!searchQuery.trim()) {
            return venues;
        }
        const query = searchQuery.toLowerCase();
        return venues.filter(
            (venue) =>
                venue.name.toLowerCase().includes(query) ||
                venue.city.toLowerCase().includes(query) ||
                (venue.postalCode?.toLowerCase().includes(query) ?? false)
        );
    }, [searchQuery, venues]);

    // Attendre que le composant soit monté
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // === HANDLERS ===

    const handleCreate = () => {
        setEditingVenue(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (venue: MockVenue) => {
        setEditingVenue(venue);
        setIsFormDialogOpen(true);
    };

    const handleView = (venue: MockVenue) => {
        setViewingVenue(venue);
    };

    const handleDeleteClick = (venue: MockVenue) => {
        setVenueToDelete(venue);
    };

    const handleConfirmDelete = () => {
        if (venueToDelete) {
            setVenues((prev) => prev.filter((v) => v.id !== venueToDelete.id));
            setVenueToDelete(null);
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

    const handleFormSubmit = (formData: VenueFormData, isEditing: boolean) => {
        if (isEditing && editingVenue) {
            setVenues((prev) =>
                prev.map((v) =>
                    v.id === editingVenue.id ? { ...v, ...formData } : v
                )
            );
        } else {
            const newId = generateMockId('venue');
            setVenues((prev) => [...prev, { id: newId, ...formData }]);
        }
        setEditingVenue(null);
    };

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
                                    Aucun lieu trouvé
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
                                    <TableCell>{venue.postalCode || '-'}</TableCell>
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
                            Aucun lieu trouvé
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
                                            {venue.postalCode && ` (${venue.postalCode})`}
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
            />

            <VenueViewDialog
                venue={viewingVenue}
                onClose={() => setViewingVenue(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
            />

            <DeleteConfirmDialog
                open={!!venueToDelete}
                onOpenChange={(open) => !open && setVenueToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer ce lieu ?"
                description={`Êtes-vous sûr de vouloir supprimer le lieu « ${venueToDelete?.name} » ? Cette action est irréversible.`}
            />
        </div>
    );
}
