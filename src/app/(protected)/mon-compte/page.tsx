'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { User, Mail, Key, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
}

export default function MonComptePage() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Charger les données utilisateur
    const loadUserData = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, phone, created_at')
                .eq('id', user.id)
                .single();

            if (error) {
                logger.error('[MonCompte] Erreur chargement profil', error);
                return;
            }

            const userData: UserProfile = {
                id: profile.id,
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                email: profile.email || user.email || '',
                phone: profile.phone || '',
                createdAt: profile.created_at,
            };

            setUserData(userData);
            setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
            });
        } catch (error) {
            logger.error('[MonCompte] Erreur', error as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        void loadUserData();
    }, [loadUserData]);

    // Sauvegarder les modifications du profil
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
                logger.error('[MonCompte] Erreur sauvegarde', error);
                return;
            }

            setUserData((prev) => prev ? {
                ...prev,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
            } : null);
            setIsEditing(false);
            toast.success('Profil mis à jour');
        } catch (error) {
            logger.error('[MonCompte] Erreur', error as Error);
            toast.error('Une erreur est survenue');
        } finally {
            setIsSaving(false);
        }
    };

    // Annuler les modifications
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

    // Changer le mot de passe
    const handleChangePassword = async () => {
        setPasswordError(null);

        // Validation
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

        setIsChangingPassword(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (error) {
                setPasswordError(error.message);
                return;
            }

            setIsPasswordDialogOpen(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            toast.success('Mot de passe modifié avec succès');
        } catch (error) {
            logger.error('[MonCompte] Erreur changement mdp', error as Error);
            setPasswordError('Une erreur est survenue');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Attendre que le composant soit monté
    if (!isMounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-derviche" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Impossible de charger vos informations</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
                    Mon compte
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gérez vos informations personnelles et vos paramètres de sécurité
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Carte Informations personnelles */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Informations personnelles
                                </CardTitle>
                                <CardDescription>
                                    Vos informations de profil
                                </CardDescription>
                            </div>
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
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

                {/* Carte Email */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Compte
                        </CardTitle>
                        <CardDescription>
                            Informations de connexion
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{userData.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                L&apos;email ne peut pas être modifié. Contactez-nous si nécessaire.
                            </p>
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

                {/* Carte Sécurité */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Sécurité
                        </CardTitle>
                        <CardDescription>
                            Gérez votre mot de passe
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="font-medium">Mot de passe</p>
                                <p className="text-sm text-muted-foreground">
                                    Changer votre mot de passe régulièrement améliore la sécurité
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsPasswordDialogOpen(true)}
                            >
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
                            Choisissez un nouveau mot de passe sécurisé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                                setPasswordData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: '',
                                });
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
                            {isChangingPassword ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Changer le mot de passe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
