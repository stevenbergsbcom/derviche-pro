'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { MockRepresentation, MockVenue, MockUser } from '@/lib/mock-data';
import type { SlotHostedBy } from '@/types/database';

// Type pour les données du formulaire
export type RepresentationFormData = {
    date: string;
    time: string;
    venueId: string;
    capacity: number | null;
    hostedBy: SlotHostedBy;
    hostedById: string | null;
};

export interface RepresentationFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Représentation en cours d'édition (null = mode création) */
    editingRepresentation: MockRepresentation | null;
    /** Callback à la soumission du formulaire */
    onSubmit: (data: RepresentationFormData, isEditing: boolean) => void;
    /** Liste des lieux disponibles */
    venues: MockVenue[];
    /** Liste des utilisateurs Derviche */
    dervisheUsers: MockUser[];
    /** Callback pour ouvrir la modale de création de lieu */
    onOpenNewVenueDialog: () => void;
}

// Valeurs par défaut du formulaire
const defaultFormData: RepresentationFormData = {
    date: '',
    time: '',
    venueId: '',
    capacity: null,
    hostedBy: 'derviche',
    hostedById: null,
};

/**
 * Modale de création/édition d'une représentation
 */
export function RepresentationFormDialog({
    open,
    onOpenChange,
    editingRepresentation,
    onSubmit,
    venues,
    dervisheUsers,
    onOpenNewVenueDialog,
}: RepresentationFormDialogProps) {
    const [formData, setFormData] = useState<RepresentationFormData>(defaultFormData);
    const [isUnlimited, setIsUnlimited] = useState<boolean>(true);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            if (editingRepresentation) {
                // Mode édition
                const isUnlimitedValue = editingRepresentation.capacity === null;
                setFormData({
                    date: editingRepresentation.date,
                    time: editingRepresentation.time,
                    venueId: editingRepresentation.venueId,
                    capacity: editingRepresentation.capacity ?? 20,
                    hostedBy: editingRepresentation.hostedBy,
                    hostedById: editingRepresentation.hostedById ?? null,
                });
                setIsUnlimited(isUnlimitedValue);
            } else {
                // Mode création
                setFormData(defaultFormData);
                setIsUnlimited(true);
            }
        }
    }, [open, editingRepresentation]);

    const handleClose = () => {
        onOpenChange(false);
        setFormData(defaultFormData);
        setIsUnlimited(true);
    };

    const handleSubmit = () => {
        if (!formData.date || !formData.time || !formData.venueId) {
            return;
        }
        if (!isUnlimited && (formData.capacity === null || formData.capacity < 1)) {
            return;
        }

        const capacityValue = isUnlimited ? null : formData.capacity;

        onSubmit(
            {
                ...formData,
                capacity: capacityValue,
            },
            editingRepresentation !== null
        );
        handleClose();
    };

    const isValid =
        formData.date &&
        formData.time &&
        formData.venueId &&
        (isUnlimited || (formData.capacity !== null && formData.capacity >= 1)) &&
        (formData.hostedBy !== 'derviche' || formData.hostedById);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {editingRepresentation ? 'Modifier la représentation' : 'Ajouter une représentation'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingRepresentation
                            ? 'Modifiez les informations de la représentation.'
                            : 'Remplissez les informations pour créer une nouvelle représentation.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">
                                Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">
                                Heure <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="venueId">
                            Lieu <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.venueId ? String(formData.venueId) : ''}
                            onValueChange={(value) => {
                                if (value === 'new') {
                                    onOpenNewVenueDialog();
                                } else {
                                    setFormData({ ...formData, venueId: value });
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un lieu" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map((venue) => (
                                    <SelectItem key={venue.id} value={String(venue.id)}>
                                        {venue.city ? `${venue.name} - ${venue.city}` : venue.name}
                                    </SelectItem>
                                ))}
                                <div className="border-t my-1" />
                                <SelectItem value="new" className="text-derviche font-medium">
                                    ➕ Créer un nouveau lieu...
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity">
                            Places max (pro) <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Nombre maximum de programmateurs pouvant réserver
                        </p>
                        <div className="flex items-center gap-2">
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={formData.capacity ?? ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                                }
                                disabled={isUnlimited}
                                required={!isUnlimited}
                                className={isUnlimited ? 'flex-1 bg-muted text-muted-foreground' : 'flex-1'}
                            />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isUnlimited"
                                    checked={isUnlimited}
                                    onCheckedChange={(checked) => {
                                        setIsUnlimited(checked === true);
                                        if (checked) {
                                            setFormData({ ...formData, capacity: null });
                                        } else {
                                            setFormData({ ...formData, capacity: 20 });
                                        }
                                    }}
                                />
                                <Label htmlFor="isUnlimited" className="font-normal cursor-pointer">
                                    Illimité
                                </Label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hostedBy">
                            Accueil par <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.hostedBy}
                            onValueChange={(value: SlotHostedBy) =>
                                setFormData({
                                    ...formData,
                                    hostedBy: value,
                                    hostedById: value === 'company' ? null : formData.hostedById,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="derviche">Derviche Diffusion</SelectItem>
                                <SelectItem value="company">Compagnie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.hostedBy === 'derviche' && (
                        <div className="space-y-2">
                            <Label htmlFor="hostedById">
                                Accueilli par <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.hostedById ?? ''}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, hostedById: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un membre Derviche" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dervisheUsers.map((user) => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            {user.firstName} {user.lastName} - [
                                            {user.role === 'super-admin'
                                                ? 'Super Admin'
                                                : user.role === 'admin'
                                                    ? 'Admin'
                                                    : 'Externe'}
                                            ]
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {editingRepresentation ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Export pour mise à jour externe du venueId
export function updateFormVenueId(
    setFormData: React.Dispatch<React.SetStateAction<RepresentationFormData>>,
    venueId: string
) {
    setFormData((prev) => ({ ...prev, venueId }));
}
