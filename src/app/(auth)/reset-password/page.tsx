'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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

// Schéma de validation avec toutes les règles de mot de passe
const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
            .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
            .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
            .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
            .min(1, 'Mot de passe requis'),
        confirmPassword: z.string().min(1, 'Confirmation du mot de passe requise'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const handleSubmit = async (data: ResetPasswordForm) => {
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                toast.error('Une erreur est survenue lors de la mise à jour du mot de passe');
                return;
            }

            toast.success('Mot de passe mis à jour avec succès');

            // Redirection vers /login après 2 secondes
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('Une erreur est survenue lors de la mise à jour du mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Réinitialiser le mot de passe
                </h2>
                <p className="text-sm text-muted-foreground">
                    Entrez votre nouveau mot de passe
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        disabled={isLoading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 10 caractères, avec au moins une majuscule, une minuscule et un chiffre
                                </p>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmation du mot de passe</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
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
                        Réinitialiser le mot de passe
                    </Button>
                </form>
            </Form>
        </div>
    );
}

