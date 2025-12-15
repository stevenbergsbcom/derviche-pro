import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/auth/logout-button';

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Si pas d'utilisateur ou erreur, rediriger vers login
    if (error || !user) {
        redirect('/login');
    }

    // Récupérer les métadonnées utilisateur
    const firstName = user.user_metadata?.first_name as string | undefined;
    const lastName = user.user_metadata?.last_name as string | undefined;
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || user.email;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Bienvenue sur votre tableau de bord
                </p>
            </div>

            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations du compte</CardTitle>
                        <CardDescription>
                            Vos informations de profil
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-base font-medium">{user.email}</p>
                        </div>

                        {firstName && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                                <p className="text-base font-medium">{firstName}</p>
                            </div>
                        )}

                        {lastName && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                                <p className="text-base font-medium">{lastName}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-4">
                                Bonjour <span className="font-semibold text-foreground">{displayName}</span> !
                            </p>
                            <LogoutButton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

