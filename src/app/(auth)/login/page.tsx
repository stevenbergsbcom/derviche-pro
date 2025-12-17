'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function LoginPage() {
    const router = useRouter();
    const [isLoadingEmailPassword, setIsLoadingEmailPassword] = useState(false);
    const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                // Message générique pour ne pas révéler si l'email existe
                toast.error('Email ou mot de passe incorrect');
                return;
            }

            toast.success('Connexion réussie !');
            router.push('/dashboard');
            router.refresh();
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
            const { error } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
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
                    S'inscrire
                </Link>
            </div>
        </div>
    );
}

