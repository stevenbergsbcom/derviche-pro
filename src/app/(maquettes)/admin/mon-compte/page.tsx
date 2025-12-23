'use client';

import { useState, useEffect } from 'react';
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
import { User, Mail, Phone, Shield, Key, Save } from 'lucide-react';

// Données mock pour la maquette
const mockUserData = {
    id: 'user-1',
    firstName: 'Steven',
    lastName: 'Berg',
    email: 'steven.berg@sbcom.fr',
    phone: '+33 6 12 34 56 78',
    role: 'super-admin' as const,
    createdAt: '2024-01-15',
};

// Fonction pour formater le rôle
function formatRole(role: string): string {
    switch (role) {
        case 'super-admin':
            return 'Super Admin';
        case 'admin':
            return 'Admin';
        case 'externe-dd':
            return 'Externe DD';
        case 'programmateur':
            return 'Programmateur';
        case 'compagnie':
            return 'Compagnie';
        default:
            return role;
    }
}

// Fonction pour obtenir la couleur du badge de rôle
function getRoleBadgeClass(role: string): string {
    switch (role) {
        case 'super-admin':
            return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
        case 'admin':
            return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
        case 'externe-dd':
            return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
        case 'programmateur':
            return 'bg-green-500/10 text-green-700 border-green-500/20';
        case 'compagnie':
            return 'bg-gold/10 text-gold border-gold/20';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

export default function MonComptePage() {
    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [userData, setUserData] = useState(mockUserData);
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Attendre que le composant soit monté
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // Sauvegarder les modifications du profil
    const handleSaveProfile = () => {
        setUserData((prev) => ({
            ...prev,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
        }));
        setIsEditing(false);
    };

    // Annuler les modifications
    const handleCancelEdit = () => {
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
        });
        setIsEditing(false);
    };

    // Changer le mot de passe
    const handleChangePassword = () => {
        setPasswordError(null);

        // Validation
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
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        // Simulation de succès
        setIsPasswordDialogOpen(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        // TODO: Afficher une notification de succès
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
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
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="flex-1"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleSaveProfile}
                                        className="flex-1 bg-derviche hover:bg-derviche-light"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Enregistrer
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Prénom</p>
                                        <p className="font-medium">{userData.firstName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nom</p>
                                        <p className="font-medium">{userData.lastName}</p>
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

                {/* Carte Email et Rôle */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Compte et accès
                        </CardTitle>
                        <CardDescription>
                            Informations de connexion et permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </p>
                            <p className="font-medium">{userData.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                L&apos;email ne peut pas être modifié. Contactez un administrateur si nécessaire.
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
                                    Dernière modification : il y a plus de 30 jours
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
                            Entrez votre mot de passe actuel et choisissez un nouveau mot de passe.
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
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        >
                            Changer le mot de passe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
