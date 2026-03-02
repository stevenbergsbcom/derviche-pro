/**
 * API Route - Envoi d'email de confirmation de réservation
 * POST /api/emails/send-confirmation
 *
 * Appelée côté client après une réservation réussie.
 * L'envoi est non-bloquant : un échec email ne fait pas échouer la réservation.
 *
 * Sécurité :
 * - Validation stricte du payload entrant (Zod)
 * - Ne retourne jamais les détails techniques d'erreur Resend au client
 * - La clé API Resend reste côté serveur (variable d'environnement)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendReservationConfirmationEmail } from '@/lib/services/email';
import { logger } from '@/lib/logger';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendConfirmationSchema = z.object({
  to: z.string().email('Email destinataire invalide'),
  guestFullName: z.string().min(1).max(200),
  reservationCode: z.string().min(1).max(20),
  reservationId: z.string().uuid('ID de réservation invalide'),
  showTitle: z.string().min(1).max(300),
  showSlug: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  slotDateFormatted: z.string().min(1).max(100),
  slotTimeFormatted: z.string().min(1).max(20),
  venueName: z.string().min(1).max(200),
  venueCity: z.string().max(100).default(''),
  numPlaces: z.number().int().min(1).max(10),
});

type SendConfirmationPayload = z.infer<typeof sendConfirmationSchema>;

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendConfirmationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn('[API /emails/send-confirmation] Payload invalide', {
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      );
    }

    const payload: SendConfirmationPayload = parseResult.data;

    // 2. Envoyer l'email (non-bloquant pour la réservation)
    const result = await sendReservationConfirmationEmail(payload);

    if (!result.success) {
      // On loggue l'erreur mais on retourne quand même un 200
      // pour ne pas bloquer l'UX côté client
      logger.error('[API /emails/send-confirmation] Échec envoi', {
        reservationId: payload.reservationId,
        error: result.error,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi' },
        { status: 200 } // 200 intentionnel : la réservation est déjà créée
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    logger.error('[API /emails/send-confirmation] Exception', { err });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
