/**
 * Composants pour la gestion des réservations admin
 * Derviche Diffusion
 */

// Helpers et types
export {
  type PeriodPreset,
  type DatePreset,
  type SortOption,
  SORT_OPTIONS,
  COLUMN_HEADERS,
  formatLocalDate,
  getDatePresetRange,
  formatDateFr,
  formatDateTimeFr,
} from './reservation-helpers';

// Badges
export {
  ReservationStatusBadge,
  ReservationCheckinBadge,
} from './reservation-badges';

// Composants
export { SortableHeader } from './sortable-header';
export { RowHoverActions } from './row-hover-actions';
export { ReservationCard } from './reservation-card';
export { renderTableCell } from './table-cell-renderer';

// Dialogs
export { EditReservationDialog } from './edit-reservation-dialog';
export { CreateReservationDialog } from './create-reservation-dialog';

// Notifications
export {
  NotificationSwitches,
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
  type NotificationSwitchesProps,
} from './notification-switches';
