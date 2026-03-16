/**
 * API Route — Logs Système
 * GET /api/admin/logs
 *
 * Retourne les logs paginés depuis app_logs.
 *
 * Query params :
 *   - category  : 'email' | 'calendar' | 'reservation' | 'system' | 'show' (optionnel)
 *   - level     : 'info' | 'warning' | 'error' (optionnel)
 *   - status    : 'success' | 'error' (optionnel)
 *   - startDate : ISO date string (optionnel)
 *   - endDate   : ISO date string (optionnel)
 *   - page      : numéro de page (défaut : 1)
 *   - limit     : nombre d'items par page (défaut : 50, max : 100)
 *
 * Sécurité :
 *   - Authentification requise
 *   - Rôle super-admin uniquement
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface AppLog {
  id: string;
  category: 'email' | 'calendar' | 'reservation' | 'system' | 'show';
  level: 'info' | 'warning' | 'error';
  action: string;
  status: 'success' | 'error';
  actor_id: string | null;
  actor_role: string | null;
  actor_name: string | null;
  reservation_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface LogsApiResult {
  logs: AppLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiSuccess {
  success: true;
  data: LogsApiResult;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse = ApiSuccess | ApiError;

// ============================================
// CONSTANTES DE VALIDATION
// ============================================

const VALID_CATEGORIES = ['email', 'calendar', 'reservation', 'system', 'show'] as const;
const VALID_LEVELS     = ['info', 'warning', 'error'] as const;
const VALID_STATUSES   = ['success', 'error'] as const;
const DEFAULT_LIMIT    = 50;
const MAX_LIMIT        = 100;

// ============================================
// GET
// ============================================

export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
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
      logger.warn('[logs API] Accès refusé', { userId: user.id, role: roleData?.role });
      return NextResponse.json({ success: false, error: 'Accès réservé au super-admin' }, { status: 403 });
    }

    // 2. Parsing et validation des query params
    const { searchParams } = new URL(request.url);

    const rawPage  = parseInt(searchParams.get('page')  ?? '1',  10);
    const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);

    const page  = isNaN(rawPage)  || rawPage  < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT
                : rawLimit > MAX_LIMIT             ? MAX_LIMIT
                : rawLimit;

    const category  = searchParams.get('category');
    const level     = searchParams.get('level');
    const status    = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    // 3. Requête BDD via client admin (RLS : lecture super-admin uniquement)
    const adminClient = createAdminClient();
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    let query = adminClient
      .from('app_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filtres optionnels — validés avant application
    if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
      query = query.eq('category', category);
    }
    if (level && (VALID_LEVELS as readonly string[]).includes(level)) {
      query = query.eq('level', level);
    }
    if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status);
    }
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) query = query.gte('created_at', d.toISOString());
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) query = query.lte('created_at', d.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('[logs API] Erreur BDD', { error: error.message });
      return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 });
    }

    const total = count ?? 0;
    const rawLogs = (data ?? []) as (Omit<AppLog, 'actor_name'> & { actor_name?: string | null })[];

    // 4. Résolution des noms d'acteurs (batch)
    const actorIds = [...new Set(rawLogs.map(l => l.actor_id).filter(Boolean))] as string[];
    const actorNames: Record<string, string> = {};

    if (actorIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', actorIds);

      for (const p of profiles ?? []) {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
        if (name) actorNames[p.id] = name;
      }
    }

    const logsWithActors: AppLog[] = rawLogs.map(log => ({
      ...log,
      actor_name: log.actor_id ? (actorNames[log.actor_id] ?? null) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs:       logsWithActors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('[logs API] Exception GET', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
