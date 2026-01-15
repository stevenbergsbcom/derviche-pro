'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { InternalUser, InternalRole } from '@/types/database';
import { translateRole } from '@/lib/services/internal-users';

// ============================================
// TYPES
// ============================================

/** Données du formulaire utilisateur */
export interface UserFormData {
    first_name: string;
    last_name: string;
    phone: string;
    role: InternalRole;
}

export interface UserFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Utilisateur en cours d'édition (null = mode création - pas encore implémenté) */
    editingUser: InternalUser | null;
    /** Callback à la soumission du formulaire */
    onSubmit: (data: UserFormData, isEditing: boolean) => Promise<void> | void;
    /** État de chargement */
    isSubmitting?: boolean;
    /** Message d'erreur à afficher */
    error?: string | null;
}

// ============================================
// CONSTANTES
// ============================================

/** Rôles internes disponibles */
const INTERNAL_ROLES: InternalRole[] = ['super-admin', 'admin', 'externe-dd'];

/** Valeurs par défaut du formulaire */
const defaultFormData: UserFormData = {
    first_name: '',
    last_name: '',
    phone: '',
    role: 'externe-dd',
};

// ============================================
// HELPERS
// ============================================

/**
 * Nettoie les données du formulaire (chaînes vides → chaînes vides pour l'update)
 */
function sanitizeFormData(data: UserFormData): UserFormData {
    return {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone.trim(),
        role: data.role,
    };
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Modale d'édition d'un utilisateur interne
 * Note: La création de comptes nécessite une API Route (Supabase Auth côté serveur)
 */
export function UserFormDialog({
    open,
    onOpenChange,
    editingUser,
    onSubmit,
    isSubmitting = false,
    error = null,
}: UserFormDialogProps) {
    const [formData, setFormData] = useState<UserFormData>(defaultFormData);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            if (editingUser) {
                // Mode édition
                setFormData({
                    first_name: editingUser.first_name || '',
                    last_name: editingUser.last_name || '',
                    phone: editingUser.phone || '',
                    role: editingUser.role,
                });
            } else {
                // Mode création (pas encore implémenté)
                setFormData(defaultFormData);
            }
        }
    }, [open, editingUser]);

    const resetForm = () => {
        setFormData(defaultFormData);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleFieldChange = (field: keyof UserFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleRoleChange = (value: string) => {
        if (INTERNAL_ROLES.includes(value as InternalRole)) {
            setFormData({ ...formData, role: value as InternalRole });
        }
    };

    const handleSubmit = async () => {
        const cleanedData = sanitizeFormData(formData);
        await onSubmit(cleanedData, editingUser !== null);
    };

    // En mode édition, le formulaire est toujours valide (tous les champs sont optionnels sauf le rôle)
    const isValid = editingUser !== null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingUser
                            ? `Modifiez les informations de ${editingUser.email}`
                            : 'La création de compte sera disponible prochainement.'}
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

                    {/* Email (lecture seule en édition) */}
                    {editingUser && (
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={editingUser.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                L&apos;email ne peut pas être modifié.
                            </p>
                        </div>
                    )}

                    {/* Prénom et Nom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Prénom</Label>
                            <Input
                                id="first_name"
                                value={formData.first_name}
                                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                                placeholder="Ex: Marie"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Nom</Label>
                            <Input
                                id="last_name"
                                value={formData.last_name}
                                onChange={(e) => handleFieldChange('last_name', e.target.value)}
                                placeholder="Ex: Dupont"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            placeholder="06 12 34 56 78"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Rôle */}
                    <div className="space-y-2">
                        <Label htmlFor="role">
                            Rôle <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.role}
                            onValueChange={handleRoleChange}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                {INTERNAL_ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {translateRole(role)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {formData.role === 'super-admin' && 'Accès complet à toutes les fonctionnalités.'}
                            {formData.role === 'admin' && 'Gestion des spectacles, réservations et check-in.'}
                            {formData.role === 'externe-dd' && 'Accueil et check-in sur les spectacles assignés.'}
                        </p>
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
                        onClick={() => void handleSubmit()}
                        disabled={!isValid || isSubmitting}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? 'Enregistrement...' : 'Modifier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
