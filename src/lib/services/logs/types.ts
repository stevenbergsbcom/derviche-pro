/**
 * Types — Service Logs
 * Derviche Diffusion
 *
 * Typage strict des données insérées dans app_logs.
 */

// ── Catégories ──────────────────────────────────────────────────────────────

export type LogCategory = 'email' | 'calendar' | 'reservation' | 'system';
export type LogLevel    = 'info' | 'warning' | 'error';
export type LogStatus   = 'success' | 'error';

// ── Actions disponibles par catégorie ────────────────────────────────────────

export type EmailAction =
  | 'send_confirmation'
  | 'send_cancellation'
  | 'send_modification'
  | 'send_admin_notification'
  | 'send_checkin_followup'
  | 'send_reminder_j7'
  | 'send_reminder_j2'
  | 'send_reminder_h12';

export type CalendarAction =
  | 'calendar_create'
  | 'calendar_update'
  | 'calendar_delete'
  | 'calendar_health_check';

export type ReservationAction =
  | 'reservation_create'
  | 'reservation_cancel'
  | 'reservation_modify';

export type SystemAction = string; // extensible librement

// ── Payload JSONB details par catégorie ──────────────────────────────────────

export interface EmailLogDetails {
  to?: string;
  resend_id?: string | null;
  template_key?: string;
  error_message?: string;
}

export interface CalendarLogDetails {
  event_id?: string | null;
  reservation_id?: string;
  error_message?: string;
}

export interface ReservationLogDetails {
  error_message?: string;
  context?: Record<string, unknown>;
}

export interface SystemLogDetails {
  message?: string;
  context?: Record<string, unknown>;
}

// ── Paramètre générique d'insertion ──────────────────────────────────────────

export interface InsertLogParams {
  category:        LogCategory;
  level:           LogLevel;
  action:          string;
  status:          LogStatus;
  actor_id?:       string | null;
  actor_role?:     string | null;
  reservation_id?: string | null;
  details?:        Record<string, unknown>;
}
