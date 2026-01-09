'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { MockVenue } from '@/lib/mock-data';

// Type pour les données du formulaire
export type VenueFormData = Omit<MockVenue, 'id'>;

export interface VenueFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Lieu en cours d'édition (null = mode création) */
    editingVenue: MockVenue | null;
    /** Callback à la soumission du formulaire */
    onSubmit: (data: VenueFormData, isEditing: boolean) => void;
}

// Valeurs par défaut du formulaire
const defaultFormData: VenueFormData = {
    name: '',
    city: '',
    address: '',
    postalCode: '',
    capacity: undefined,
    description: '',
    contactEmail: '',
    contactPhone: '',
    latitude: undefined,
    longitude: undefined,
    pmrAccessible: false,
    parking: false,
    transports: '',
};

/**
 * Modale de création/édition d'un lieu
 */
export function VenueFormDialog({
    open,
    onOpenChange,
    editingVenue,
    onSubmit,
}: VenueFormDialogProps) {
    const [formData, setFormData] = useState<VenueFormData>(defaultFormData);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            if (editingVenue) {
                // Mode édition
                setFormData({
                    name: editingVenue.name,
                    city: editingVenue.city,
                    address: editingVenue.address || '',
                    postalCode: editingVenue.postalCode || '',
                    capacity: editingVenue.capacity,
                    description: editingVenue.description || '',
                    contactEmail: editingVenue.contactEmail || '',
                    contactPhone: editingVenue.contactPhone || '',
                    latitude: editingVenue.latitude,
                    longitude: editingVenue.longitude,
                    pmrAccessible: editingVenue.pmrAccessible || false,
                    parking: editingVenue.parking || false,
                    transports: editingVenue.transports || '',
                });
            } else {
                // Mode création
                setFormData(defaultFormData);
            }
        }
    }, [open, editingVenue]);

    const handleClose = () => {
        onOpenChange(false);
        setFormData(defaultFormData);
    };

    const handleSubmit = () => {
        if (!formData.name.trim() || !formData.city.trim()) {
            return;
        }
        onSubmit(formData, editingVenue !== null);
        handleClose();
    };

    const isValid = formData.name.trim() && formData.city.trim();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {editingVenue ? 'Modifier le lieu' : 'Ajouter un lieu'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingVenue
                            ? 'Modifiez les informations du lieu.'
                            : 'Remplissez les informations pour créer un nouveau lieu.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    {/* Informations principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nom du lieu <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Théâtre de la Ville"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">
                                Ville <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Ex: Avignon"
                                required
                            />
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Ex: 12 rue du Théâtre"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="postalCode">Code postal</Label>
                            <Input
                                id="postalCode"
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                placeholder="Ex: 84000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacité (places)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={formData.capacity || ''}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="Ex: 500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description du lieu..."
                            rows={3}
                        />
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email de contact</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="contact@theatre.fr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Téléphone</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                placeholder="01 23 45 67 89"
                            />
                        </div>
                    </div>

                    {/* Coordonnées GPS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={formData.latitude || ''}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="Ex: 43.9493"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={formData.longitude || ''}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="Ex: 4.8055"
                            />
                        </div>
                    </div>

                    {/* Accessibilité et services */}
                    <div className="space-y-2">
                        <Label htmlFor="transports">Accès transports</Label>
                        <Input
                            id="transports"
                            value={formData.transports}
                            onChange={(e) => setFormData({ ...formData, transports: e.target.value })}
                            placeholder="Ex: Métro ligne 1, Bus 42"
                        />
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="pmrAccessible"
                                checked={formData.pmrAccessible}
                                onCheckedChange={(checked) => setFormData({ ...formData, pmrAccessible: checked === true })}
                            />
                            <Label htmlFor="pmrAccessible" className="font-normal cursor-pointer">
                                Accessible PMR
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="parking"
                                checked={formData.parking}
                                onCheckedChange={(checked) => setFormData({ ...formData, parking: checked === true })}
                            />
                            <Label htmlFor="parking" className="font-normal cursor-pointer">
                                Parking disponible
                            </Label>
                        </div>
                    </div>
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
                        {editingVenue ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
