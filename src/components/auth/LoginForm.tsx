/**
 * Formulaire de connexion réutilisable
 * Peut être embarqué dans n'importe quel Dialog sans navigation
 *
 * @module components/auth/LoginForm
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
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

// ============================================
// TYPES
// ============================================

export interface AuthSuccessData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface LoginFormProps {
  /** Callback appelé après connexion réussie */
  onSuccess: (data: AuthSuccessData) => void;
  /** Callback pour basculer vers l'inscription */
  onSwitchToRegister?: () => void;
  /** Callback pour continuer sans compte */
  onContinueAsGuest?: () => void;
}

// ============================================
// SCHEMA
// ============================================

const loginSchema = z.object({
  email: z.string().email('Format email invalide').min(1, 'Email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================
// COMPOSANT
// ============================================

export function LoginForm({ onSuccess, onSwitchToRegister, onContinueAsGuest }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError || !authData.user) {
        setError('Email ou mot de passe incorrect.');
        return;
      }

      // Vérifier si le compte est désactivé
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, disabled_at, deleted_at')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profile?.deleted_at) {
        await supabase.auth.signOut();
        setError('Ce compte a été supprimé. Vous pouvez créer un nouveau compte.');
        return;
      }

      if (profile?.disabled_at) {
        await supabase.auth.signOut();
        setError('Votre compte a été désactivé. Contactez un administrateur.');
        return;
      }

      logger.info('[LoginForm] Connexion réussie', { userId: authData.user.id });

      onSuccess({
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        email: profile?.email ?? values.email,
        phone: profile?.phone ?? '',
      });
    } catch (err) {
      logger.error('[LoginForm] Erreur', err instanceof Error ? err : { message: 'Erreur inconnue' });
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </Form>

      {(onSwitchToRegister ?? onContinueAsGuest) && (
        <div className="space-y-2 pt-2 border-t">
          {onSwitchToRegister && (
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-primary hover:underline font-medium"
              >
                Créer un compte
              </button>
            </p>
          )}
          {onContinueAsGuest && (
            <p className="text-center">
              <button
                onClick={onContinueAsGuest}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Continuer sans compte
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
