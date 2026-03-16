/**
 * PageStates — Ecrans de chargement, erreur et 404
 * Derviche Diffusion - Page spectacle
 *
 * Composants d'etats intermediaires affiches avant le contenu principal.
 */

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

// ============================================
// CHARGEMENT INITIAL (HYDRATATION)
// ============================================

/** Ecran vide affiche avant le montage client */
export function MountingState() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
      <Footer />
    </div>
  );
}

// ============================================
// CHARGEMENT DES DONNEES
// ============================================

/** Ecran de chargement avec spinner */
export function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement du spectacle...</p>
      </div>
      <Footer />
    </div>
  );
}

// ============================================
// ERREUR
// ============================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

/** Ecran d'erreur avec bouton de relance */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">Erreur : {error}</p>
        <Button onClick={onRetry} variant="outline">
          Réessayer
        </Button>
      </div>
      <Footer />
    </div>
  );
}

// ============================================
// 404 — SPECTACLE NON TROUVE
// ============================================

/** Ecran 404 quand le spectacle n'existe pas */
export function NotFoundState() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-derviche-dark mb-4">Spectacle non trouvé</h1>
        <p className="text-muted-foreground mb-6">
          Ce spectacle n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button asChild>
          <Link href="/catalogue">Retour au catalogue</Link>
        </Button>
      </div>
      <Footer />
    </div>
  );
}
