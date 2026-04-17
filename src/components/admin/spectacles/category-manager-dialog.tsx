'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import type { ShowCategoryRow } from '@/types/database';

export interface CategoryManagerDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Liste des catégories actuelles */
    categories: ShowCategoryRow[];
    /** Callback pour ajouter une catégorie (retourne le nom) */
    onAddCategory: (categoryName: string) => void | Promise<void>;
    /** Callback pour renommer une catégorie existante */
    onRenameCategory: (categoryId: string, newName: string) => void | Promise<void>;
    /** Callback pour supprimer une catégorie (par ID) */
    onRemoveCategory: (categoryId: string) => void | Promise<void>;
}

/**
 * Modale de gestion des catégories de spectacles.
 * Les catégories peuvent être ajoutées, renommées inline, et supprimées.
 * Un renommage se répercute automatiquement sur tous les spectacles associés
 * (le mapping spectacle → catégorie est par id, pas par nom).
 */
export function CategoryManagerDialog({
    open,
    onOpenChange,
    categories,
    onAddCategory,
    onRenameCategory,
    onRemoveCategory,
}: CategoryManagerDialogProps) {
    const [newCategory, setNewCategory] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // État d'édition inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [isRenaming, setIsRenaming] = useState<boolean>(false);
    const editInputRef = useRef<HTMLInputElement | null>(null);

    // Focus auto sur l'input d'édition à l'ouverture.
    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const startEdit = (category: ShowCategoryRow) => {
        setError(null);
        setEditingId(category.id);
        setEditingValue(category.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingValue('');
        setError(null);
    };

    const confirmEdit = async () => {
        if (!editingId) return;
        const trimmed = editingValue.trim();
        if (!trimmed) {
            setError('Le nom ne peut pas être vide');
            return;
        }

        const original = categories.find((c) => c.id === editingId);
        if (original && original.name === trimmed) {
            // Aucun changement → on sort sans appel réseau.
            cancelEdit();
            return;
        }

        if (
            categories.some(
                (c) =>
                    c.id !== editingId &&
                    c.name.toLowerCase() === trimmed.toLowerCase()
            )
        ) {
            setError('Cette catégorie existe déjà');
            return;
        }

        setError(null);
        setIsRenaming(true);
        try {
            await onRenameCategory(editingId, trimmed);
            cancelEdit();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du renommage');
        } finally {
            setIsRenaming(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;

        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Cette catégorie existe déjà');
            return;
        }

        setError(null);
        setIsAdding(true);
        try {
            await onAddCategory(trimmed);
            setNewCategory('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (categoryId: string) => {
        setError(null);
        setDeletingId(categoryId);
        try {
            await onRemoveCategory(categoryId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        } finally {
            setDeletingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void handleAdd();
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void confirmEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gérer les catégories</DialogTitle>
                    <DialogDescription>
                        Ajoutez, renommez ou supprimez des catégories de spectacles.
                        Un renommage est répercuté sur tous les spectacles associés.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucune catégorie
                            </p>
                        ) : (
                            categories.map((category) => {
                                const isEditing = editingId === category.id;
                                const isBusy = isRenaming && isEditing;
                                return (
                                    <div
                                        key={category.id}
                                        className="flex items-center gap-2 p-2 border rounded"
                                    >
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    ref={editInputRef}
                                                    value={editingValue}
                                                    onChange={(e) => {
                                                        setEditingValue(e.target.value);
                                                        if (error) setError(null);
                                                    }}
                                                    onKeyDown={handleEditKeyDown}
                                                    disabled={isBusy}
                                                    className="h-8 flex-1"
                                                    aria-label={`Nouveau nom pour ${category.name}`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => void confirmEdit()}
                                                    disabled={isBusy || !editingValue.trim()}
                                                    aria-label="Enregistrer le renommage"
                                                >
                                                    {isBusy ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={cancelEdit}
                                                    disabled={isBusy}
                                                    aria-label="Annuler le renommage"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-sm truncate">
                                                    {category.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => startEdit(category)}
                                                    disabled={deletingId === category.id || editingId !== null}
                                                    aria-label={`Renommer ${category.name}`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => void handleRemove(category.id)}
                                                    disabled={deletingId === category.id || editingId !== null}
                                                    aria-label={`Supprimer ${category.name}`}
                                                >
                                                    {deletingId === category.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="space-y-2">
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                                {error}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                value={newCategory}
                                onChange={(e) => {
                                    setNewCategory(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="Nouvelle catégorie"
                                onKeyDown={handleKeyDown}
                                disabled={isAdding || editingId !== null}
                            />
                            <Button
                                type="button"
                                onClick={() => void handleAdd()}
                                disabled={isAdding || !newCategory.trim() || editingId !== null}
                            >
                                {isAdding ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Ajouter'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                        disabled={editingId !== null && isRenaming}
                    >
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
