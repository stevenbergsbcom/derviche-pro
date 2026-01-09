'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { MockCompany } from '@/lib/mock-data';

// Type pour les données du formulaire
export type CompanyFormData = Omit<MockCompany, 'id'>;

export interface CompanyFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Compagnie en cours d'édition (null = mode création) */
    editingCompany: MockCompany | null;
    /** Callback à la soumission du formulaire */
    onSubmit: (data: CompanyFormData, isEditing: boolean) => void;
}

// Valeurs par défaut du formulaire
const defaultFormData: CompanyFormData = {
    name: '',
    description: '',
    city: '',
    contactName: '',
    contactEmail: '',
    contactPhone: null,
};

/**
 * Modale de création/édition d'une compagnie
 */
export function CompanyFormDialog({
    open,
    onOpenChange,
    editingCompany,
    onSubmit,
}: CompanyFormDialogProps) {
    const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            if (editingCompany) {
                // Mode édition
                setFormData({
                    name: editingCompany.name,
                    description: editingCompany.description || '',
                    city: editingCompany.city || '',
                    contactName: editingCompany.contactName || '',
                    contactEmail: editingCompany.contactEmail || '',
                    contactPhone: editingCompany.contactPhone,
                });
            } else {
                // Mode création
                setFormData(defaultFormData);
            }
        }
    }, [open, editingCompany]);

    const handleClose = () => {
        onOpenChange(false);
        setFormData(defaultFormData);
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            return;
        }
        onSubmit(formData, editingCompany !== null);
        handleClose();
    };

    const isValid = formData.name.trim();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {editingCompany ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingCompany
                            ? 'Modifiez les informations de la compagnie.'
                            : 'Remplissez les informations pour créer une nouvelle compagnie.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    {/* Nom */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom de la compagnie <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Compagnie du Soleil"
                            required
                        />
                    </div>

                    {/* Ville */}
                    <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Ex: Lyon"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Présentation de la compagnie..."
                            rows={3}
                        />
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Label htmlFor="contactName">Nom du contact</Label>
                        <Input
                            id="contactName"
                            value={formData.contactName}
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            placeholder="Ex: Jean Dupont"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="contact@compagnie.fr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Téléphone</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                value={formData.contactPhone || ''}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value || null })}
                                placeholder="01 23 45 67 89"
                            />
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
                        {editingCompany ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
