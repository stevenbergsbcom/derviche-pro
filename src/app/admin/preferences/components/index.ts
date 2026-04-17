/**
 * Exports des composants de la page Préférences
 */

export { PreferencesContent } from './preferences-content';
// Ré-exports de compatibilité :
//  - `usePreferencesTab` a migré vers `@/hooks/usePreferencesTab`
//  - `PREFERENCE_TABS` a migré vers `@/app/admin/preferences/config/preference-tabs`
export { usePreferencesTab } from '@/hooks/usePreferencesTab';
export { PREFERENCE_TABS } from '@/app/admin/preferences/config/preference-tabs';

// Sections
export {
  OrganizationSection,
  EmailSection,
  RemindersSection,
  RgpdSection,
  AppearanceSection,
} from './sections';

// Shared
export { SettingsCard } from './shared';
