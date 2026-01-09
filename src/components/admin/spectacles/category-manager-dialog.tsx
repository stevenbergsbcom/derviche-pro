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
import { Trash2 } from 'lucide-react';

export interface CategoryManagerDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Liste des catégories actuelles */
    categories: string[];
    /** Callback pour ajouter une catégorie */
    onAddCategory: (category: string) => void;
    /** Callback pour supprimer une catégorie */
    onRemoveCategory: (category: string) => void;
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

    const handleAdd = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            onAddCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
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
                        {categories.map((category) => (
                            <div key={category} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm">{category}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onRemoveCategory(category)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sr-only">Supprimer</span>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Nouvelle catégorie"
                            onKeyDown={handleKeyDown}
                        />
                        <Button type="button" onClick={handleAdd}>
                            Ajouter
                        </Button>
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
