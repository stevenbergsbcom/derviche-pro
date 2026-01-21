'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, RefreshCw, Copy, Check, Building2, Loader2 } from 'lucide-react';
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
import type { InternalUser } from '@/types/database';
import { translateRole, type ManagedRole, type ManagedUser } from '@/lib/services/internal-users';
import { 
    generatePassword, 
    validatePassword, 
    getPasswordStrength 
} from '@/lib/utils/password-generator';
import { getCompanies } from '@/lib/services/companies';
import type { CompanyRow } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Données du formulaire utilisateur (édition) */
export interface UserFormData {
    first_name: string;
    last_name: string;
    phone: string;
    role: ManagedRole;
    company_id?: string; // Requis si role = 'company'
}

/** Données du formulaire utilisateur (création) */
export interface CreateUserFormData extends UserFormData {
    email: string;
    password: string;
    must_change_password: boolean;
}

export interface UserFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Utilisateur en cours d'édition (null = mode création) */
    editingUser: InternalUser | ManagedUser | null;
    /** Callback à la soumission du formulaire (édition) */
    onSubmit: (data: UserFormData, isEditing: boolean) => Promise<void> | void;
    /** Callback à la création d'un utilisateur */
    onCreate?: (data: CreateUserFormData) => Promise<void> | void;
    /** État de chargement */
    isSubmitting?: boolean;
    /** Message d'erreur à afficher */
    error?: string | null;
}

// ============================================
// CONSTANTES
// ============================================

/** Tous les rôles gérés */
const MANAGED_ROLES: ManagedRole[] = ['super-admin', 'admin', 'externe', 'company'];

/** Valeurs par défaut du formulaire (édition) */
const defaultFormData: UserFormData = {
    first_name: '',
    last_name: '',
    phone: '',
    role: 'externe',
    company_id: undefined,
};

/** Valeurs par défaut du formulaire (création) */
const defaultCreateFormData: CreateUserFormData = {
    ...defaultFormData,
    email: '',
    password: '',
    must_change_password: true,
};

// ============================================
// HELPERS
// ============================================

/**
 * Vérifie si un utilisateur est un ManagedUser (a company_id)
 */
function isManagedUser(user: InternalUser | ManagedUser): user is ManagedUser {
    return 'company_id' in user;
}

/**
 * Description du rôle
 */
function getRoleDescription(role: ManagedRole): string {
    switch (role) {
        case 'super-admin':
            return 'Accès complet à toutes les fonctionnalités.';
        case 'admin':
            return 'Gestion des spectacles, réservations et check-in.';
        case 'externe':
            return 'Accueil et check-in sur les spectacles assignés.';
        case 'company':
            return 'Accès aux statistiques de la compagnie associée.';
        default:
            return '';
    }
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Modale de création/édition d'un utilisateur (interne ou compagnie)
 */
export function UserFormDialog({
    open,
    onOpenChange,
    editingUser,
    onSubmit,
    onCreate,
    isSubmitting = false,
    error = null,
}: UserFormDialogProps) {
    // Mode création ou édition
    const isCreating = editingUser === null;

    // État du formulaire
    const [formData, setFormData] = useState<CreateUserFormData>(defaultCreateFormData);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Liste des compagnies (pour le rôle company)
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

    // Charger les compagnies quand le rôle devient 'company'
    useEffect(() => {
        if (open && formData.role === 'company' && companies.length === 0) {
            const loadCompanies = async () => {
                setIsLoadingCompanies(true);
                const result = await getCompanies();
                if (!result.error) {
                    setCompanies(result.data);
                }
                setIsLoadingCompanies(false);
            };
            void loadCompanies();
        }
    }, [open, formData.role, companies.length]);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            setValidationErrors({});
            setCopied(false);
            
            if (editingUser) {
                // Mode édition
                const companyId = isManagedUser(editingUser) ? editingUser.company_id : undefined;
                setFormData({
                    first_name: editingUser.first_name || '',
                    last_name: editingUser.last_name || '',
                    phone: editingUser.phone || '',
                    role: editingUser.role,
                    email: editingUser.email,
                    password: '',
                    must_change_password: false,
                    company_id: companyId || undefined,
                });
            } else {
                // Mode création - générer un mot de passe par défaut
                setFormData({
                    ...defaultCreateFormData,
                    password: generatePassword(),
                });
            }
        }
    }, [open, editingUser]);

    const resetForm = () => {
        setFormData(defaultCreateFormData);
        setValidationErrors({});
        setShowPassword(false);
        setCopied(false);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleFieldChange = (field: keyof CreateUserFormData, value: string | boolean | undefined) => {
        setFormData({ ...formData, [field]: value });
        
        // Effacer l'erreur de validation pour ce champ
        if (validationErrors[field]) {
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };

    const handleRoleChange = (value: string) => {
        if (MANAGED_ROLES.includes(value as ManagedRole)) {
            const newRole = value as ManagedRole;
            setFormData({ 
                ...formData, 
                role: newRole,
                // Réinitialiser company_id si on change vers un autre rôle
                company_id: newRole === 'company' ? formData.company_id : undefined,
            });
        }
    };

    const handleCompanyChange = (value: string) => {
        setFormData({ ...formData, company_id: value });
        // Effacer l'erreur de validation pour company_id
        if (validationErrors.company_id) {
            const newErrors = { ...validationErrors };
            delete newErrors.company_id;
            setValidationErrors(newErrors);
        }
    };

    const handleGeneratePassword = () => {
        const newPassword = generatePassword();
        setFormData({ ...formData, password: newPassword });
        setCopied(false);
    };

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(formData.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback si clipboard non disponible
            console.error('Impossible de copier dans le presse-papier');
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validation commune (création et édition)
        if (!MANAGED_ROLES.includes(formData.role)) {
            errors.role = 'Veuillez sélectionner un rôle valide';
        }

        // Validation company_id pour le rôle company
        if (formData.role === 'company' && !formData.company_id) {
            errors.company_id = 'Veuillez sélectionner une compagnie';
        }

        if (isCreating) {
            // Validation email
            if (!formData.email.trim()) {
                errors.email = 'L\'email est requis';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
                errors.email = 'Format d\'email invalide';
            }

            // Validation mot de passe
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.valid) {
                errors.password = passwordValidation.errors[0];
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        if (isCreating) {
            // Mode création - onCreate doit être fourni
            if (!onCreate) {
                console.error('UserFormDialog: onCreate callback manquant en mode création');
                return;
            }
            await onCreate({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                phone: formData.phone.trim(),
                role: formData.role,
                must_change_password: formData.must_change_password,
                company_id: formData.role === 'company' ? formData.company_id : undefined,
            });
        } else {
            // Mode édition - editingUser doit exister (vérification défensive)
            if (!editingUser) {
                console.error('UserFormDialog: editingUser manquant en mode édition');
                return;
            }
            await onSubmit({
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                phone: formData.phone.trim(),
                role: formData.role,
                company_id: formData.role === 'company' ? formData.company_id : undefined,
            }, true);
        }
    };

    // Calcul de la force du mot de passe
    const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

    // Validation du format email
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

    // Validation du formulaire
    const isValid = isCreating
        ? isEmailValid 
            && formData.password 
            && validatePassword(formData.password).valid 
            && MANAGED_ROLES.includes(formData.role)
            && (formData.role !== 'company' || !!formData.company_id)
        : MANAGED_ROLES.includes(formData.role)
            && (formData.role !== 'company' || !!formData.company_id);

    // En mode édition d'un utilisateur company, on ne peut pas changer le rôle ni la compagnie
    const isEditingCompanyUser = !isCreating && editingUser?.role === 'company';
    
    // En mode édition, on peut changer vers le rôle company (mais pas depuis company)
    const canSelectCompany = formData.role === 'company' && (isCreating || !isEditingCompanyUser);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
            <DialogContent 
                className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            >
                <DialogHeader>
                    <DialogTitle>
                        {isCreating ? 'Ajouter un utilisateur' : 'Modifier l\'utilisateur'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreating
                            ? 'Créez un nouveau compte utilisateur.'
                            : `Modifiez les informations de ${editingUser?.email}`}
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

                    {/* Email (création uniquement) */}
                    {isCreating ? (
                        <div className="space-y-2">
                            <Label htmlFor="new_user_email">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="new_user_email"
                                name="new_user_email_field"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                placeholder="utilisateur@exemple.fr"
                                disabled={isSubmitting}
                                className={validationErrors.email ? 'border-destructive' : ''}
                                autoComplete="off"
                                data-1p-ignore="true"
                                data-lpignore="true"
                                data-form-type="other"
                            />
                            {validationErrors.email && (
                                <p className="text-sm text-destructive">{validationErrors.email}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={editingUser?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                L&apos;email ne peut pas être modifié.
                            </p>
                        </div>
                    )}

                    {/* Mot de passe (création uniquement) */}
                    {isCreating && (
                        <div className="space-y-2">
                            <Label htmlFor="new_user_password">
                                Mot de passe <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="new_user_password"
                                        name="new_user_password_field"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                        placeholder="Mot de passe sécurisé"
                                        disabled={isSubmitting}
                                        className={`pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                                        autoComplete="new-password"
                                        data-1p-ignore="true"
                                        data-lpignore="true"
                                        data-form-type="other"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleGeneratePassword}
                                    disabled={isSubmitting}
                                    title="Générer un mot de passe"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => void handleCopyPassword()}
                                    disabled={isSubmitting || !formData.password}
                                    title="Copier le mot de passe"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-sm text-destructive">{validationErrors.password}</p>
                            )}
                            {/* Indicateur de force */}
                            {passwordStrength && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full ${
                                                    i < Math.ceil(passwordStrength.score / 25)
                                                        ? passwordStrength.score < 40
                                                            ? 'bg-red-500'
                                                            : passwordStrength.score < 60
                                                            ? 'bg-orange-500'
                                                            : passwordStrength.score < 80
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                        : 'bg-gray-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Force : {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Case à cocher changement de mot de passe */}
                    {isCreating && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="must_change_password"
                                checked={formData.must_change_password}
                                onCheckedChange={(checked) => 
                                    handleFieldChange('must_change_password', checked === true)
                                }
                                disabled={isSubmitting}
                            />
                            <Label 
                                htmlFor="must_change_password" 
                                className="text-sm font-normal cursor-pointer"
                            >
                                Forcer le changement de mot de passe à la première connexion
                            </Label>
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
                            disabled={isSubmitting || isEditingCompanyUser}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                {MANAGED_ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role === 'company' && <Building2 className="w-3 h-3 inline mr-1" />}
                                        {translateRole(role)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {getRoleDescription(formData.role)}
                        </p>
                        {isEditingCompanyUser && (
                            <p className="text-xs text-amber-600">
                                Le rôle d&apos;un utilisateur compagnie ne peut pas être changé.
                            </p>
                        )}
                    </div>

                    {/* Sélection de compagnie (si rôle = company) */}
                    {formData.role === 'company' && (
                        <div className="space-y-2">
                            <Label htmlFor="company_id">
                                Compagnie associée <span className="text-destructive">*</span>
                            </Label>
                            {isLoadingCompanies ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Chargement des compagnies...
                                </div>
                            ) : (
                                <Select
                                    value={formData.company_id || ''}
                                    onValueChange={handleCompanyChange}
                                    disabled={isSubmitting || !canSelectCompany}
                                >
                                    <SelectTrigger 
                                        id="company_id"
                                        className={validationErrors.company_id ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Sélectionner une compagnie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={company.id}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-3 h-3 text-muted-foreground" />
                                                    {company.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {validationErrors.company_id && (
                                <p className="text-sm text-destructive">{validationErrors.company_id}</p>
                            )}
                            {!isCreating && isEditingCompanyUser && (
                                <p className="text-xs text-muted-foreground">
                                    La compagnie associée ne peut pas être changée.
                                </p>
                            )}
                            {!isCreating && !isEditingCompanyUser && (
                                <p className="text-xs text-amber-600">
                                    Attention : changer le rôle vers &quot;Compagnie&quot; donnera accès aux statistiques de cette compagnie.
                                </p>
                            )}
                        </div>
                    )}
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
                        {isSubmitting 
                            ? 'Enregistrement...' 
                            : isCreating 
                            ? 'Créer' 
                            : 'Modifier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
