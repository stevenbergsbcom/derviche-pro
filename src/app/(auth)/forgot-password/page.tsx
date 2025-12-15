'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
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

// Schéma de validation
const forgotPasswordSchema = z.object({
    email: z.string().email('Format email invalide').min(1, 'Email requis'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const form = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const handleSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
            });

            if (error) {
                // Message générique pour ne pas révéler si l'email existe
                toast.error('Une erreur est survenue lors de l\'envoi du lien');
                return;
            }

            // Succès : afficher le message de confirmation
            toast.success('Si un compte existe avec cet email, vous recevrez un lien de réinitialisation');
            setIsEmailSent(true);
            form.reset();
        } catch (error) {
            logger.error('[Forgot Password] Erreur envoi email', error as Error);
            toast.error('Une erreur est survenue lors de l\'envoi du lien');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Lien retour */}
            <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="size-4" />
                Retour à la connexion
            </Link>

            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Mot de passe oublié
                </h2>
                <p className="text-sm text-muted-foreground">
                    Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
            </div>

            {isEmailSent ? (
                <div className="rounded-lg border bg-muted/50 p-6 text-center space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">
                            Email envoyé
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
                            Vérifiez votre boîte de réception et vos spams.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsEmailSent(false);
                            form.reset();
                        }}
                        className="w-full"
                    >
                        Envoyer un autre email
                    </Button>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="votre@email.com"
                                            autoComplete="email"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Envoyer le lien de réinitialisation
                        </Button>
                    </form>
                </Form>
            )}

            <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Retour à la connexion
                </Link>
            </div>
        </div>
    );
}

