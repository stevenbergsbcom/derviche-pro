'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface VenueQuickCreateDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Callback quand un lieu est créé - retourne l'ID pour auto-sélection */
    onCreateVenue: (data: { name: string; city: string }) => string;
    /** Callback optionnel appelé après création avec l'ID du nouveau lieu */
    onVenueCreated?: (venueId: string) => void;
}

/**
 * Modale de création rapide d'un lieu
 */
export function VenueQuickCreateDialog({
    open,
    onOpenChange,
    onCreateVenue,
    onVenueCreated,
}: VenueQuickCreateDialogProps) {
    const [formData, setFormData] = useState<{ name: string; city: string }>({
        name: '',
        city: '',
    });

    const handleClose = () => {
        onOpenChange(false);
        setFormData({ name: '', city: '' });
    };

    const handleSubmit = () => {
        if (!formData.name.trim() || !formData.city.trim()) {
            return;
        }
        const newId = onCreateVenue({
            name: formData.name.trim(),
            city: formData.city.trim(),
        });
        // Notifier le parent pour auto-sélection
        if (onVenueCreated) {
            onVenueCreated(newId);
        }
        handleClose();
    };

    const isValid = formData.name.trim() && formData.city.trim();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau lieu</DialogTitle>
                    <DialogDescription>
                        Ajoutez un nouveau lieu pour vos représentations.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    <div className="space-y-2">
                        <Label htmlFor="newVenueName">
                            Nom du lieu <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newVenueName"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Ex: Théâtre de la Ville"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newVenueCity">
                            Ville <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newVenueCity"
                            type="text"
                            value={formData.city}
                            onChange={(e) =>
                                setFormData({ ...formData, city: e.target.value })
                            }
                            placeholder="Ex: Avignon"
                            required
                        />
                    </div>
                </div>
                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="w-full sm:w-auto"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        Créer et sélectionner
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
