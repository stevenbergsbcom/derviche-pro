/**
 * Dialog d'authentification embarqué
 * 3 vues : choix → login → register
 * Aucune navigation, l'utilisateur reste sur la page courante
 *
 * @module components/auth/AuthDialog
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import type { AuthSuccessData } from './LoginForm';

// ============================================
// TYPES
// ============================================

type AuthView = 'choice' | 'login' | 'register';

export interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback après connexion ou inscription réussie */
  onSuccess: (data: AuthSuccessData) => void;
  /** Callback si l'utilisateur choisit de continuer sans compte */
  onContinueAsGuest: () => void;
  /** Titre affiché dans la Dialog */
  title?: string;
  /** Description affichée dans la Dialog */
  description?: string;
}

// ============================================
// COMPOSANT
// ============================================

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
  onContinueAsGuest,
  title = 'Accéder à votre compte',
  description = 'Connectez-vous ou créez un compte pour gérer vos réservations facilement.',
}: AuthDialogProps) {
  const [view, setView] = useState<AuthView>('choice');

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Réinitialiser la vue à la fermeture
      setView('choice');
    }
    onOpenChange(newOpen);
  };

  const handleSuccess = (data: AuthSuccessData) => {
    setView('choice');
    onSuccess(data);
  };

  const handleGuest = () => {
    setView('choice');
    onOpenChange(false);
    onContinueAsGuest();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        {/* En-tête avec bouton retour si nécessaire */}
        {view !== 'choice' && (
          <button
            onClick={() => setView('choice')}
            className="absolute left-4 top-4 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            aria-label="Retour"
          >
            <ArrowLeft className="size-4" />
            Retour
          </button>
        )}

        <DialogHeader className={view !== 'choice' ? 'mt-6' : ''}>
          <DialogTitle>
            {view === 'choice' && title}
            {view === 'login' && 'Connexion'}
            {view === 'register' && 'Créer un compte'}
          </DialogTitle>
          {view === 'choice' && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Vue : choix */}
        {view === 'choice' && (
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full gap-2"
              onClick={() => setView('login')}
            >
              <LogIn className="size-4" />
              Se connecter
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setView('register')}
            >
              <UserPlus className="size-4" />
              Créer un compte
            </Button>
            <button
              onClick={handleGuest}
              className="text-sm text-muted-foreground hover:text-foreground text-center mt-1 underline"
            >
              Continuer sans compte
            </button>
          </div>
        )}

        {/* Vue : connexion */}
        {view === 'login' && (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setView('register')}
            onContinueAsGuest={handleGuest}
          />
        )}

        {/* Vue : inscription */}
        {view === 'register' && (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setView('login')}
            onContinueAsGuest={handleGuest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
