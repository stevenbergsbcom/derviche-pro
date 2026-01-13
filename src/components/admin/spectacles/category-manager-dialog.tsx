'use client';

import { useState } from 'react';
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
import { Trash2, Loader2 } from 'lucide-react';
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
    /** Callback pour supprimer une catégorie (par ID) */
    onRemoveCategory: (categoryId: string) => void | Promise<void>;
}

/**
 * Modale de gestion des catégories de spectacles
 */
export function CategoryManagerDialog({
    open,
    onOpenChange,
    categories,
    onAddCategory,
    onRemoveCategory,
}: CategoryManagerDialogProps) {
    const [newCategory, setNewCategory] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gérer les catégories</DialogTitle>
                    <DialogDescription>
                        Ajoutez ou supprimez des catégories de spectacles.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucune catégorie
                            </p>
                        ) : (
                            categories.map((category) => (
                                <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{category.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => void handleRemove(category.id)}
                                        disabled={deletingId === category.id}
                                    >
                                        {deletingId === category.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                        <span className="sr-only">Supprimer</span>
                                    </Button>
                                </div>
                            ))
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
                                disabled={isAdding}
                            />
                            <Button 
                                type="button" 
                                onClick={() => void handleAdd()}
                                disabled={isAdding || !newCategory.trim()}
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
                    >
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
