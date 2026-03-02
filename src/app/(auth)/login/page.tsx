'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { checkAccountStatus } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/get-user-role';
import { isSafeRedirectUrl, getRedirectUrlByRole } from '@/lib/auth/redirect-utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

// Schéma de validation pour email/password
const emailPasswordSchema = z.object({
    email: z.string().email('Format email invalide').min(1, 'Email requis'),
    password: z
        .string()
        .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

// Schéma de validation pour magic link
const magicLinkSchema = z.object({
    email: z.string().email('Format email invalide').min(1, 'Email requis'),
});

type EmailPasswordForm = z.infer<typeof emailPasswordSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

// ============================================
// Composant pour gérer les erreurs URL (nécessite Suspense)
// ============================================
function LoginErrorHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'account_deleted') {
            toast.error('Ce compte a été supprimé. Vous pouvez créer un nouveau compte.');
            router.replace('/login');
        } else if (error === 'account_disabled') {
            toast.error('Votre compte a été désactivé. Contactez un administrateur.');
            router.replace('/login');
        }
    }, [searchParams, router]);

    return null;
}

// ============================================
// Composant principal du formulaire
// ============================================
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoadingEmailPassword, setIsLoadingEmailPassword] = useState(false);
    const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Récupérer l'URL de redirection depuis les paramètres
    const nextUrl = searchParams.get('next');

    const emailPasswordForm = useForm<EmailPasswordForm>({
        resolver: zodResolver(emailPasswordSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const magicLinkForm = useForm<MagicLinkForm>({
        resolver: zodResolver(magicLinkSchema),
        defaultValues: {
            email: '',
        },
    });

    const handleEmailPasswordSubmit = async (data: EmailPasswordForm) => {
        setIsLoadingEmailPassword(true);

        try {
            const supabase = createClient();
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                // Message générique pour ne pas révéler si l'email existe
                toast.error('Email ou mot de passe incorrect');
                return;
            }

            const userId = authData.user?.id;
            if (!userId) {
                toast.error('Une erreur est survenue lors de la connexion');
                return;
            }

            // Vérifier le statut du compte via Server Action (service role, bypasse RLS)
            // En cas d'échec du Server Action, on continue — le middleware prend le relais
            const accessToken = authData.session?.access_token ?? '';
            let accountStatus: string = 'ok';
            try {
                accountStatus = await checkAccountStatus(userId, accessToken);
            } catch {
                logger.warn('[Login] Server Action check-account-status a échoué, middleware prend le relais');
            }

            if (accountStatus === 'deleted' || accountStatus === 'not_found') {
                await supabase.auth.signOut();
                toast.error('Ce compte a été supprimé. Vous pouvez créer un nouveau compte.');
                return;
            }

            if (accountStatus === 'disabled') {
                await supabase.auth.signOut();
                toast.error('Votre compte a été désactivé. Contactez un administrateur.');
                return;
            }

            // Récupérer le rôle avant toute redirection
            const role = await getUserRole(userId);
            if (!role) {
                await supabase.auth.signOut();
                toast.error('Aucun accès associé à ce compte. Contactez un administrateur.');
                return;
            }

            // Pas de toast ici — la redirection réussie EST le feedback
            if (nextUrl && isSafeRedirectUrl(nextUrl)) {
                router.push(nextUrl);
            } else {
                const redirectUrl = getRedirectUrlByRole(role);
                router.push(redirectUrl);
            }
        } catch (error) {
            logger.error('[Login] Erreur de connexion', error as Error);
            toast.error('Une erreur est survenue lors de la connexion');
        } finally {
            setIsLoadingEmailPassword(false);
        }
    };

    const handleMagicLinkSubmit = async (data: MagicLinkForm) => {
        setIsLoadingMagicLink(true);

        try {
            const supabase = createClient();
            
            // Construire l'URL de callback avec le paramètre next si présent et sécurisé
            const callbackUrl = new URL('/auth/callback', window.location.origin);
            if (nextUrl && isSafeRedirectUrl(nextUrl)) {
                callbackUrl.searchParams.set('next', nextUrl);
            }
            
            const { error } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                    emailRedirectTo: callbackUrl.toString(),
                },
            });

            if (error) {
                toast.error(error.message || 'Erreur lors de l\'envoi du lien');
                return;
            }

            toast.success('Vérifiez votre boîte email !');
            magicLinkForm.reset();
        } catch (error) {
            logger.error('[Login] Erreur magic link', error as Error);
            toast.error('Une erreur est survenue lors de l\'envoi du lien');
        } finally {
            setIsLoadingMagicLink(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Connexion
                </h2>
                <p className="text-sm text-muted-foreground">
                    Connectez-vous à votre compte pour continuer
                </p>
            </div>

            <Tabs defaultValue="email-password" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email-password">Email et mot de passe</TabsTrigger>
                    <TabsTrigger value="magic-link">Lien magique</TabsTrigger>
                </TabsList>

                {/* Onglet Email/Password */}
                <TabsContent value="email-password" className="space-y-4">
                    <Form {...emailPasswordForm}>
                        <form
                            onSubmit={emailPasswordForm.handleSubmit(handleEmailPasswordSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={emailPasswordForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="votre@email.com"
                                                autoComplete="email"
                                                disabled={isLoadingEmailPassword}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={emailPasswordForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Mot de passe</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Mot de passe oublié ?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                    disabled={isLoadingEmailPassword}
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoadingEmailPassword}
                            >
                                {isLoadingEmailPassword && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                Se connecter
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                {/* Onglet Magic Link */}
                <TabsContent value="magic-link" className="space-y-4">
                    <Form {...magicLinkForm}>
                        <form
                            onSubmit={magicLinkForm.handleSubmit(handleMagicLinkSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={magicLinkForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="votre@email.com"
                                                autoComplete="email"
                                                disabled={isLoadingMagicLink}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            Un lien de connexion sera envoyé à cette adresse email
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoadingMagicLink}
                            >
                                {isLoadingMagicLink && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                Envoyer le lien
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Pas encore de compte ? </span>
                <Link href="/register" className="text-primary hover:underline font-medium">
                    S{"'"}inscrire
                </Link>
            </div>
        </div>
    );
}

// ============================================
// Page exportée avec Suspense
// ============================================
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        }>
            <LoginErrorHandler />
            <LoginForm />
        </Suspense>
    );
}
