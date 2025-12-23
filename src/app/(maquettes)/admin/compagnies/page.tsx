'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Search, Eye, Theater, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
    mockCompanies,
    mockShows,
    generateMockId,
    type MockCompany,
} from '@/lib/mock-data';
import { searchMatch } from '@/lib/utils';

export default function AdminCompagniesPage() {
    const router = useRouter();
    
    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    // Fix d'hydratation : nécessaire pour éviter les différences SSR/Client avec Radix UI
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [companies, setCompanies] = useState<MockCompany[]>(mockCompanies);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editingCompany, setEditingCompany] = useState<MockCompany | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<MockCompany | null>(null);
    const [viewingCompany, setViewingCompany] = useState<MockCompany | null>(null);
    const [formData, setFormData] = useState<Omit<MockCompany, 'id'>>({
        name: '',
        description: '',
        city: '',
        contactName: '',
        contactEmail: '',
        contactPhone: null,
    });

    // Compter les spectacles par compagnie
    const getShowsCountByCompany = (companyId: string): number => {
        return mockShows.filter((show) => show.companyId === companyId).length;
    };

    // Naviguer vers les spectacles filtrés par compagnie
    const handleViewShows = (companyName: string) => {
        router.push(`/admin/spectacles?search=${encodeURIComponent(companyName)}`);
    };

    // Filtrer les compagnies selon la recherche (insensible aux accents et à la casse)
    const filteredCompanies = useMemo(() => {
        if (!searchQuery.trim()) {
            return companies;
        }

        const query = searchQuery.trim();
        return companies.filter(
            (company) =>
                searchMatch(company.name, query) ||
                searchMatch(company.city || '', query) ||
                searchMatch(company.contactName || '', query)
        );
    }, [searchQuery, companies]);

    // Attendre que le composant soit monté côté client pour éviter les erreurs d'hydratation
    // (les composants Radix UI génèrent des IDs différents côté serveur et client)
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingCompany(null);
        setFormData({
            name: '',
            description: '',
            city: '',
            contactName: '',
            contactEmail: '',
            contactPhone: null,
        });
        setIsDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (company: MockCompany) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            description: company.description || '',
            city: company.city || '',
            contactName: company.contactName || '',
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
        });
        setIsDialogOpen(true);
    };

    // Gérer la suppression
    const handleDeleteClick = (company: MockCompany) => {
        setCompanyToDelete(company);
    };

    // Confirmer la suppression
    const handleConfirmDelete = () => {
        if (companyToDelete) {
            setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
            setCompanyToDelete(null);
        }
    };

    // Ouvrir la modale de visualisation
    const handleView = (company: MockCompany) => {
        setViewingCompany(company);
    };

    // Fermer la modale de visualisation et ouvrir l'édition
    const handleViewToEdit = () => {
        if (viewingCompany) {
            const companyToEdit = viewingCompany;
            setViewingCompany(null);
            handleEdit(companyToEdit);
        }
    };

    // Fermer la modale de visualisation et ouvrir la suppression
    const handleViewToDelete = () => {
        if (viewingCompany) {
            const companyToRemove = viewingCompany;
            setViewingCompany(null);
            handleDeleteClick(companyToRemove);
        }
    };

    // Fermer la modale
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCompany(null);
    };

    // Soumettre le formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCompany) {
            // Édition
            setCompanies((prev) =>
                prev.map((c) =>
                    c.id === editingCompany.id
                        ? {
                            ...c,
                            name: formData.name,
                            description: formData.description,
                            city: formData.city,
                            contactName: formData.contactName,
                            contactEmail: formData.contactEmail,
                            contactPhone: formData.contactPhone,
                        }
                        : c
                )
            );
        } else {
            // Création
            const newId = generateMockId('company');
            setCompanies((prev) => [
                ...prev,
                {
                    id: newId,
                    name: formData.name,
                    description: formData.description,
                    city: formData.city,
                    contactName: formData.contactName,
                    contactEmail: formData.contactEmail,
                    contactPhone: formData.contactPhone,
                },
            ]);
        }

        handleCloseDialog();
    };

    return (
        <div className="space-y-6">
            {/* Header avec titre et bouton */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
                    Gestion des Compagnies
                </h1>
                <Button
                    className="bg-derviche hover:bg-derviche-light text-white w-full lg:w-auto"
                    onClick={handleCreate}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une compagnie
                </Button>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Rechercher une compagnie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tableau des compagnies - Desktop uniquement */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Spectacles</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCompanies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">
                                    <button
                                        onClick={() => handleView(company)}
                                        className="cursor-pointer hover:text-derviche hover:underline text-left"
                                    >
                                        {company.name}
                                    </button>
                                </TableCell>
                                <TableCell>{company.city || '-'}</TableCell>
                                <TableCell>
                                    {(() => {
                                        const count = getShowsCountByCompany(company.id);
                                        return count > 0 ? (
                                            <Badge
                                                className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                                onClick={() => handleViewShows(company.name)}
                                            >
                                                <Theater className="w-3 h-3 mr-1" />
                                                {count} spectacle{count > 1 ? 's' : ''}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {company.contactName || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleView(company)}
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="sr-only">Voir</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEdit(company)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span className="sr-only">Modifier</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(company)}
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

            {/* Cartes des compagnies - Mobile uniquement */}
            <div className="lg:hidden space-y-4">
                {filteredCompanies.map((company) => (
                    <Card key={company.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle
                                        className="text-lg mb-1 cursor-pointer hover:text-derviche hover:underline"
                                        onClick={() => handleView(company)}
                                    >
                                        {company.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{company.city || '-'}</p>
                                    {(() => {
                                        const count = getShowsCountByCompany(company.id);
                                        return count > 0 ? (
                                            <Badge
                                                className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20 mt-2"
                                                onClick={() => handleViewShows(company.name)}
                                            >
                                                <Theater className="w-3 h-3 mr-1" />
                                                {count} spectacle{count > 1 ? 's' : ''}
                                            </Badge>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">Contact</p>
                                <p className="text-sm text-muted-foreground">{company.contactName || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleView(company)}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEdit(company)}
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Modifier
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(company)}
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
                            {editingCompany ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCompany
                                ? 'Modifiez les informations de la compagnie ci-dessous.'
                                : 'Remplissez les informations pour créer une nouvelle compagnie.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-1">
                            <div className="space-y-4">
                                {/* Nom */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Email contact - Obligatoire */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Email contact <span className="text-destructive">*</span></Label>
                                    <p className="text-xs text-muted-foreground">
                                        Cet email sera utilisé par la compagnie pour se connecter à la plateforme.
                                    </p>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        required
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="email@compagnie.fr"
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

                                {/* Ville */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                {/* Nom du contact */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Nom du contact</Label>
                                    <Input
                                        id="contactName"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    />
                                </div>

                                {/* Téléphone */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Téléphone contact</Label>
                                    <Input
                                        id="contactPhone"
                                        type="tel"
                                        value={formData.contactPhone ?? ''}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value || null })}
                                    />
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
            <Dialog open={viewingCompany !== null} onOpenChange={(open) => !open && setViewingCompany(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col">
                    <DialogHeader className="px-4 sm:px-6 pt-6 pb-4">
                        <DialogTitle>{viewingCompany?.name}</DialogTitle>
                        <DialogDescription>Détails de la compagnie</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                        <div className="space-y-4">
                            {/* Spectacles associés */}
                            {viewingCompany && (() => {
                                const count = getShowsCountByCompany(viewingCompany.id);
                                return (
                                    <div className="border rounded-lg p-4 bg-muted/10">
                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Theater className="w-4 h-4" />
                                            Spectacles
                                        </p>
                                        {count > 0 ? (
                                            <div className="mt-2">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {count} spectacle{count > 1 ? 's' : ''} associé{count > 1 ? 's' : ''} à cette compagnie
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setViewingCompany(null);
                                                        handleViewShows(viewingCompany.name);
                                                    }}
                                                >
                                                    Voir les spectacles
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground mt-1 italic">
                                                Aucun spectacle associé
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Description */}
                            {viewingCompany?.description && (
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Description</p>
                                    <p className="text-sm text-muted-foreground mt-1">{viewingCompany.description}</p>
                                </div>
                            )}

                            {/* Ville */}
                            <div>
                                <p className="text-sm font-semibold text-foreground">Ville</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {viewingCompany?.city || 'Non renseigné'}
                                </p>
                            </div>

                            {/* Contact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Nom du contact</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingCompany?.contactName || 'Non renseigné'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Email</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {viewingCompany?.contactEmail || 'Non renseigné'}
                                    </p>
                                </div>
                            </div>

                            {/* Téléphone */}
                            <div>
                                <p className="text-sm font-semibold text-foreground">Téléphone</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {viewingCompany?.contactPhone ?? 'Non renseigné'}
                                </p>
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
            <AlertDialog open={companyToDelete !== null} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
                <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette compagnie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la compagnie « {companyToDelete?.name} » ? Cette action est irréversible.
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
