'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Venue {
    id: number;
    name: string;
    city: string;
    address?: string;
    postalCode?: string;
    capacity?: number;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    latitude?: number;
    longitude?: number;
    pmrAccessible?: boolean;
    parking?: boolean;
    transports?: string;
}

// Données mock
const venuesMock: Venue[] = [
    {
        id: 1,
        name: 'Théâtre de la Ville',
        address: '2, place du Châtelet',
        postalCode: '75001',
        city: 'Paris',
        capacity: 1000,
        description: 'Grand théâtre parisien au cœur de la capitale',
        contactEmail: 'contact@theatredelaville.fr',
        contactPhone: '01 42 74 22 77',
        latitude: 48.8584,
        longitude: 2.3470,
        pmrAccessible: true,
        parking: false,
        transports: 'Métro Châtelet (lignes 1, 4, 7, 11, 14)',
    },
    {
        id: 2,
        name: 'Théâtre du Rond-Point',
        address: '2 bis, avenue Franklin D. Roosevelt',
        postalCode: '75008',
        city: 'Paris',
        capacity: 450,
        contactEmail: 'accueil@rondpoint.fr',
        contactPhone: '01 44 95 98 21',
        pmrAccessible: true,
        parking: true,
        transports: 'Métro Franklin D. Roosevelt (lignes 1, 9)',
    },
    {
        id: 3,
        name: 'La Colline',
        address: '15, rue Malte-Brun',
        postalCode: '75020',
        city: 'Paris',
        capacity: 200,
        contactEmail: 'billetterie@colline.fr',
        contactPhone: '01 44 62 52 00',
        pmrAccessible: false,
        parking: false,
        transports: 'Métro Gambetta (ligne 3)',
    },
    {
        id: 4,
        name: 'Théâtre de Belleville',
        address: '94, rue du Faubourg du Temple',
        postalCode: '75011',
        city: 'Paris',
        capacity: 120,
        contactEmail: 'contact@theatre-belleville.fr',
        contactPhone: '01 48 06 72 34',
        pmrAccessible: true,
        parking: false,
    },
    {
        id: 5,
        name: 'Le Monfort',
        address: '106, rue Brancion',
        postalCode: '75015',
        city: 'Paris',
        capacity: 350,
        contactEmail: 'info@lemonfort.fr',
        contactPhone: '01 56 08 33 88',
        pmrAccessible: true,
        parking: true,
        transports: 'Métro Porte de Vanves (ligne 13)',
    },
];

export default function AdminLieuxPage() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
    const [viewingVenue, setViewingVenue] = useState<Venue | null>(null);
    const [formData, setFormData] = useState<Omit<Venue, 'id'>>({
        name: '',
        city: '',
        address: '',
        postalCode: '',
        capacity: undefined,
        description: '',
        contactEmail: '',
        contactPhone: '',
        latitude: undefined,
        longitude: undefined,
        pmrAccessible: false,
        parking: false,
        transports: '',
    });

    // Filtrer les lieux selon la recherche
    const filteredVenues = useMemo(() => {
        if (!searchQuery.trim()) {
            return venuesMock;
        }

        const query = searchQuery.toLowerCase();
        return venuesMock.filter(
            (venue) =>
                venue.name.toLowerCase().includes(query) ||
                venue.city.toLowerCase().includes(query) ||
                (venue.postalCode?.toLowerCase().includes(query) ?? false)
        );
    }, [searchQuery]);

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingVenue(null);
        setFormData({
            name: '',
            city: '',
            address: '',
            postalCode: '',
            capacity: undefined,
            description: '',
            contactEmail: '',
            contactPhone: '',
            latitude: undefined,
            longitude: undefined,
            pmrAccessible: false,
            parking: false,
            transports: '',
        });
        setIsDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (venue: Venue) => {
        setEditingVenue(venue);
        setFormData({
            name: venue.name,
            city: venue.city,
            address: venue.address || '',
            postalCode: venue.postalCode || '',
            capacity: venue.capacity,
            description: venue.description || '',
            contactEmail: venue.contactEmail || '',
            contactPhone: venue.contactPhone || '',
            latitude: venue.latitude,
            longitude: venue.longitude,
            pmrAccessible: venue.pmrAccessible || false,
            parking: venue.parking || false,
            transports: venue.transports || '',
        });
        setIsDialogOpen(true);
    };

    // Gérer la suppression
    const handleDeleteClick = (venue: Venue) => {
        setVenueToDelete(venue);
    };

    // Confirmer la suppression
    const handleConfirmDelete = () => {
        // En production : DELETE /api/venues/:id
        // Pour la maquette : juste fermer la modale
        setVenueToDelete(null);
    };

    // Ouvrir la modale de visualisation
    const handleView = (venue: Venue) => {
        setViewingVenue(venue);
    };

    // Fermer la modale de visualisation et ouvrir l'édition
    const handleViewToEdit = () => {
        if (viewingVenue) {
            const venueToEdit = viewingVenue;
            setViewingVenue(null);
            handleEdit(venueToEdit);
        }
    };

    // Fermer la modale de visualisation et ouvrir la suppression
    const handleViewToDelete = () => {
        if (viewingVenue) {
            const venueToRemove = viewingVenue;
            setViewingVenue(null);
            handleDeleteClick(venueToRemove);
        }
    };

    // Fermer la modale
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingVenue(null);
    };

    // Soumettre le formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // En production : POST /api/venues ou PUT /api/venues/:id
        // Pour la maquette : juste fermer la modale
        handleCloseDialog();
    };

    return (
        <div className="space-y-6">
            {/* Header avec titre et bouton */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
                    Gestion des Lieux
                </h1>
                <Button
                    className="bg-derviche hover:bg-derviche-light text-white w-full lg:w-auto"
                    onClick={handleCreate}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un lieu
                </Button>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Rechercher un lieu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tableau des lieux - Desktop uniquement */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredVenues.map((venue) => (
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
                                <TableCell className="text-muted-foreground">
                                    {venue.contactEmail || '-'}
                                </TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes des lieux - Mobile uniquement */}
            <div className="lg:hidden space-y-4">
                {filteredVenues.map((venue) => (
                    <Card key={venue.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle
                                        className="text-lg mb-1 cursor-pointer hover:text-derviche hover:underline"
                                        onClick={() => handleView(venue)}
                                    >
                                        {venue.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{venue.city}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">Contact</p>
                                <p className="text-sm text-muted-foreground">{venue.contactEmail || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleView(venue)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEdit(venue)}
                                >
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
                ))}
            </div>

            {/* Modale création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVenue ? 'Modifier le lieu' : 'Ajouter un lieu'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingVenue
                                ? 'Modifiez les informations du lieu ci-dessous.'
                                : 'Remplissez les informations pour créer un nouveau lieu.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-1">
                            <div className="space-y-4">
                                {/* Nom */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Adresse */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                {/* Code postal et Ville */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">Code postal</Label>
                                        <Input
                                            id="postalCode"
                                            value={formData.postalCode}
                                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville *</Label>
                                        <Input
                                            id="city"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Capacité */}
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacité</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        value={formData.capacity || ''}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Email et Téléphone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Email contact</Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Téléphone contact</Label>
                                        <Input
                                            id="contactPhone"
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Latitude et Longitude */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={formData.latitude || ''}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={formData.longitude || ''}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>

                                {/* Transports */}
                                <div className="space-y-2">
                                    <Label htmlFor="transports">Transports</Label>
                                    <Input
                                        id="transports"
                                        value={formData.transports}
                                        onChange={(e) => setFormData({ ...formData, transports: e.target.value })}
                                        placeholder="Ex: Métro Châtelet (lignes 1, 4, 7)"
                                    />
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="pmrAccessible"
                                            checked={formData.pmrAccessible}
                                            onCheckedChange={(checked) => setFormData({ ...formData, pmrAccessible: checked === true })}
                                        />
                                        <Label htmlFor="pmrAccessible" className="font-normal cursor-pointer">
                                            Accessible PMR
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="parking"
                                            checked={formData.parking}
                                            onCheckedChange={(checked) => setFormData({ ...formData, parking: checked === true })}
                                        />
                                        <Label htmlFor="parking" className="font-normal cursor-pointer">
                                            Parking disponible
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                className="w-full sm:w-auto"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="bg-derviche hover:bg-derviche-light text-white w-full sm:w-auto"
                            >
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modale de visualisation des détails */}
            <Dialog open={viewingVenue !== null} onOpenChange={(open) => !open && setViewingVenue(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col">
                    <DialogHeader className="px-4 sm:px-6 pt-6 pb-4">
                        <DialogTitle>{viewingVenue?.name}</DialogTitle>
                        <DialogDescription>Détails du lieu</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                        <div className="space-y-4">
                            {/* Adresse complète */}
                            <div>
                                <p className="text-sm font-semibold text-foreground">Adresse</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {viewingVenue?.address || '-'}
                                    {viewingVenue?.postalCode && viewingVenue?.city
                                        ? `, ${viewingVenue.postalCode} ${viewingVenue.city}`
                                        : viewingVenue?.city
                                            ? `, ${viewingVenue.city}`
                                            : ''}
                                </p>
                            </div>

                            {/* Capacité */}
                            <div>
                                <p className="text-sm font-semibold text-foreground">Capacité</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {viewingVenue?.capacity ? `${viewingVenue.capacity} places` : 'Non renseigné'}
                                </p>
                            </div>

                            {/* Description */}
                            {viewingVenue?.description && (
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Description</p>
                                    <p className="text-sm text-muted-foreground mt-1">{viewingVenue.description}</p>
                                </div>
                            )}

                            {/* Contact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Email</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingVenue?.contactEmail || 'Non renseigné'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Téléphone</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingVenue?.contactPhone || 'Non renseigné'}
                                    </p>
                                </div>
                            </div>

                            {/* Coordonnées GPS */}
                            {(viewingVenue?.latitude || viewingVenue?.longitude) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Latitude</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {viewingVenue?.latitude || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Longitude</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {viewingVenue?.longitude || '-'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Transports */}
                            {viewingVenue?.transports && (
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Transports</p>
                                    <p className="text-sm text-muted-foreground mt-1">{viewingVenue.transports}</p>
                                </div>
                            )}

                            {/* Accessibilité et Parking */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Accessibilité PMR</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingVenue?.pmrAccessible ? 'Oui' : 'Non'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Parking</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingVenue?.parking ? 'Oui' : 'Non'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleViewToEdit}
                            className="w-full sm:w-auto"
                        >
                            Modifier
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleViewToDelete}
                            className="w-full sm:w-auto"
                        >
                            Supprimer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modale de confirmation de suppression */}
            <AlertDialog open={venueToDelete !== null} onOpenChange={(open) => !open && setVenueToDelete(null)}>
                <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le lieu « {venueToDelete?.name} » ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="w-full sm:w-auto text-white bg-destructive hover:bg-destructive/90"
                        >
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
