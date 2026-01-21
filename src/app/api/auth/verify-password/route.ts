/**
 * API Route - Vérification du mot de passe actuel
 * POST /api/auth/verify-password
 * 
 * Vérifie que le mot de passe fourni correspond au compte de l'utilisateur connecté.
 * Utilise un client Supabase isolé pour éviter d'affecter la session actuelle.
 * 
 * Sécurité :
 * - Rate limiting recommandé (à implémenter)
 * - Requiert une session active
 * - Ne modifie pas la session de l'utilisateur
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface VerifyPasswordRequest {
  password: string;
}

interface VerifyPasswordResponse {
  success: boolean;
  valid?: boolean;
  error?: string;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse<VerifyPasswordResponse>> {
  try {
    // 1. Vérifier que l'utilisateur est authentifié
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.warn('API /auth/verify-password - Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Parser la requête
    const body = await request.json() as VerifyPasswordRequest;

    if (!body.password || typeof body.password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mot de passe requis' },
        { status: 400 }
      );
    }

    // 3. Créer un client Supabase isolé (sans cookies, sans session)
    // Ce client ne modifiera pas la session de l'utilisateur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('API /auth/verify-password - Variables env manquantes');
      return NextResponse.json(
        { success: false, error: 'Configuration serveur incorrecte' },
        { status: 500 }
      );
    }

    // Client isolé sans persistance de session
    const isolatedClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 4. Tenter une connexion avec le mot de passe fourni
    const { error: signInError } = await isolatedClient.auth.signInWithPassword({
      email: user.email!,
      password: body.password,
    });

    if (signInError) {
      // Le mot de passe est incorrect
      logger.info('API /auth/verify-password - Mot de passe incorrect', { 
        userId: user.id,
        // Ne pas logger l'email pour la sécurité
      });
      return NextResponse.json({
        success: true,
        valid: false,
      });
    }

    // Le mot de passe est correct
    logger.info('API /auth/verify-password - Mot de passe vérifié', { userId: user.id });
    
    return NextResponse.json({
      success: true,
      valid: true,
    });

  } catch (error) {
    logger.error('API /auth/verify-password - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
