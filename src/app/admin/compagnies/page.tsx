'use client';

import { useState, useMemo } from 'react';
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
import { Pencil, Trash2, Eye, Theater, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { searchMatch } from '@/lib/utils';
import type { CompanyInsert } from '@/types/database';
import type { CompanyWithShowsCount } from '@/lib/services/companies';

// Hook Supabase
import { useCompanies } from '@/hooks/useCompanies';

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

    // Hook Supabase pour les données (inclut shows_count)
    const { companies, isLoading, error, refresh, create, update, remove, checkUsage } = useCompanies();

    // États locaux
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUsage, setIsCheckingUsage] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingCompany, setEditingCompany] = useState<CompanyWithShowsCount | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<CompanyWithShowsCount | null>(null);
    const [viewingCompany, setViewingCompany] = useState<CompanyWithShowsCount | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

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
                searchMatch(company.contact_name || '', query)
        );
    }, [searchQuery, companies]);

    // === HANDLERS ===

    const handleCreate = () => {
        setEditingCompany(null);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (company: CompanyWithShowsCount) => {
        setEditingCompany(company);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleView = (company: CompanyWithShowsCount) => {
        setViewingCompany(company);
    };

    const handleDeleteClick = async (company: CompanyWithShowsCount) => {
        // Capturer l'ID pour éviter les race conditions
        const companyId = company.id;
        
        // Afficher le dialog avec un état de chargement pendant la vérification
        setIsCheckingUsage(true);
        setCompanyToDelete(company);
        setDeleteWarning(null);

        // Vérifier si la compagnie est utilisée (double check avec la BDD)
        const { used, count } = await checkUsage(companyId);

        // Vérifier que l'utilisateur n'a pas changé de compagnie pendant l'appel async
        // (protection contre les race conditions)
        setCompanyToDelete((current) => {
            if (current?.id !== companyId) {
                // L'utilisateur a changé de compagnie, ignorer ce résultat
                return current;
            }
            // Même compagnie, on peut mettre à jour le warning
            if (used) {
                setDeleteWarning(`Cette compagnie est associée à ${count} spectacle(s). Supprimez d'abord les spectacles associés.`);
            }
            return current;
        });

        setIsCheckingUsage(false);
    };

    const handleConfirmDelete = async () => {
        if (companyToDelete && !deleteWarning) {
            setIsSubmitting(true);
            const result = await remove(companyToDelete.id);
            setIsSubmitting(false);

            if (result.success) {
                setCompanyToDelete(null);
            } else {
                console.error('Erreur suppression:', result.error);
            }
        }
    };

    const handleViewToEdit = () => {
        if (viewingCompany) {
            const companyToEdit = viewingCompany;
            setViewingCompany(null);
            handleEdit(companyToEdit);
        }
    };

    const handleViewToDelete = async () => {
        if (viewingCompany) {
            const companyToRemove = viewingCompany;
            setViewingCompany(null);
            await handleDeleteClick(companyToRemove);
        }
    };

    const handleFormDialogChange = (open: boolean) => {
        setIsFormDialogOpen(open);
        if (!open) {
            // Réinitialiser l'erreur quand on ferme le dialog
            setFormError(null);
            setEditingCompany(null);
        }
    };

    const handleFormSubmit = async (formData: CompanyFormData, isEditing: boolean) => {
        setIsSubmitting(true);
        setFormError(null);

        if (isEditing && editingCompany) {
            const result = await update(editingCompany.id, formData);
            if (result.success) {
                setIsFormDialogOpen(false);
                setEditingCompany(null);
            } else {
                setFormError(result.error || 'Erreur lors de la mise à jour');
            }
        } else {
            const result = await create(formData as CompanyInsert);
            if (result.success) {
                setIsFormDialogOpen(false);
            } else {
                setFormError(result.error || 'Erreur lors de la création');
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
                    onAction={handleCreate}
                />
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des compagnies : {error}
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
                                    {searchQuery ? 'Aucune compagnie trouvée' : 'Aucune compagnie enregistrée'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCompanies.map((company) => (
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
                                        {company.contact_name || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                            onClick={() => handleViewShows(company.name)}
                                        >
                                            <Theater className="w-3 h-3 mr-1" />
                                            {company.shows_count} spectacle{company.shows_count > 1 ? 's' : ''}
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes mobile */}
            <div className="lg:hidden space-y-4">
                {filteredCompanies.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {searchQuery ? 'Aucune compagnie trouvée' : 'Aucune compagnie enregistrée'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredCompanies.map((company) => (
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
                                        {company.shows_count}
                                    </Badge>
                                </div>
                                {company.contact_name && (
                                    <p className="text-sm text-muted-foreground">
                                        {company.contact_name}
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
                    ))
                )}
            </div>

            {/* === MODALES === */}

            <CompanyFormDialog
                open={isFormDialogOpen}
                onOpenChange={handleFormDialogChange}
                editingCompany={editingCompany}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                error={formError}
            />

            <CompanyViewDialog
                company={viewingCompany}
                onClose={() => setViewingCompany(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
                showsCount={viewingCompany?.shows_count ?? 0}
                onViewShows={() => viewingCompany && handleViewShows(viewingCompany.name)}
            />

            <DeleteConfirmDialog
                open={!!companyToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setCompanyToDelete(null);
                        setDeleteWarning(null);
                    }
                }}
                onConfirm={handleConfirmDelete}
                title="Supprimer cette compagnie ?"
                description={
                    deleteWarning
                        ? deleteWarning
                        : `Êtes-vous sûr de vouloir supprimer la compagnie « ${companyToDelete?.name} » ? Cette action est irréversible.`
                }
                confirmDisabled={!!deleteWarning || isCheckingUsage}
                isSubmitting={isSubmitting || isCheckingUsage}
            />
        </div>
    );
}
