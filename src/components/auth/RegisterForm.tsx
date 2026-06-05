/**
 * Formulaire d'inscription réutilisable
 * Peut être embarqué dans n'importe quel Dialog sans navigation
 *
 * @module components/auth/RegisterForm
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
import type { AuthSuccessData } from './LoginForm';

// ============================================
// TYPES
// ============================================

export interface RegisterFormProps {
  /** Callback appelé après inscription réussie */
  onSuccess: (data: AuthSuccessData) => void;
  /** Callback pour basculer vers la connexion */
  onSwitchToLogin?: () => void;
  /** Callback pour continuer sans compte */
  onContinueAsGuest?: () => void;
}

// ============================================
// SCHEMA
// ============================================

// Migration 123 / 124 : structure / code postal / ville sont obligatoires
// à l'inscription pour aligner avec les nouvelles règles de réservation
// (filtrage des inscriptions non-professionnelles).
const registerSchema = z
  .object({
    first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Format email invalide').min(1, 'Email requis'),
    structure: z.string().min(1, 'La structure / organisation est requise'),
    postal_code: z.string().min(1, 'Le code postal est requis'),
    city: z.string().min(1, 'La ville est requise'),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ============================================
// COMPOSANT
// ============================================

export function RegisterForm({ onSuccess, onSwitchToLogin, onContinueAsGuest }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      structure: '',
      postal_code: '',
      city: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
            // Migration 124 : ces 3 champs sont copiés dans `profiles` par
            // le trigger `handle_new_user` via `raw_user_meta_data`.
            structure: values.structure,
            postal_code: values.postal_code,
            city: values.city,
          },
        },
      });

      if (signUpError) {
        setError('Une erreur est survenue lors de la création du compte.');
        logger.error('[RegisterForm] Erreur signUp', { message: signUpError.message });
        return;
      }

      if (!authData.user) {
        setError('Une erreur est survenue. Veuillez réessayer.');
        return;
      }

      logger.info('[RegisterForm] Inscription réussie', { userId: authData.user.id });

      onSuccess({
        firstName: values.first_name,
        lastName: values.last_name,
        email: values.email,
        phone: '',
      });
    } catch (err) {
      logger.error('[RegisterForm] Erreur', err instanceof Error ? err : { message: 'Erreur inconnue' });
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean"
                      autoComplete="given-name"
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
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dupont"
                      autoComplete="family-name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {/* Migration 124 : structure / code postal / ville obligatoires
              à l'inscription pour aligner avec les nouvelles règles de résa
              (filtrage des inscriptions non-professionnelles). */}
          <FormField
            control={form.control}
            name="structure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Structure / Organisation</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Théâtre Municipal"
                    autoComplete="organization"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="75001"
                      autoComplete="postal-code"
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
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paris"
                      autoComplete="address-level2"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Min. 10 caractères, avec majuscule, minuscule et chiffre
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
            Créer mon compte
          </Button>
        </form>
      </Form>

      {(onSwitchToLogin ?? onContinueAsGuest) && (
        <div className="space-y-2 pt-2 border-t">
          {onSwitchToLogin && (
            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Se connecter
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
