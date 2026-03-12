/**
 * API Route — Vérification manuelle santé token Google Calendar
 * POST /api/admin/google-calendar/health
 *
 * Déclenche une vérification immédiate du token OAuth2.
 * Écrit le résultat dans app_settings et retourne le statut.
 *
 * Sécurité :
 *   - Authentification requise
 *   - Rôle super-admin uniquement (la page /admin/systeme est super-admin)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkGoogleCalendarTokenHealth } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import type { GoogleCalendarHealthResult } from '@/lib/services/google-calendar';

// ============================================
// TYPES
// ============================================

interface ApiSuccess {
  success: true;
  data: GoogleCalendarHealthResult;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse = ApiSuccess | ApiError;

// ============================================
// POST
// ============================================

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Vérification auth + rôle super-admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'super-admin') {
      logger.warn('[google-calendar/health API] Accès refusé', {
        userId: user.id,
        role: roleData?.role,
      });
      return NextResponse.json(
        { success: false, error: 'Accès réservé au super-admin' },
        { status: 403 },
      );
    }

    // 2. Vérification du token
    const result = await checkGoogleCalendarTokenHealth();

    logger.info('[google-calendar/health API] Vérification manuelle', {
      status: result.status,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[google-calendar/health API] Exception non gérée', { message });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
