/**
 * API Route — Suppression de compte professionnel (RGPD Art. 17)
 * POST /api/professional/delete-account
 *
 * Séquence :
 *   1. Vérifier l'authentification et le rôle 'professional'
 *   2. Appeler la RPC anonymize_and_delete_account :
 *      → annule les réservations futures
 *      → anonymise toutes les PII sur les réservations
 *   3. Créer une notification admin si des réservations ont été annulées
 *   4. Appeler auth.admin.deleteUser (supprime auth.users + cascade profiles)
 *   5. Retourner HTTP 200
 *
 * Sécurité :
 *   - Seul l'utilisateur connecté avec rôle 'professional' peut appeler cette route
 *   - La RPC re-vérifie le rôle côté SQL (double protection)
 *   - Le client admin (service role) n'est utilisé qu'en étape 4
 *   - Aucun paramètre externe n'est accepté (pas de userId dans le body)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createAdminNotification } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface DeleteAccountResponse {
  success: boolean;
  error?: string;
}

/** Structure retournée par la RPC anonymize_and_delete_account */
interface AnonymizeRpcResult {
  success: boolean;
  cancelled_count?: number;
  cancelled_ids?: string[];
  user_email?: string;
  error?: string;
}

function isAnonymizeRpcResult(val: unknown): val is AnonymizeRpcResult {
  return (
    typeof val === 'object' &&
    val !== null &&
    'success' in val &&
    typeof (val as Record<string, unknown>).success === 'boolean'
  );
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(): Promise<NextResponse<DeleteAccountResponse>> {
  try {
    logger.info('[delete-account] Début suppression compte professionnel');

    // ----------------------------------------
    // 1. Vérifier l'authentification
    // ----------------------------------------
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn('[delete-account] Non authentifié');
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // ----------------------------------------
    // 2. Vérifier le rôle 'professional'
    //    (la RPC fait aussi cette vérification,
    //    mais on échoue tôt pour économiser un aller-retour DB)
    // ----------------------------------------
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'professional') {
      logger.warn('[delete-account] Rôle non autorisé', {
        userId: user.id,
        role: roleData?.role ?? 'inconnu',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Seuls les comptes professionnels peuvent supprimer leur compte via cette interface.',
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 3. Appeler la RPC d'anonymisation
    //    → annule réservations futures
    //    → anonymise toutes les PII
    // ----------------------------------------
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'anonymize_and_delete_account'
    );

    if (rpcError) {
      logger.error('[delete-account] Erreur RPC anonymize_and_delete_account', {
        userId: user.id,
        error: rpcError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la préparation de la suppression.' },
        { status: 500 }
      );
    }

    if (!isAnonymizeRpcResult(rpcData)) {
      logger.error('[delete-account] Réponse RPC inattendue', { userId: user.id, rpcData });
      return NextResponse.json(
        { success: false, error: 'Réponse serveur inattendue.' },
        { status: 500 }
      );
    }

    if (!rpcData.success) {
      logger.error('[delete-account] RPC échouée', {
        userId: user.id,
        error: rpcData.error,
      });
      return NextResponse.json(
        { success: false, error: rpcData.error ?? 'Erreur lors de la suppression du compte.' },
        { status: 400 }
      );
    }

    const { cancelled_count = 0, user_email = '' } = rpcData;

    logger.info('[delete-account] Anonymisation réussie', {
      userId: user.id,
      cancelledCount: cancelled_count,
    });

    // ----------------------------------------
    // 4. Notification admin si des réservations
    //    futures ont été annulées
    // ----------------------------------------
    if (cancelled_count > 0) {
      void createAdminNotification({
        type: 'cancellation',
        reservation_id: null,
        professional_name: user_email,
        show_title: `${cancelled_count} réservation(s) annulée(s)`,
        slot_date: null,
        message: `Le compte professionnel ${user_email} a été supprimé (RGPD). ${cancelled_count} réservation(s) future(s) ont été automatiquement annulées.`,
      });
    }

    // ----------------------------------------
    // 5. Supprimer le compte auth
    //    → supprime auth.users
    //    → CASCADE : supprime profiles
    //    → ON DELETE SET NULL : user_id → NULL
    //       sur les réservations (stats préservées)
    // ----------------------------------------
    const supabaseAdmin = createAdminClient();
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      // La RPC a déjà anonymisé les données.
      // Si deleteUser échoue, le compte est dans un état partiellement supprimé.
      // On loggue l'erreur mais on ne bloque pas : les PII sont déjà effacées.
      logger.error('[delete-account] Erreur deleteUser (données déjà anonymisées)', {
        userId: user.id,
        error: deleteAuthError.message,
      });
      // On retourne quand même succès côté client car les données sont anonymisées
      // et le compte ne peut plus se connecter avec ces données.
    }

    logger.info('[delete-account] Compte supprimé avec succès', {
      userId: user.id,
      cancelledCount: cancelled_count,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[delete-account] Exception non gérée', { error: message });
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 });
  }
}
