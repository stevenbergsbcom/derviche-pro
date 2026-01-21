/**
 * Dialogue de création d'un accès utilisateur pour une compagnie
 * Derviche Diffusion
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';
import { generatePassword, getPasswordStrength } from '@/lib/utils/password-generator';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface CreateCompanyUserDialogProps {
    /** Est-ce que le dialog est ouvert */
    open: boolean;
    /** Callback pour changer l'état d'ouverture */
    onOpenChange: (open: boolean) => void;
    /** ID de la compagnie */
    companyId: string;
    /** Nom de la compagnie (pour l'affichage) */
    companyName: string;
    /** Callback appelé après création réussie */
    onSuccess: () => void;
}

interface CreateUserApiResponse {
    success: boolean;
    error?: string;
    user?: { id: string; email: string };
    reactivated?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function CreateCompanyUserDialog({
    open,
    onOpenChange,
    companyId,
    companyName,
    onSuccess,
}: CreateCompanyUserDialogProps) {
    // États du formulaire
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState(() => generatePassword());
    const [mustChangePassword, setMustChangePassword] = useState(true);

    // États UI
    const [showPassword, setShowPassword] = useState(true); // Visible par défaut pour l'admin
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Force du mot de passe
    const passwordStrength = getPasswordStrength(password);

    // Générer un nouveau mot de passe
    const handleGeneratePassword = useCallback(() => {
        setPassword(generatePassword());
        setCopied(false);
    }, []);

    // Copier le mot de passe
    const handleCopyPassword = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback si clipboard non disponible
            const textArea = document.createElement('textarea');
            textArea.value = password;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [password]);

    // Réinitialiser le formulaire
    const resetForm = useCallback(() => {
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setPassword(generatePassword());
        setMustChangePassword(true);
        setError(null);
        setCopied(false);
    }, []);

    // Fermer le dialog
    const handleClose = useCallback(() => {
        resetForm();
        onOpenChange(false);
    }, [resetForm, onOpenChange]);

    // Créer l'utilisateur via l'API
    const createCompanyUser = useCallback(async () => {
        try {
            logger.info('CreateCompanyUserDialog - Création utilisateur company', { 
                email: email.trim().toLowerCase(), 
                companyId 
            });

            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                    first_name: firstName.trim() || undefined,
                    last_name: lastName.trim() || undefined,
                    phone: phone.trim() || undefined,
                    role: 'company',
                    company_id: companyId,
                    must_change_password: mustChangePassword,
                }),
            });

            if (!response.ok) {
                const result = await response.json() as CreateUserApiResponse;
                const errorMessage = result.error || `Erreur HTTP ${response.status}`;
                logger.error('CreateCompanyUserDialog - Erreur HTTP', { status: response.status, error: errorMessage });
                return { success: false, error: errorMessage };
            }

            const result = await response.json() as CreateUserApiResponse;

            if (!result.success) {
                logger.error('CreateCompanyUserDialog - Erreur API', { error: result.error });
                return { success: false, error: result.error || 'Erreur lors de la création' };
            }

            if (result.reactivated) {
                logger.info('CreateCompanyUserDialog - Compte réactivé', { user: result.user });
            } else {
                logger.info('CreateCompanyUserDialog - Création réussie', { user: result.user });
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            logger.error('CreateCompanyUserDialog - Exception', { error: message });
            return { success: false, error: message };
        }
    }, [email, password, firstName, lastName, phone, companyId, mustChangePassword]);

    // Soumettre le formulaire
    const handleSubmit = useCallback(async () => {
        // Validation basique
        if (!email.trim()) {
            setError('L\'email est obligatoire');
            return;
        }

        if (!email.includes('@')) {
            setError('L\'email n\'est pas valide');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await createCompanyUser();

        setIsSubmitting(false);

        if (result.success) {
            onSuccess();
            handleClose();
        } else {
            setError(result.error || 'Erreur lors de la création');
        }
    }, [email, createCompanyUser, onSuccess, handleClose]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un accès utilisateur</DialogTitle>
                    <DialogDescription>
                        Créer un compte pour la compagnie « {companyName} »
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contact@compagnie.fr"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            L&apos;email servira d&apos;identifiant de connexion
                        </p>
                    </div>

                    {/* Prénom / Nom */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Jean"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Dupont"
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
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="06 12 34 56 78"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    className="pr-20 font-mono text-sm"
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isSubmitting}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => void handleCopyPassword()}
                                        disabled={isSubmitting}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleGeneratePassword}
                                disabled={isSubmitting}
                                title="Générer un nouveau mot de passe"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        {/* Indicateur de force */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${passwordStrength.label === 'faible'
                                        ? 'bg-red-500 w-1/4'
                                        : passwordStrength.label === 'moyen'
                                            ? 'bg-yellow-500 w-2/4'
                                            : passwordStrength.label === 'fort'
                                                ? 'bg-green-500 w-3/4'
                                                : 'bg-green-600 w-full'
                                        }`}
                                />
                            </div>
                            <span
                                className={`text-xs ${passwordStrength.label === 'faible'
                                    ? 'text-red-600'
                                    : passwordStrength.label === 'moyen'
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}
                            >
                                {passwordStrength.label}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Min. 10 caractères, 1 majuscule, 1 minuscule, 1 chiffre
                        </p>
                    </div>

                    {/* Changement de mot de passe obligatoire */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="mustChangePassword"
                            checked={mustChangePassword}
                            onCheckedChange={(checked) => setMustChangePassword(checked === true)}
                            disabled={isSubmitting}
                        />
                        <Label htmlFor="mustChangePassword" className="text-sm font-normal cursor-pointer">
                            Obliger à changer le mot de passe à la première connexion
                        </Label>
                    </div>

                    {/* Rappel : communication manuelle */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <strong>Important :</strong> Pensez à communiquer l&apos;email et le mot de passe
                            à la compagnie par un canal sécurisé (téléphone, courrier...).
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter className="border-t pt-4 mt-2 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting || !email.trim()}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Création...
                            </>
                        ) : (
                            "Créer l'accès"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
