/**
 * Utilitaires — Réponses API standardisées
 *
 * Remplace les 100+ instances de :
 *   NextResponse.json({ success: false, error: '...' }, { status: ... })
 *   NextResponse.json({ success: true, data: ... })
 */

import { NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

interface SuccessBody<T = undefined> {
  success: true;
  data?: T;
}

interface ErrorBody {
  success: false;
  error: string;
}

// ============================================
// RÉPONSES D'ERREUR
// ============================================

/** Réponse d'erreur générique avec statut HTTP personnalisable. */
export function errorResponse(message: string, status: number = 400): NextResponse<ErrorBody> {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** 401 — Non authentifié */
export function unauthorizedResponse(
  message = 'Non authentifié'
): NextResponse<ErrorBody> {
  return errorResponse(message, 401);
}

/** 403 — Droits insuffisants */
export function forbiddenResponse(
  message = 'Droits insuffisants'
): NextResponse<ErrorBody> {
  return errorResponse(message, 403);
}

/** 404 — Ressource introuvable */
export function notFoundResponse(
  message = 'Ressource introuvable'
): NextResponse<ErrorBody> {
  return errorResponse(message, 404);
}

/** 500 — Erreur serveur */
export function serverErrorResponse(
  message = 'Erreur serveur'
): NextResponse<ErrorBody> {
  return errorResponse(message, 500);
}

// ============================================
// RÉPONSES DE SUCCÈS
// ============================================

/** 200 — Succès sans données */
export function successResponse(): NextResponse<SuccessBody>;
/** 200 — Succès avec données */
export function successResponse<T>(data: T): NextResponse<SuccessBody<T>>;
export function successResponse<T>(data?: T): NextResponse<SuccessBody<T>> {
  if (data !== undefined) {
    return NextResponse.json({ success: true, data });
  }
  return NextResponse.json({ success: true } as SuccessBody<T>);
}
