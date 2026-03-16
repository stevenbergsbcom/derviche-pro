/**
 * API Route - Vérification du mot de passe actuel
 * POST /api/auth/verify-password
 *
 * Vérifie que le mot de passe fourni correspond au compte de l'utilisateur connecté.
 * Utilise un client Supabase isolé pour éviter d'affecter la session actuelle.
 *
 * Sécurité :
 * - Rate limiting : 5 req / 15 min par IP (brute-force protection)
 * - Validation Zod du body entrant
 * - Requiert une session active
 * - Ne modifie pas la session de l'utilisateur
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSystem } from '@/lib/services/logs';
import {
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
  getErrorMessage,
} from '@/lib/api';

// ============================================
// VALIDATION
// ============================================

const bodySchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
});

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting (brute-force protection)
    const rl = await checkRateLimit('auth', request);
    if (!rl.success) {
      void logSystem('rate_limit_blocked', 'warning', {
        route: '/api/auth/verify-password',
        identifier: rl.identifier,
        limit: rl.limit,
      });
      return rateLimitResponse(rl) as NextResponse;
    }

    // 1. Vérifier que l'utilisateur est authentifié (tout rôle)
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.warn('API /auth/verify-password - Non authentifié');
      return unauthorizedResponse();
    }

    // 2. Valider le body avec Zod
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse('Corps de requête invalide', 400);
    }

    const parseResult = bodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return errorResponse('Mot de passe requis', 400);
    }

    const { password } = parseResult.data;

    // 3. Créer un client Supabase isolé (sans cookies, sans session)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('API /auth/verify-password - Variables env manquantes');
      return serverErrorResponse('Configuration serveur incorrecte');
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
      password,
    });

    if (signInError) {
      logger.info('API /auth/verify-password - Mot de passe incorrect', { userId: user.id });
      return NextResponse.json({ success: true, valid: false });
    }

    logger.info('API /auth/verify-password - Mot de passe vérifié', { userId: user.id });
    return NextResponse.json({ success: true, valid: true });

  } catch (err) {
    logger.error('API /auth/verify-password - Exception', { error: getErrorMessage(err) });
    return serverErrorResponse('Erreur serveur');
  }
}
