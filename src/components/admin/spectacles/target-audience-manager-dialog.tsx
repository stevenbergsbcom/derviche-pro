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
    targetAudiences: TargetAudience[];
    /** Callback pour ajouter un public cible */
    onAddTargetAudience: (name: string) => void;
    /** Callback pour supprimer un public cible */
    onRemoveTargetAudience: (id: string) => void;
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

    const handleAdd = () => {
        if (newTargetAudience.trim() && !targetAudiences.some(ta => ta.name === newTargetAudience.trim())) {
            onAddTargetAudience(newTargetAudience.trim());
            setNewTargetAudience('');
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
                    <DialogTitle>Gérer les publics cibles</DialogTitle>
                    <DialogDescription>
                        Ajoutez ou supprimez des publics cibles pour vos spectacles.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {targetAudiences.map((audience) => (
                            <div key={audience.id} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm">{audience.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onRemoveTargetAudience(audience.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sr-only">Supprimer</span>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newTargetAudience}
                            onChange={(e) => setNewTargetAudience(e.target.value)}
                            placeholder="Nouveau public cible"
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
