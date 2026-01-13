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
    /** Callback pour supprimer un public cible */
    onRemoveTargetAudience: (id: string) => void | Promise<void>;
}

/**
 * Modale de gestion des publics cibles
 */
export function TargetAudienceManagerDialog({
    open,
    onOpenChange,
    targetAudiences,
    onAddTargetAudience,
    onRemoveTargetAudience,
}: TargetAudienceManagerDialogProps) {
    const [newTargetAudience, setNewTargetAudience] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gérer les publics cibles</DialogTitle>
                    <DialogDescription>
                        Ajoutez ou supprimez des publics cibles pour vos spectacles.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {targetAudiences.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucun public cible
                            </p>
                        ) : (
                            targetAudiences.map((audience) => (
                                <div key={audience.id} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{audience.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => void handleRemove(audience.id)}
                                        disabled={deletingId === audience.id}
                                    >
                                        {deletingId === audience.id ? (
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
                                value={newTargetAudience}
                                onChange={(e) => {
                                    setNewTargetAudience(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="Nouveau public cible"
                                onKeyDown={handleKeyDown}
                                disabled={isAdding}
                            />
                            <Button 
                                type="button" 
                                onClick={() => void handleAdd()}
                                disabled={isAdding || !newTargetAudience.trim()}
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
