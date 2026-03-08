/**
 * API Route — Templates Email
 * GET    /api/admin/email-templates/[key]  → Lire un template (admin + super-admin)
 * PATCH  /api/admin/email-templates/[key]  → Modifier un template (super-admin uniquement)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { EmailTemplate, EmailTemplateKey } from '@/types/email-templates';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ key: string }>;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================
// VALIDATION
// ============================================

const VALID_TEMPLATE_KEYS: EmailTemplateKey[] = [
  'reservation_confirmation',
  'reservation_cancellation',
  'reservation_modification',
  'admin_notification',
  'reminder_7d',
  'reminder_2d',
  'reminder_12h',
  // Post-checkin (S144)
  'checkin_thank_you',
  'checkin_loved',
  'checkin_press',
  'checkin_followup_absent',
];

function isValidTemplateKey(key: string): key is EmailTemplateKey {
  return VALID_TEMPLATE_KEYS.includes(key as EmailTemplateKey);
}

const updatePayloadSchema = z.object({
  header_title:          z.string().max(100),
  subject:               z.string().min(1, "L'objet est requis").max(200),
  intro_text:            z.string().max(1000),
  body_text:             z.string().max(2000),
  info_text:             z.string().max(1000),
  salutation:            z.string().max(100),
  cta_text:              z.string().max(100),
  contact_block_title:   z.string().max(100),
  show_contact_block:    z.boolean(),
  show_reservation_code: z.boolean(),
  // Liens optionnels post-checkin (S149)
  show_folder_link:      z.boolean(),
  folder_link_text:      z.string().max(200),
  show_teaser_link:      z.boolean(),
  teaser_link_text:      z.string().max(200),
  show_captation_link:   z.boolean(),
  captation_link_text:   z.string().max(200),
  show_booking_link:     z.boolean(),
  booking_link_text:     z.string().max(200),
});

// ============================================
// HELPER — Récupère le rôle de l'utilisateur courant
// ============================================

async function getCurrentUserRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return { user, role: roleData?.role ?? null };
}

// ============================================
// GET — Lire un template (admin + super-admin)
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EmailTemplate>>> {
  try {
    const { key } = await context.params;

    if (!isValidTemplateKey(key)) {
      return NextResponse.json(
        { success: false, error: `Clé de template invalide : ${key}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'super-admin' && role !== 'admin') {
      logger.warn('[email-templates API] Accès refusé GET', { userId: user.id, role });
      return NextResponse.json({ success: false, error: 'Droits insuffisants' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', key)
      .single();

    if (error) {
      logger.error('[email-templates API] Erreur lecture', { key, error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Template introuvable : ${key}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: data as EmailTemplate });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email-templates API] Exception GET', { message });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// PATCH — Modifier un template (super-admin uniquement)
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EmailTemplate>>> {
  try {
    const { key } = await context.params;

    if (!isValidTemplateKey(key)) {
      return NextResponse.json(
        { success: false, error: `Clé de template invalide : ${key}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'super-admin') {
      logger.warn('[email-templates API] Accès refusé PATCH', { userId: user.id, role });
      return NextResponse.json(
        { success: false, error: 'Réservé au super-admin' },
        { status: 403 }
      );
    }

    // Parser et valider le body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 });
    }

    const validation = updatePayloadSchema.safeParse(body);
    if (!validation.success) {
      // Zod v3+ utilise .issues (pas .errors)
      const firstIssue = validation.error.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Données invalides';
      return NextResponse.json({ success: false, error: message }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .update(validation.data)
      .eq('template_key', key)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('[email-templates API] Erreur mise à jour', { key, error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Template introuvable : ${key}` },
        { status: 404 }
      );
    }

    logger.info('[email-templates API] Template mis à jour', { key, userId: user.id });
    return NextResponse.json({ success: true, data: data as EmailTemplate });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email-templates API] Exception PATCH', { message });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
