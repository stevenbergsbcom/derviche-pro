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
import type { TargetAudienceRow } from '@/types/database';

// Type exporté pour la compatibilité
export interface TargetAudience {
    id: string;
    name: string;
}

export interface TargetAudienceManagerDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Liste des publics cibles actuels */
    targetAudiences: TargetAudienceRow[] | TargetAudience[];
    /** Callback pour ajouter un public cible */
    onAddTargetAudience: (name: string) => void | Promise<void>;
    /** Callback pour renommer un public cible existant */
    onRenameTargetAudience: (id: string, newName: string) => void | Promise<void>;
    /** Callback pour supprimer un public cible */
    onRemoveTargetAudience: (id: string) => void | Promise<void>;
}

/**
 * Modale de gestion des publics cibles.
 * Ajout, renommage inline et suppression. Un renommage est répercuté sur tous
 * les spectacles associés (le mapping est par id, pas par nom).
 */
export function TargetAudienceManagerDialog({
    open,
    onOpenChange,
    targetAudiences,
    onAddTargetAudience,
    onRenameTargetAudience,
    onRemoveTargetAudience,
}: TargetAudienceManagerDialogProps) {
    const [newTargetAudience, setNewTargetAudience] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [isRenaming, setIsRenaming] = useState<boolean>(false);
    const editInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const startEdit = (audience: TargetAudienceRow | TargetAudience) => {
        setError(null);
        setEditingId(audience.id);
        setEditingValue(audience.name);
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

        const original = targetAudiences.find((ta) => ta.id === editingId);
        if (original && original.name === trimmed) {
            cancelEdit();
            return;
        }

        if (
            targetAudiences.some(
                (ta) =>
                    ta.id !== editingId &&
                    ta.name.toLowerCase() === trimmed.toLowerCase()
            )
        ) {
            setError('Ce public cible existe déjà');
            return;
        }

        setError(null);
        setIsRenaming(true);
        try {
            await onRenameTargetAudience(editingId, trimmed);
            cancelEdit();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du renommage');
        } finally {
            setIsRenaming(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = newTargetAudience.trim();
        if (!trimmed) return;

        if (targetAudiences.some(ta => ta.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Ce public cible existe déjà');
            return;
        }

        setError(null);
        setIsAdding(true);
        try {
            await onAddTargetAudience(trimmed);
            setNewTargetAudience('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (audienceId: string) => {
        setError(null);
        setDeletingId(audienceId);
        try {
            await onRemoveTargetAudience(audienceId);
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
                    <DialogTitle>Gérer les publics cibles</DialogTitle>
                    <DialogDescription>
                        Ajoutez, renommez ou supprimez des publics cibles pour vos
                        spectacles. Un renommage est répercuté sur tous les spectacles
                        associés.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {targetAudiences.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucun public cible
                            </p>
                        ) : (
                            targetAudiences.map((audience) => {
                                const isEditing = editingId === audience.id;
                                const isBusy = isRenaming && isEditing;
                                return (
                                    <div
                                        key={audience.id}
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
                                                    aria-label={`Nouveau nom pour ${audience.name}`}
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
                                                    {audience.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => startEdit(audience)}
                                                    disabled={deletingId === audience.id || editingId !== null}
                                                    aria-label={`Renommer ${audience.name}`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => void handleRemove(audience.id)}
                                                    disabled={deletingId === audience.id || editingId !== null}
                                                    aria-label={`Supprimer ${audience.name}`}
                                                >
                                                    {deletingId === audience.id ? (
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
                                value={newTargetAudience}
                                onChange={(e) => {
                                    setNewTargetAudience(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="Nouveau public cible"
                                onKeyDown={handleKeyDown}
                                disabled={isAdding || editingId !== null}
                            />
                            <Button
                                type="button"
                                onClick={() => void handleAdd()}
                                disabled={isAdding || !newTargetAudience.trim() || editingId !== null}
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
