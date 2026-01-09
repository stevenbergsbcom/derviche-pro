'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Eye, Theater, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    mockCompanies,
    mockShows,
    generateMockId,
    type MockCompany,
} from '@/lib/mock-data';
import { searchMatch } from '@/lib/utils';

// Composants admin réutilisables
import {
    AdminPageHeader,
    SearchInput,
    DeleteConfirmDialog,
} from '@/components/admin';

// Composants spécifiques aux compagnies
import {
    CompanyFormDialog,
    CompanyViewDialog,
    type CompanyFormData,
} from '@/components/admin/compagnies';

export default function AdminCompagniesPage() {
    const router = useRouter();

    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Données
    const [companies, setCompanies] = useState<MockCompany[]>(mockCompanies);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingCompany, setEditingCompany] = useState<MockCompany | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<MockCompany | null>(null);
    const [viewingCompany, setViewingCompany] = useState<MockCompany | null>(null);

    // Compter les spectacles par compagnie
    const getShowsCountByCompany = (companyId: string): number => {
        return mockShows.filter((show) => show.companyId === companyId).length;
    };

    // Naviguer vers les spectacles filtrés par compagnie
    const handleViewShows = (companyName: string) => {
        router.push(`/admin/spectacles?search=${encodeURIComponent(companyName)}`);
    };

    // Filtrer les compagnies selon la recherche
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
        setEditingCompany(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (company: MockCompany) => {
        setEditingCompany(company);
        setIsFormDialogOpen(true);
    };

    const handleView = (company: MockCompany) => {
        setViewingCompany(company);
    };

    const handleDeleteClick = (company: MockCompany) => {
        setCompanyToDelete(company);
    };

    const handleConfirmDelete = () => {
        if (companyToDelete) {
            setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
            setCompanyToDelete(null);
        }
    };

    const handleViewToEdit = () => {
        if (viewingCompany) {
            const companyToEdit = viewingCompany;
            setViewingCompany(null);
            handleEdit(companyToEdit);
        }
    };

    const handleViewToDelete = () => {
        if (viewingCompany) {
            const companyToRemove = viewingCompany;
            setViewingCompany(null);
            handleDeleteClick(companyToRemove);
        }
    };

    const handleFormSubmit = (formData: CompanyFormData, isEditing: boolean) => {
        if (isEditing && editingCompany) {
            setCompanies((prev) =>
                prev.map((c) =>
                    c.id === editingCompany.id ? { ...c, ...formData } : c
                )
            );
        } else {
            const newId = generateMockId('company');
            setCompanies((prev) => [...prev, { id: newId, ...formData }]);
        }
        setEditingCompany(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="Gestion des Compagnies"
                actionLabel="Ajouter une compagnie"
                onAction={handleCreate}
            />

            {/* Compteur */}
            <p className="text-sm text-muted-foreground">
                {filteredCompanies.length} compagnie{filteredCompanies.length > 1 ? 's' : ''}
                {searchQuery && ` (sur ${companies.length} au total)`}
            </p>

            {/* Recherche */}
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher une compagnie..."
            />

            {/* Tableau desktop */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Spectacles</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Aucune compagnie trouvée
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCompanies.map((company) => {
                                const showsCount = getShowsCountByCompany(company.id);
                                return (
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
                                            {company.contactName || company.contactEmail || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                                onClick={() => handleViewShows(company.name)}
                                            >
                                                <Theater className="w-3 h-3 mr-1" />
                                                {showsCount} spectacle{showsCount > 1 ? 's' : ''}
                                            </Badge>
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes mobile */}
            <div className="lg:hidden space-y-4">
                {filteredCompanies.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Aucune compagnie trouvée
                        </CardContent>
                    </Card>
                ) : (
                    filteredCompanies.map((company) => {
                        const showsCount = getShowsCountByCompany(company.id);
                        return (
                            <Card key={company.id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3
                                                className="font-semibold cursor-pointer hover:text-derviche hover:underline"
                                                onClick={() => handleView(company)}
                                            >
                                                {company.name}
                                            </h3>
                                            {company.city && (
                                                <p className="text-sm text-muted-foreground">{company.city}</p>
                                            )}
                                        </div>
                                        <Badge
                                            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                            onClick={() => handleViewShows(company.name)}
                                        >
                                            <Theater className="w-3 h-3 mr-1" />
                                            {showsCount}
                                        </Badge>
                                    </div>
                                    {(company.contactName || company.contactEmail) && (
                                        <p className="text-sm text-muted-foreground">
                                            {company.contactName}
                                            {company.contactName && company.contactEmail && ' - '}
                                            {company.contactEmail}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleView(company)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Voir
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(company)}>
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
                        );
                    })
                )}
            </div>

            {/* === MODALES === */}

            <CompanyFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                editingCompany={editingCompany}
                onSubmit={handleFormSubmit}
            />

            <CompanyViewDialog
                company={viewingCompany}
                onClose={() => setViewingCompany(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
                showsCount={viewingCompany ? getShowsCountByCompany(viewingCompany.id) : 0}
                onViewShows={() => viewingCompany && handleViewShows(viewingCompany.name)}
            />

            <DeleteConfirmDialog
                open={!!companyToDelete}
                onOpenChange={(open) => !open && setCompanyToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer cette compagnie ?"
                description={`Êtes-vous sûr de vouloir supprimer la compagnie « ${companyToDelete?.name} » ? Cette action est irréversible.`}
            />
        </div>
    );
}
