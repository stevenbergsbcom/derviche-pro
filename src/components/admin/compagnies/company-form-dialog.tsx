'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { CompanyRow, CompanyInsert } from '@/types/database';

// Type pour les données du formulaire (compatible avec CompanyInsert)
export type CompanyFormData = CompanyInsert;

// Le formulaire accepte CompanyRow ou tout type qui l'étend (comme CompanyWithShowsCount)
export interface CompanyFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Compagnie en cours d'édition (null = mode création) */
    editingCompany: (CompanyRow & { shows_count?: number }) | null;
    /** Callback à la soumission du formulaire (async) */
    onSubmit: (data: CompanyFormData, isEditing: boolean) => Promise<void> | void;
    /** État de chargement */
    isSubmitting?: boolean;
    /** Message d'erreur à afficher */
    error?: string | null;
}

// Valeurs par défaut du formulaire
const defaultFormData: CompanyFormData = {
    name: '',
    contact_email: '',
    description: '',
    city: '',
    contact_name: '',
    contact_phone: '',
    website: '',
};

// Regex pour validation email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide un email
 */
function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

/**
 * Convertit les chaînes vides en null pour les champs optionnels
 * Préserve les valeurs null dans la BDD au lieu de les remplacer par ''
 */
function sanitizeFormData(data: CompanyFormData): CompanyFormData {
    return {
        name: data.name.trim(),
        contact_email: data.contact_email?.trim() || null,
        description: data.description?.trim() || null,
        city: data.city?.trim() || null,
        contact_name: data.contact_name?.trim() || null,
        contact_phone: data.contact_phone?.trim() || null,
        website: data.website?.trim() || null,
    };
}

/**
 * Modale de création/édition d'une compagnie
 */
export function CompanyFormDialog({
    open,
    onOpenChange,
    editingCompany,
    onSubmit,
    isSubmitting = false,
    error = null,
}: CompanyFormDialogProps) {
    const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            // Réinitialiser les erreurs de validation
            setValidationErrors({});
            
            if (editingCompany) {
                // Mode édition
                setFormData({
                    name: editingCompany.name,
                    contact_email: editingCompany.contact_email,
                    description: editingCompany.description || '',
                    city: editingCompany.city || '',
                    contact_name: editingCompany.contact_name || '',
                    contact_phone: editingCompany.contact_phone || '',
                    website: editingCompany.website || '',
                });
            } else {
                // Mode création
                setFormData(defaultFormData);
            }
        }
    }, [open, editingCompany]);

    const resetForm = () => {
        setFormData(defaultFormData);
        setValidationErrors({});
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    // Validation d'un champ individuel
    const validateField = (field: string, value: string): string | null => {
        switch (field) {
            case 'name':
                if (!value.trim()) return 'Le nom est obligatoire';
                break;
            case 'contact_email':
                if (!value.trim()) return 'L\'email est obligatoire';
                if (!isValidEmail(value)) return 'Format d\'email invalide (ex: contact@exemple.fr)';
                break;
        }
        return null;
    };

    // Gérer le changement d'un champ avec validation
    const handleFieldChange = (field: keyof CompanyFormData, value: string | null) => {
        setFormData({ ...formData, [field]: value });
        
        // Valider le champ si c'est un champ requis
        if (field === 'name' || field === 'contact_email') {
            const fieldError = validateField(field, value || '');
            setValidationErrors(prev => {
                if (fieldError) {
                    return { ...prev, [field]: fieldError };
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { [field]: removed, ...rest } = prev;
                    return rest;
                }
            });
        }
    };

    // Validation complète du formulaire
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        const nameError = validateField('name', formData.name);
        if (nameError) errors.name = nameError;
        
        const emailError = validateField('contact_email', formData.contact_email ?? '');
        if (emailError) errors.contact_email = emailError;
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        // Nettoyer les données avant soumission (chaînes vides → null)
        const cleanedData = sanitizeFormData(formData);
        await onSubmit(cleanedData, editingCompany !== null);
    };

    const isValid = formData.name.trim() && (formData.contact_email ?? '').trim() && isValidEmail((formData.contact_email ?? '').trim());

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
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
                    {/* Message d'erreur serveur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Nom */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom de la compagnie <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name ?? ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Ex: Compagnie du Soleil"
                            required
                            disabled={isSubmitting}
                            className={validationErrors.name ? 'border-destructive' : ''}
                        />
                        {validationErrors.name && (
                            <p className="text-sm text-destructive">{validationErrors.name}</p>
                        )}
                    </div>

                    {/* Ville */}
                    <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                            id="city"
                            value={formData.city ?? ''}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            placeholder="Ex: Lyon"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description ?? ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Présentation de la compagnie..."
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Site web */}
                    <div className="space-y-2">
                        <Label htmlFor="website">Site web</Label>
                        <Input
                            id="website"
                            type="url"
                            value={formData.website ?? ''}
                            onChange={(e) => handleFieldChange('website', e.target.value)}
                            placeholder="https://www.compagnie.fr"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Label htmlFor="contact_name">Nom du contact</Label>
                        <Input
                            id="contact_name"
                            value={formData.contact_name ?? ''}
                            onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                            placeholder="Ex: Jean Dupont"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_email">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="contact_email"
                                type="email"
                                value={formData.contact_email ?? ''}
                                onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                                placeholder="contact@compagnie.fr"
                                required
                                disabled={isSubmitting}
                                className={validationErrors.contact_email ? 'border-destructive' : ''}
                            />
                            {validationErrors.contact_email && (
                                <p className="text-sm text-destructive">{validationErrors.contact_email}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Téléphone</Label>
                            <Input
                                id="contact_phone"
                                type="tel"
                                value={formData.contact_phone ?? ''}
                                onChange={(e) => handleFieldChange('contact_phone', e.target.value || null)}
                                placeholder="01 23 45 67 89"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleClose} 
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? 'Enregistrement...' : editingCompany ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
