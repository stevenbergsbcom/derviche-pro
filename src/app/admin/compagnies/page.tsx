'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { Pencil, Trash2, Eye, Theater, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { searchMatch } from '@/lib/utils';
import { getCompanyUser } from '@/lib/services/internal-users';
import type { CompanyInsert } from '@/types/database';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';

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
    CreateCompanyUserDialog,
    AssignCompanyUserDialog,
    type CompanyFormData,
} from '@/components/admin/compagnies';

export default function AdminCompagniesPage() {
    const router = useRouter();

    // Hook Supabase pour les données (inclut shows_count et has_user)
    const { companies, isLoading, error, refresh, create, update, remove, checkUsage, setCompanyHasUser } = useCompanies();

    // États locaux
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUsage, setIsCheckingUsage] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Ref pour éviter les race conditions lors de la vérification d'usage
    const pendingDeleteCheckRef = useRef<string | null>(null);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingCompany, setEditingCompany] = useState<CompanyWithShowsCount | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<CompanyWithShowsCount | null>(null);
    const [viewingCompany, setViewingCompany] = useState<CompanyWithShowsCount | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

    // États pour l'utilisateur compagnie
    const [companyUser, setCompanyUser] = useState<ManagedUser | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
    const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);

    // Charger l'utilisateur lié quand on visualise une compagnie
    const loadCompanyUser = useCallback(async (companyId: string) => {
        setIsLoadingUser(true);
        setCompanyUser(null);
        
        const result = await getCompanyUser(companyId);
        
        setCompanyUser(result.data);
        setIsLoadingUser(false);
    }, []);

    // Effet pour charger l'utilisateur quand viewingCompany change
    useEffect(() => {
        if (viewingCompany) {
            void loadCompanyUser(viewingCompany.id);
        } else {
            setCompanyUser(null);
        }
    }, [viewingCompany, loadCompanyUser]);

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
        pendingDeleteCheckRef.current = companyId;
        
        // Afficher le dialog avec un état de chargement pendant la vérification
        setIsCheckingUsage(true);
        setCompanyToDelete(company);
        setDeleteWarning(null);

        // Vérifier si la compagnie est utilisée (double check avec la BDD)
        const { used, count } = await checkUsage(companyId);

        // Vérifier que l'utilisateur n'a pas changé de compagnie pendant l'appel async
        // (protection contre les race conditions)
        if (pendingDeleteCheckRef.current === companyId) {
            if (used) {
                setDeleteWarning(`Cette compagnie est associée à ${count} spectacle(s). Supprimez d'abord les spectacles associés.`);
            }
            setIsCheckingUsage(false);
        }
        // Si l'ID a changé, on ignore silencieusement ce résultat
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

    // Handler pour ouvrir le dialogue de création d'utilisateur
    const handleCreateUser = () => {
        setIsCreateUserDialogOpen(true);
    };

    // Handler pour ouvrir le dialogue d'assignation d'utilisateur existant
    const handleAssignUser = () => {
        setIsAssignUserDialogOpen(true);
    };

    // Handler après création réussie de l'utilisateur
    const handleUserCreated = () => {
        // Recharger l'utilisateur de la compagnie en cours de visualisation
        if (viewingCompany) {
            void loadCompanyUser(viewingCompany.id);
            // Mettre à jour le statut has_user dans la liste
            setCompanyHasUser(viewingCompany.id, true);
        }
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
            <div className="hidden lg:block rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Spectacles</TableHead>
                            <TableHead>Accès</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                                    <TableCell>
                                        {company.has_user ? (
                                            <Badge 
                                                variant="outline" 
                                                className="bg-green-50 text-green-700 border-green-200"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Configuré
                                            </Badge>
                                        ) : (
                                            <Badge 
                                                variant="outline" 
                                                className="text-muted-foreground"
                                            >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Non configuré
                                            </Badge>
                                        )}
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
                                                onClick={() => void handleDeleteClick(company)}
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
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge
                                            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                            onClick={() => handleViewShows(company.name)}
                                        >
                                            <Theater className="w-3 h-3 mr-1" />
                                            {company.shows_count}
                                        </Badge>
                                        {company.has_user ? (
                                            <Badge 
                                                variant="outline" 
                                                className="bg-green-50 text-green-700 border-green-200 text-xs"
                                            >
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Accès
                                            </Badge>
                                        ) : (
                                            <Badge 
                                                variant="outline" 
                                                className="text-muted-foreground text-xs"
                                            >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Pas d&apos;accès
                                            </Badge>
                                        )}
                                    </div>
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
                                        onClick={() => void handleDeleteClick(company)}
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
                onDelete={() => void handleViewToDelete()}
                showsCount={viewingCompany?.shows_count ?? 0}
                onViewShows={() => viewingCompany && handleViewShows(viewingCompany.name)}
                companyUser={companyUser}
                isLoadingUser={isLoadingUser}
                onCreateUser={handleCreateUser}
                onAssignUser={handleAssignUser}
            />

            {/* Dialogue de création d'accès utilisateur */}
            {viewingCompany && (
                <CreateCompanyUserDialog
                    open={isCreateUserDialogOpen}
                    onOpenChange={setIsCreateUserDialogOpen}
                    companyId={viewingCompany.id}
                    companyName={viewingCompany.name}
                    onSuccess={handleUserCreated}
                />
            )}

            {/* Dialogue d'assignation d'utilisateur existant */}
            {viewingCompany && (
                <AssignCompanyUserDialog
                    open={isAssignUserDialogOpen}
                    onOpenChange={setIsAssignUserDialogOpen}
                    companyId={viewingCompany.id}
                    companyName={viewingCompany.name}
                    onSuccess={handleUserCreated}
                />
            )}

            <DeleteConfirmDialog
                open={!!companyToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setCompanyToDelete(null);
                        setDeleteWarning(null);
                    }
                }}
                onConfirm={() => void handleConfirmDelete()}
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
