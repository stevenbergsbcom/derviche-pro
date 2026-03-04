/**
 * Index — Service Rappels Email
 * Derviche Diffusion
 *
 * Barrel exports — point d'entrée unique pour les routes cron.
 */

export { processReminders, processMultipleReminders } from './process';
export { sendReminderEmail } from './send';
export {
  getEligibleReservations,
  tryClaimReminder,
  updateReminderMessageId,
  releaseReminderClaim,
} from './queries';
export type {
  ReminderType,
  ReminderToggleKey,
  ReminderConfig,
  EligibleReservation,
  ReminderEmailData,
  ReminderResult,
  ProcessRemindersResult,
} from './types';
export {
  DAILY_REMINDER_CONFIGS,
  HOURLY_REMINDER_CONFIG,
} from './types';
