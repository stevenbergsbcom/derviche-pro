/**
 * API Route — Templates Email
 * GET    /api/admin/email-templates/[key]  → Lire un template (admin + super-admin)
 * PATCH  /api/admin/email-templates/[key]  → Modifier un template (super-admin uniquement)
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { EmailTemplate, EmailTemplateKey } from '@/types/email-templates';
import {
  requireAuth,
  errorResponse,
  notFoundResponse,
  successResponse,
  serverErrorResponse,
  getErrorMessage,
} from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ key: string }>;
}

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
  'reminder_4h',
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
  // Dossier photo (S170)
  show_photo_folder_link: z.boolean(),
  photo_folder_link_text: z.string().max(200),
  // CTA dervichediffusion.com — toggle + libellé custom (post-checkin, migration 112)
  show_derviche_site_link: z.boolean(),
  derviche_site_link_text: z.string().max(200),
  // Bloc « Gérer ma réservation » (compte pro / guest)
  show_manage_reservation_link: z.boolean(),
  manage_reservation_link_text: z.string().max(200),
  guest_contact_message: z.string().max(500),
});

// ============================================
// GET — Lire un template (admin + super-admin)
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { key } = await context.params;

    if (!isValidTemplateKey(key)) {
      return errorResponse(`Clé de template invalide : ${key}`, 400);
    }

    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, '[email-templates API]');
    if (!auth.ok) return auth.response;

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', key)
      .single();

    if (error) {
      logger.error('[email-templates API] Erreur lecture', { key, error: error.message });
      return errorResponse(error.message, 500);
    }

    if (!data) {
      return notFoundResponse(`Template introuvable : ${key}`);
    }

    return successResponse(data as EmailTemplate);
  } catch (err) {
    const message = getErrorMessage(err);
    logger.error('[email-templates API] Exception GET', { message });
    return serverErrorResponse();
  }
}

// ============================================
// PATCH — Modifier un template (super-admin uniquement)
// ============================================

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { key } = await context.params;

    if (!isValidTemplateKey(key)) {
      return errorResponse(`Clé de template invalide : ${key}`, 400);
    }

    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['super-admin'], '[email-templates API]');
    if (!auth.ok) return auth.response;

    // Parser et valider le body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Body JSON invalide', 400);
    }

    const validation = updatePayloadSchema.safeParse(body);
    if (!validation.success) {
      // Zod v3+ utilise .issues (pas .errors)
      const firstIssue = validation.error.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Données invalides';
      return errorResponse(message, 422);
    }

    const { data, error } = await supabase
      .from('email_templates')
      .update(validation.data)
      .eq('template_key', key)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('[email-templates API] Erreur mise à jour', { key, error: error.message });
      return errorResponse(error.message, 500);
    }

    if (!data) {
      return notFoundResponse(`Template introuvable : ${key}`);
    }

    logger.info('[email-templates API] Template mis à jour', { key, userId: auth.userId });
    return successResponse(data as EmailTemplate);
  } catch (err) {
    const message = getErrorMessage(err);
    logger.error('[email-templates API] Exception PATCH', { message });
    return serverErrorResponse();
  }
}
