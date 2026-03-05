/**
 * NotificationSwitches — Switches partagés pour les dialogs admin et la PWA check-in
 * Derviche Diffusion - Session 139
 *
 * Affiche 2 switches :
 *   1. « Envoyer un email au professionnel »
 *   2. « Synchroniser le calendrier » (désactivé si email OFF)
 *
 * Règle UX : si sendEmail est OFF, syncCalendar est forcé OFF et le switch est désactivé.
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Calendar, CalendarX } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface NotificationOptions {
  sendEmail: boolean;
  syncCalendar: boolean;
}

export interface NotificationSwitchesProps {
  value: NotificationOptions;
  onChange: (options: NotificationOptions) => void;
  disabled?: boolean;
  /** Titre de la section (optionnel) */
  label?: string;
  /**
   * Indique si un événement Google Calendar existe pour cette réservation.
   * - `undefined` (défaut) : pas de restriction, switch affiché normalement (cas création)
   * - `true`  : événement existant, switch Calendar affiché et fonctionnel
   * - `false` : pas d'événement, switch remplacé par un message informatif
   */
  hasCalendarEvent?: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function NotificationSwitches({
  value,
  onChange,
  disabled = false,
  label = 'Notifications',
  hasCalendarEvent,
}: NotificationSwitchesProps) {
  // Si explicitement false : pas d'événement calendar — forcer syncCalendar OFF
  const noCalendar = hasCalendarEvent === false;
  const handleEmailChange = (checked: boolean) => {
    onChange({
      sendEmail: checked,
      // Si on désactive l'email ou pas d'événement calendar, on désactive le calendrier
      syncCalendar: checked && !noCalendar ? value.syncCalendar : false,
    });
  };

  const handleCalendarChange = (checked: boolean) => {
    onChange({
      ...value,
      syncCalendar: checked,
    });
  };

  return (
    <div className="border-2 rounded-xl p-4 bg-muted/20 space-y-4">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>

      {/* Switch email */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <Label
            htmlFor="notif-send-email"
            className="text-base font-medium cursor-pointer leading-tight"
          >
            Email au professionnel
          </Label>
        </div>
        <Switch
          id="notif-send-email"
          checked={value.sendEmail}
          onCheckedChange={handleEmailChange}
          disabled={disabled}
        />
      </div>

      {/* Switch calendrier — conditionnel selon hasCalendarEvent */}
      {noCalendar ? (
        <div className="flex items-center gap-3 text-muted-foreground/60">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <CalendarX className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm italic">
            Aucun événement Google Calendar associé
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              value.sendEmail
                ? 'bg-green-50 border-green-100'
                : 'bg-muted border-muted'
            }`}>
              <Calendar className={`w-4 h-4 ${
                value.sendEmail ? 'text-green-600' : 'text-muted-foreground/40'
              }`} aria-hidden="true" />
            </div>
            <Label
              htmlFor="notif-sync-calendar"
              className={`text-base font-medium leading-tight ${
                value.sendEmail ? 'cursor-pointer' : 'text-muted-foreground/50'
              }`}
            >
              Google Calendar
            </Label>
          </div>
          <Switch
            id="notif-sync-calendar"
            checked={value.syncCalendar}
            onCheckedChange={handleCalendarChange}
            disabled={disabled || !value.sendEmail}
          />
        </div>
      )}
    </div>
  );
}

// Valeurs par défaut exportées pour initialisation uniforme
export const DEFAULT_NOTIFICATION_OPTIONS: NotificationOptions = {
  sendEmail: true,
  syncCalendar: true,
};
