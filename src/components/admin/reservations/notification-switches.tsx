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
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>

      {/* Switch email */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <Label
            htmlFor="notif-send-email"
            className="text-sm font-normal cursor-pointer"
          >
            Envoyer un email au professionnel
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
        // Pas d'événement Calendar associé — message informatif
        <div className="flex items-center gap-2 text-muted-foreground/70">
          <CalendarX className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-xs italic">
            Aucun événement Google Calendar associé
          </span>
        </div>
      ) : (
        // Événement existant ou création — switch normal
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <Label
              htmlFor="notif-sync-calendar"
              className={`text-sm font-normal ${!value.sendEmail ? 'text-muted-foreground/50' : 'cursor-pointer'}`}
            >
              Synchroniser le calendrier Google
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
