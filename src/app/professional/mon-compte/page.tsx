'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    User,
    Mail,
    Key,
    Save,
    Loader2,
    Building2,
    MapPin,
    Shield,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface ProProfile {
    id: string;
    email: string;
    email2: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    phone: string;
    phone2: string;
    organization: string;
    function: string;
    afcNumber: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
}

interface FormData {
    firstName: string;
    lastName: string;
    phone: string;
    phone2: string;
    email2: string;
    organization: string;
    function: string;
    afcNumber: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
}

interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

type EditingSection = 'personal' | 'professional' | 'address' | null;

/** Étapes du dialog de suppression de compte */
type DeleteStep = 'confirm' | 'deleting';

// ============================================
// SKELETON
// ============================================

function MonCompteSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-36" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ============================================
// HELPERS
// ============================================

/** Valide le nouveau mot de passe et retourne un message d'erreur ou null */
function validatePassword(data: PasswordData): string | null {
    if (!data.currentPassword) return 'Le mot de passe actuel est requis';
    if (!data.newPassword) return 'Le nouveau mot de passe est requis';
    if (data.newPassword.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères';
    if (!/[A-Z]/.test(data.newPassword)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(data.newPassword)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[0-9]/.test(data.newPassword)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (data.newPassword !== data.confirmPassword) return 'Les mots de passe ne correspondent pas';
    if (data.newPassword === data.currentPassword) return "Le nouveau mot de passe doit être différent de l'actuel";
    return null;
}

// ============================================
// SOUS-COMPOSANT : champ en lecture
// ============================================

function ReadField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">
                {value || <span className="text-muted-foreground italic text-sm">Non renseigné</span>}
            </p>
        </div>
    );
}

// ============================================
// PAGE
// ============================================

export default function ProfessionalMonComptePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profile, setProfile] = useState<ProProfile | null>(null);
    const [editingSection, setEditingSection] = useState<EditingSection>(null);

    // Dialog mot de passe
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Dialog suppression de compte (RGPD)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<DeleteStep>('confirm');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        phone: '',
        phone2: '',
        email2: '',
        organization: '',
        function: '',
        afcNumber: '',
        address: '',
        postalCode: '',
        city: '',
        country: '',
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // ----------------------------------------
    // CHARGEMENT
    // ----------------------------------------

    const loadProfile = useCallback(async () => {
        try {
            setLoadError(false);
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select(
                    'id, email, email2, first_name, last_name, phone, phone2, structure, function, afc_number, address, postal_code, city, country, created_at'
                )
                .eq('id', user.id)
                .single();

            if (error) {
                logger.error('[ProMonCompte] Erreur chargement profil', error);
                setLoadError(true);
                return;
            }

            const loaded: ProProfile = {
                id: data.id as string,
                email: (data.email as string | null) ?? user.email ?? '',
                email2: (data.email2 as string | null) ?? '',
                createdAt: data.created_at as string,
                firstName: (data.first_name as string | null) ?? '',
                lastName: (data.last_name as string | null) ?? '',
                phone: (data.phone as string | null) ?? '',
                phone2: (data.phone2 as string | null) ?? '',
                organization: (data.structure as string | null) ?? '',
                function: (data.function as string | null) ?? '',
                afcNumber: (data.afc_number as string | null) ?? '',
                address: (data.address as string | null) ?? '',
                postalCode: (data.postal_code as string | null) ?? '',
                city: (data.city as string | null) ?? '',
                country: (data.country as string | null) ?? 'France',
            };

            setProfile(loaded);
            setFormData({
                firstName: loaded.firstName,
                lastName: loaded.lastName,
                phone: loaded.phone,
                phone2: loaded.phone2,
                email2: loaded.email2,
                organization: loaded.organization,
                function: loaded.function,
                afcNumber: loaded.afcNumber,
                address: loaded.address,
                postalCode: loaded.postalCode,
                city: loaded.city,
                country: loaded.country,
            });
        } catch (err) {
            logger.error('[ProMonCompte] Erreur inattendue', err instanceof Error ? err : new Error(String(err)));
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    // ----------------------------------------
    // SAUVEGARDE PAR SECTION
    // ----------------------------------------

    const handleSave = async (section: NonNullable<EditingSection>) => {
        if (!profile) return;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const updates: Record<string, string | null> = {};

            if (section === 'personal') {
                updates.first_name = formData.firstName.trim() || null;
                updates.last_name = formData.lastName.trim() || null;
                updates.phone = formData.phone.trim() || null;
                updates.phone2 = formData.phone2.trim() || null;
                updates.email2 = formData.email2.trim() || null;
            } else if (section === 'professional') {
                updates.structure = formData.organization.trim() || null;
                updates.function = formData.function.trim() || null;
                updates.afc_number = formData.afcNumber.trim() || null;
            } else if (section === 'address') {
                updates.address = formData.address.trim() || null;
                updates.postal_code = formData.postalCode.trim() || null;
                updates.city = formData.city.trim() || null;
                updates.country = formData.country.trim() || 'France';
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (error) {
                logger.error('[ProMonCompte] Erreur sauvegarde', error);
                toast.error('Erreur lors de la sauvegarde');
                return;
            }

            setProfile((prev) => {
                if (!prev) return null;
                if (section === 'personal') {
                    return {
                        ...prev,
                        firstName: formData.firstName.trim(),
                        lastName: formData.lastName.trim(),
                        phone: formData.phone.trim(),
                        phone2: formData.phone2.trim(),
                        email2: formData.email2.trim(),
                    };
                }
                if (section === 'professional') {
                    return {
                        ...prev,
                        organization: formData.organization.trim(),
                        function: formData.function.trim(),
                        afcNumber: formData.afcNumber.trim(),
                    };
                }
                return {
                    ...prev,
                    address: formData.address.trim(),
                    postalCode: formData.postalCode.trim(),
                    city: formData.city.trim(),
                    country: formData.country.trim() || 'France',
                };
            });

            setEditingSection(null);
            toast.success('Profil mis à jour');
        } catch (err) {
            logger.error('[ProMonCompte] Erreur sauvegarde', err instanceof Error ? err : new Error(String(err)));
            toast.error('Une erreur est survenue');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = (section: NonNullable<EditingSection>) => {
        if (!profile) return;
        if (section === 'personal') {
            setFormData((prev) => ({
                ...prev,
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                phone2: profile.phone2,
                email2: profile.email2,
            }));
        } else if (section === 'professional') {
            setFormData((prev) => ({
                ...prev,
                organization: profile.organization,
                function: profile.function,
                afcNumber: profile.afcNumber,
            }));
        } else if (section === 'address') {
            setFormData((prev) => ({
                ...prev,
                address: profile.address,
                postalCode: profile.postalCode,
                city: profile.city,
                country: profile.country,
            }));
        }
        setEditingSection(null);
    };

    // ----------------------------------------
    // CHANGEMENT MOT DE PASSE
    // ----------------------------------------

    const handleChangePassword = async () => {
        setPasswordError(null);
        const error = validatePassword(passwordData);
        if (error) {
            setPasswordError(error);
            return;
        }

        setIsChangingPassword(true);
        try {
            const verifyResponse = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordData.currentPassword }),
            });

            if (!verifyResponse.ok) {
                setPasswordError('Erreur de communication avec le serveur');
                return;
            }

            const verifyResult = (await verifyResponse.json()) as {
                success: boolean;
                valid?: boolean;
                error?: string;
            };

            if (!verifyResult.success) {
                setPasswordError(verifyResult.error ?? 'Erreur de vérification');
                return;
            }
            if (!verifyResult.valid) {
                setPasswordError('Le mot de passe actuel est incorrect');
                return;
            }

            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (updateError) {
                setPasswordError(updateError.message);
                return;
            }

            handleClosePasswordDialog();
            toast.success('Mot de passe modifié avec succès');
        } catch (err) {
            logger.error('[ProMonCompte] Erreur changement mdp', err instanceof Error ? err : new Error(String(err)));
            setPasswordError('Une erreur est survenue');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleClosePasswordDialog = useCallback(() => {
        setIsPasswordDialogOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError(null);
    }, []);

    // ----------------------------------------
    // SUPPRESSION DE COMPTE (RGPD Art. 17)
    // ----------------------------------------

    const handleOpenDeleteDialog = useCallback(() => {
        setDeleteConfirmText('');
        setDeleteError(null);
        setDeleteStep('confirm');
        setIsDeleteDialogOpen(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        // Empêcher la fermeture pendant la suppression en cours
        if (deleteStep === 'deleting') return;
        setIsDeleteDialogOpen(false);
        setDeleteConfirmText('');
        setDeleteError(null);
        setDeleteStep('confirm');
    }, [deleteStep]);

    const handleDeleteAccount = useCallback(async () => {
        if (deleteConfirmText !== 'SUPPRIMER') {
            setDeleteError('Veuillez taper exactement « SUPPRIMER » pour confirmer.');
            return;
        }

        setDeleteError(null);
        setDeleteStep('deleting');

        try {
            const response = await fetch('/api/professional/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const result = (await response.json()) as { success: boolean; error?: string };

            if (!result.success) {
                logger.error('[ProMonCompte] Erreur suppression compte', { error: result.error });
                setDeleteError(result.error ?? 'Une erreur est survenue. Veuillez réessayer.');
                setDeleteStep('confirm');
                return;
            }

            // Succès — déconnexion puis redirection vers /login
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login?message=account_deleted';
        } catch (err) {
            logger.error('[ProMonCompte] Exception suppression compte', err instanceof Error ? err : new Error(String(err)));
            setDeleteError('Une erreur inattendue est survenue. Veuillez réessayer.');
            setDeleteStep('confirm');
        }
    }, [deleteConfirmText]);

    // ----------------------------------------
    // RENDER
    // ----------------------------------------

    if (isLoading) return <MonCompteSkeleton />;

    if (loadError || (!isLoading && !profile)) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
                <p className="text-muted-foreground">Impossible de charger vos informations.</p>
                <Button variant="outline" onClick={() => void loadProfile()}>
                    Réessayer
                </Button>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-bold text-derviche-dark">Mon compte</h1>
                <p className="text-muted-foreground">
                    Gérez vos informations personnelles et professionnelles
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ------------------------------------------------ */}
                {/* SECTION 1 — Informations personnelles             */}
                {/* ------------------------------------------------ */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="w-4 h-4 text-derviche" />
                                    Informations personnelles
                                </CardTitle>
                                <CardDescription>Prénom, nom, téléphone, email secondaire</CardDescription>
                            </div>
                            {editingSection !== 'personal' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    aria-label="Modifier les informations personnelles"
                                    onClick={() => setEditingSection('personal')}
                                >
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editingSection === 'personal' ? (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Prénom</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, firstName: e.target.value })
                                            }
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Nom</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, lastName: e.target.value })
                                            }
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone2">Téléphone secondaire</Label>
                                        <Input
                                            id="phone2"
                                            type="tel"
                                            value={formData.phone2}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone2: e.target.value })
                                            }
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email2">Email secondaire</Label>
                                        <Input
                                            id="email2"
                                            type="email"
                                            value={formData.email2}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email2: e.target.value })
                                            }
                                            disabled={isSaving}
                                            placeholder="contact@exemple.fr"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleCancelEdit('personal')}
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                                        onClick={() => void handleSave('personal')}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ReadField label="Prénom" value={profile.firstName} />
                                <ReadField label="Nom" value={profile.lastName} />
                                <ReadField label="Téléphone" value={profile.phone} />
                                <ReadField label="Téléphone secondaire" value={profile.phone2} />
                                <ReadField label="Email secondaire" value={profile.email2} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ------------------------------------------------ */}
                {/* SECTION 2 — Informations professionnelles          */}
                {/* ------------------------------------------------ */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="w-4 h-4 text-derviche" />
                                    Informations professionnelles
                                </CardTitle>
                                <CardDescription>Structure, fonction, numéro AFC</CardDescription>
                            </div>
                            {editingSection !== 'professional' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    aria-label="Modifier les informations professionnelles"
                                    onClick={() => setEditingSection('professional')}
                                >
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editingSection === 'professional' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Structure / Organisation</Label>
                                    <Input
                                        id="organization"
                                        value={formData.organization}
                                        onChange={(e) =>
                                            setFormData({ ...formData, organization: e.target.value })
                                        }
                                        disabled={isSaving}
                                        placeholder="Nom de votre structure"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proFunction">Fonction</Label>
                                    <Input
                                        id="proFunction"
                                        value={formData.function}
                                        onChange={(e) =>
                                            setFormData({ ...formData, function: e.target.value })
                                        }
                                        disabled={isSaving}
                                        placeholder="Votre fonction dans la structure"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="afcNumber">Numéro AFC</Label>
                                    <Input
                                        id="afcNumber"
                                        value={formData.afcNumber}
                                        onChange={(e) =>
                                            setFormData({ ...formData, afcNumber: e.target.value })
                                        }
                                        disabled={isSaving}
                                        placeholder="Ex: 12345"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleCancelEdit('professional')}
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                                        onClick={() => void handleSave('professional')}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <ReadField label="Structure / Organisation" value={profile.organization} />
                                <ReadField label="Fonction" value={profile.function} />
                                <ReadField label="Numéro AFC" value={profile.afcNumber} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ------------------------------------------------ */}
                {/* SECTION 3 — Adresse                               */}
                {/* ------------------------------------------------ */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="w-4 h-4 text-derviche" />
                                    Adresse
                                </CardTitle>
                                <CardDescription>Adresse postale complète</CardDescription>
                            </div>
                            {editingSection !== 'address' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    aria-label="Modifier l'adresse"
                                    onClick={() => setEditingSection('address')}
                                >
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editingSection === 'address' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        disabled={isSaving}
                                        placeholder="Numéro et nom de rue"
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">Code postal</Label>
                                        <Input
                                            id="postalCode"
                                            value={formData.postalCode}
                                            onChange={(e) =>
                                                setFormData({ ...formData, postalCode: e.target.value })
                                            }
                                            disabled={isSaving}
                                            placeholder="75000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            disabled={isSaving}
                                            placeholder="Paris"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) =>
                                            setFormData({ ...formData, country: e.target.value })
                                        }
                                        disabled={isSaving}
                                        placeholder="France"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleCancelEdit('address')}
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        className="flex-1 bg-derviche hover:bg-derviche-dark text-white"
                                        onClick={() => void handleSave('address')}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <ReadField label="Adresse" value={profile.address} />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <ReadField label="Code postal" value={profile.postalCode} />
                                    <ReadField label="Ville" value={profile.city} />
                                </div>
                                <ReadField label="Pays" value={profile.country} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ------------------------------------------------ */}
                {/* SECTION 4 — Compte et sécurité                    */}
                {/* ------------------------------------------------ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="w-4 h-4 text-derviche" />
                            Compte et sécurité
                        </CardTitle>
                        <CardDescription>Email et mot de passe</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                Email
                            </p>
                            <p className="font-medium">{profile.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                L&apos;email ne peut pas être modifié directement. Contactez Derviche
                                Diffusion si nécessaire.
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Membre depuis</p>
                            <p className="font-medium">
                                {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-sm">Mot de passe</p>
                                    <p className="text-xs text-muted-foreground">
                                        Changez régulièrement votre mot de passe
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPasswordDialogOpen(true)}
                                >
                                    <Key className="w-4 h-4 mr-2" />
                                    Modifier
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ------------------------------------------------ */}
            {/* SECTION 5 — Zone dangereuse (hors grille 2 col)  */}
            {/* ------------------------------------------------ */}
            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        Zone dangereuse
                    </CardTitle>
                    <CardDescription>
                        Actions irréversibles sur votre compte
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Supprimer mon compte</p>
                            <p className="text-xs text-muted-foreground">
                                Supprime définitivement votre compte et toutes vos données personnelles.
                                Vos réservations futures seront annulées. Cette action est irréversible.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="shrink-0"
                            onClick={handleOpenDeleteDialog}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ------------------------------------------------ */}
            {/* MODALE — Changement de mot de passe              */}
            {/* ------------------------------------------------ */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={handleClosePasswordDialog}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Changer le mot de passe</DialogTitle>
                        <DialogDescription>
                            Entrez votre mot de passe actuel et choisissez un nouveau mot de passe
                            sécurisé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                }
                                disabled={isChangingPassword}
                                autoComplete="current-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                                }
                                disabled={isChangingPassword}
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum 10 caractères avec majuscules, minuscules et chiffres
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                }
                                disabled={isChangingPassword}
                                autoComplete="new-password"
                            />
                        </div>
                        {passwordError && (
                            <p role="alert" className="text-sm text-destructive">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClosePasswordDialog}
                            className="w-full sm:w-auto"
                            disabled={isChangingPassword}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => void handleChangePassword()}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-dark text-white"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Changer le mot de passe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ------------------------------------------------ */}
            {/* MODALE — Suppression de compte (RGPD Art. 17)   */}
            {/* ------------------------------------------------ */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Supprimer mon compte
                        </DialogTitle>
                        <DialogDescription className="text-left space-y-2 pt-1">
                            <span className="block">
                                Cette action est <strong>définitive et irréversible</strong>.
                            </span>
                            <span className="block">
                                Vos données personnelles seront effacées et vos réservations futures
                                annulées automatiquement. Vos réservations passées seront conservées
                                de façon anonyme à des fins statistiques.
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    {deleteStep === 'confirm' && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="deleteConfirm">
                                    Tapez{' '}
                                    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                                        SUPPRIMER
                                    </code>{' '}
                                    pour confirmer
                                </Label>
                                <Input
                                    id="deleteConfirm"
                                    value={deleteConfirmText}
                                    onChange={(e) => {
                                        setDeleteConfirmText(e.target.value);
                                        setDeleteError(null);
                                    }}
                                    placeholder="SUPPRIMER"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                />
                            </div>
                            {deleteError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {deleteError}
                                </p>
                            )}
                        </div>
                    )}

                    {deleteStep === 'deleting' && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <Loader2 className="w-8 h-8 animate-spin text-destructive" />
                            <p className="text-sm text-muted-foreground">
                                Suppression en cours…
                            </p>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCloseDeleteDialog}
                            className="w-full sm:w-auto"
                            disabled={deleteStep === 'deleting'}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleDeleteAccount()}
                            className="w-full sm:w-auto"
                            disabled={
                                deleteStep === 'deleting' ||
                                deleteConfirmText !== 'SUPPRIMER'
                            }
                        >
                            {deleteStep === 'deleting' ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Supprimer définitivement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
