'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { User, Mail, Shield, Key, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { AdminPageHeader } from '@/components/admin';

// ============================================
// TYPES
// ============================================

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
}

// ============================================
// HELPERS
// ============================================

function formatRole(role: string): string {
    switch (role) {
        case 'super-admin': return 'Super Admin';
        case 'admin': return 'Admin';
        case 'externe': return 'Externe DD';
        case 'programmateur': return 'Programmateur';
        case 'company': return 'Compagnie';
        default: return role;
    }
}

function getRoleBadgeClass(role: string): string {
    switch (role) {
        case 'super-admin': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
        case 'admin': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
        case 'externe': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
        case 'programmateur': return 'bg-green-500/10 text-green-700 border-green-500/20';
        case 'company': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
        default: return 'bg-muted text-muted-foreground';
    }
}

// ============================================
// SKELETON
// ============================================

function MonCompteSkeleton() {
    return (
        <div className="space-y-6">
            <AdminPageHeader title="Mon compte" />
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-6 w-24" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============================================
// PAGE
// ============================================

export default function AdminMonComptePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // ----------------------------------------
    // CHARGEMENT DEPUIS SUPABASE
    // ----------------------------------------

    const loadUserData = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Charger le profil et le rôle en parallèle
            const [profileResult, roleResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, first_name, last_name, email, phone, created_at')
                    .eq('id', user.id)
                    .single(),
                supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single(),
            ]);

            if (profileResult.error) {
                logger.error('[AdminMonCompte] Erreur chargement profil', profileResult.error);
                return;
            }

            const profile = profileResult.data;
            if (roleResult.error) {
                logger.error('[AdminMonCompte] Erreur chargement rôle', roleResult.error);
            }
            const role = roleResult.data?.role ?? 'admin';

            const loaded: UserProfile = {
                id: profile.id,
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                email: profile.email || user.email || '',
                phone: profile.phone || '',
                role,
                createdAt: profile.created_at,
            };

            setUserData(loaded);
            setFormData({
                firstName: loaded.firstName,
                lastName: loaded.lastName,
                phone: loaded.phone,
            });
        } catch (err) {
            logger.error('[AdminMonCompte] Erreur inattendue', err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUserData();
    }, [loadUserData]);

    // ----------------------------------------
    // SAUVEGARDE PROFIL
    // ----------------------------------------

    const handleSaveProfile = async () => {
        if (!userData) return;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.firstName.trim() || null,
                    last_name: formData.lastName.trim() || null,
                    phone: formData.phone.trim() || null,
                })
                .eq('id', userData.id);

            if (error) {
                toast.error('Erreur lors de la sauvegarde');
                logger.error('[AdminMonCompte] Erreur sauvegarde', error);
                return;
            }

            setUserData((prev) =>
                prev
                    ? {
                          ...prev,
                          firstName: formData.firstName.trim(),
                          lastName: formData.lastName.trim(),
                          phone: formData.phone.trim(),
                      }
                    : null
            );
            setIsEditing(false);
            toast.success('Profil mis à jour');
        } catch (err) {
            logger.error('[AdminMonCompte] Erreur', err as Error);
            toast.error('Une erreur est survenue');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (userData) {
            setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
            });
        }
        setIsEditing(false);
    };

    // ----------------------------------------
    // CHANGEMENT MOT DE PASSE
    // ----------------------------------------

    const handleChangePassword = async () => {
        setPasswordError(null);

        if (!passwordData.currentPassword) {
            setPasswordError('Le mot de passe actuel est requis');
            return;
        }
        if (!passwordData.newPassword) {
            setPasswordError('Le nouveau mot de passe est requis');
            return;
        }
        if (passwordData.newPassword.length < 10) {
            setPasswordError('Le mot de passe doit contenir au moins 10 caractères');
            return;
        }
        if (!/[A-Z]/.test(passwordData.newPassword)) {
            setPasswordError('Le mot de passe doit contenir au moins une majuscule');
            return;
        }
        if (!/[a-z]/.test(passwordData.newPassword)) {
            setPasswordError('Le mot de passe doit contenir au moins une minuscule');
            return;
        }
        if (!/[0-9]/.test(passwordData.newPassword)) {
            setPasswordError('Le mot de passe doit contenir au moins un chiffre');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return;
        }
        if (passwordData.newPassword === passwordData.currentPassword) {
            setPasswordError('Le nouveau mot de passe doit être différent de l\'actuel');
            return;
        }

        setIsChangingPassword(true);
        try {
            // Vérifier le mot de passe actuel via l'API dédiée
            const verifyResponse = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordData.currentPassword }),
            });

            const verifyResult = await verifyResponse.json() as {
                success: boolean;
                valid?: boolean;
                error?: string;
            };

            if (!verifyResult.success) {
                setPasswordError(verifyResult.error || 'Erreur de vérification');
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

            setIsPasswordDialogOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Mot de passe modifié avec succès');
        } catch (err) {
            logger.error('[AdminMonCompte] Erreur changement mdp', err as Error);
            setPasswordError('Une erreur est survenue');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // ----------------------------------------
    // RENDER
    // ----------------------------------------

    if (isLoading) return <MonCompteSkeleton />;

    if (!userData) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Mon compte" />
                <p className="text-muted-foreground">Impossible de charger vos informations.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Mon compte" />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Informations personnelles */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Informations personnelles
                                </CardTitle>
                                <CardDescription>Vos informations de profil</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
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
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="flex-1"
                                        disabled={isSaving}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => void handleSaveProfile()}
                                        className="flex-1 bg-derviche hover:bg-derviche-light"
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
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Prénom</p>
                                        <p className="font-medium">{userData.firstName || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nom</p>
                                        <p className="font-medium">{userData.lastName || 'Non renseigné'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Téléphone</p>
                                    <p className="font-medium">{userData.phone || 'Non renseigné'}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Compte et accès */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Compte et accès
                        </CardTitle>
                        <CardDescription>Informations de connexion et permissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </p>
                            <p className="font-medium">{userData.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                L&apos;email ne peut pas être modifié. Contactez un super-administrateur si nécessaire.
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Rôle</p>
                            <Badge className={getRoleBadgeClass(userData.role)}>
                                {formatRole(userData.role)}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Membre depuis</p>
                            <p className="font-medium">
                                {new Date(userData.createdAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sécurité */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Sécurité
                        </CardTitle>
                        <CardDescription>Gérez votre mot de passe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="font-medium">Mot de passe</p>
                                <p className="text-sm text-muted-foreground">
                                    Changer votre mot de passe régulièrement améliore la sécurité
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                                <Key className="w-4 h-4 mr-2" />
                                Changer le mot de passe
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modale changement de mot de passe */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Changer le mot de passe</DialogTitle>
                        <DialogDescription>
                            Entrez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé.
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
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPasswordDialogOpen(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                setPasswordError(null);
                            }}
                            className="w-full sm:w-auto"
                            disabled={isChangingPassword}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => void handleChangePassword()}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Changer le mot de passe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
