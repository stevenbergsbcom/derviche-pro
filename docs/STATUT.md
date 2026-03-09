# Statut du projet - Derviche Pro

> Dernière mise à jour : Session S150 — Système de logs super-admin (app_logs, monitoring, widget quota Resend, purge cron), mergé main — 9 mars 2026

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
- `SUPER_ADMIN_ONLY_ROUTES` : `/admin/preferences` + `/admin/systeme` — accès super-admin uniquement (S150)
- Vérification mot de passe (API)

### ✅ Public - Catalogue & Réservation (100%)
- Liste des spectacles (public)
- Détail spectacle par slug
- Formulaire réservation (guest ou connecté)
- Confirmation de réservation

### ✅ Check-in PWA (100%)
- Flux : spectacles → créneaux → liste réservations
- Recherche, check-in, annulation, transfert
- **S139** : Switches email/calendar sur annulation + transfert
- **S139** : Modale de confirmation avant annulation PWA (`CancelConfirmDialog`)
- **S140** : ReservationFAB — bouton flottant gold, création walk-in depuis /accueil
- **S140** : SearchStep — recherche email (exact) OU nom (ILIKE échappé), AbortController
- **S140** : SelectSlotStep — sélection show + créneau si pas de contexte URL
- **S140** : AddReservationDrawer enrichi — 3 étapes (select-slot → search → form)
- **S140** : NotificationSwitches intégrés (email + calendar) dans le drawer
- **S141** : CancelConfirmDialog — fix DrawerHeaderProps, aria-labels, p_country
- **S141** : Fix UX mobile clavier — visualViewport hook + scrollIntoView sur focus input
- **S142** : Harmonisation UX mobile — GuestInfoSection h-12/text-base/champs empilés + Pays
- **S142** : NotesSection — textareas rows=3 + text-base
- **S142** : PlacesSelector — boutons h-12/w-12, input h-12/text-base
- **S142** : TransferFooter — boutons h-12/text-base
- **S142** : TransferSlotDrawer — visualViewport (clavier mobile)
- **S142** : SlotsList — représentations passées masquées par défaut, collapsible
- **S143** : Annulations masquées par défaut dans la liste PWA, bouton collapsible
- **S143** : Recherche globale (GlobalSearchSheet + useGlobalSearch + search.ts)
- **S143-bis** : Harmonisation labels commentaires/notes (Notes accueil, Notes internes Derviche, Demandes spéciales)
- **S143-bis** : Sécurité notes internes — `isStaffDD` (role !== 'company') → absent du DOM pour les compagnies
- **S144** : Emails post-checkin — CheckinEmailsSection dans CheckinDrawer (statuts présent, absent, coup de cœur, presse)
- **S144** : 4 templates post-checkin en BDD (`checkin_thank_you`, `checkin_loved`, `checkin_press`, `checkin_followup_absent`)
- **S144** : Table `checkin_followup_emails` (tracking envois) + colonne `is_simple_style` sur `email_templates`
- **S145** : Auto-save statut checkin PWA (sans fermer le drawer) + isSavingStatus
- **S146** : UX tableau admin — suppression bouton check-in dédié, patchReservation local
- **S147** : Étape `success` dans AddReservationDrawer (si statut checkin défini) + CheckinEmailsSection
- **S147** : Route `/api/emails/send-checkin-followup` — upsert anti-doublon
- **S147-fix** : Fix check Supabase error sur reset checkin null dans edit-reservation-dialog

### ✅ Admin (100%)
| Module | État |
|--------|------|
| Dashboard | ✅ Stats, liens rapides, résas récentes, créneaux à venir |
| Réservations | ✅ Liste, filtres, pagination, détail, CRUD, check-in, export |
| Spectacles | ✅ Liste, filtres, CRUD, catégories, publics cibles, médias |
| Représentations | ✅ Créneaux par spectacle, CRUD, série de dates, capacité |
| Lieux | ✅ CRUD salles (venues) |
| Compagnies | ✅ CRUD, liaison utilisateur |
| Professionnels | ✅ Liste, filtres, CRUD, colonnes configurables, export CSV |
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels, Templates (11), Google Calendar, RGPD |
| Notifications | ✅ Badge cloche header + Sheet paginé + marquage lu + dismiss — S137 |
| **Système** | ✅ Logs journal (email/calendar/réservation/système) + widget quota Resend — **S150** |

### ✅ Admin — Templates email (100%) — S148-S149
- **11 templates** éditables dans /admin/préférences/Templates (3 groupes : transactionnels, rappels, post accueil)
- Groupe "Emails post accueil" : 4 templates avec bandeau bleu + champs masqués si `is_simple_style`
- **4 liens optionnels** par template post-checkin : dossier, teaser, captation, réservation (switch + texte éditable)
- Bloc de contact harmonisé (même pattern switch+input que les liens optionnels)
- Popover ⓘ sur les badges variables : tableau complet de toutes les variables (shadcn Popover)
- Route API `/api/admin/email-templates/[key]` : whitelist étendue aux 4 clés post-checkin
- `EmailConfig` enrichi : champ `appUrl` dérivé de `catalogueUrl`
- Migration 071 : 8 nouvelles colonnes sur `email_templates`
- **Sécurité** : helper `isSafeUrl()` dans `html-helpers.ts` — filtre les URLs non-http(s) avant insertion dans les `href` (XSS `javascript:`)

### ✅ Admin — Système / Monitoring (100%) — S150
- Page `/admin/systeme` — accès super-admin uniquement
- **Widget quota Resend** : comptage local depuis `app_logs`, barre de progression (vert→orange→rouge), alerte >80%, switch plan free/pro avec quota personnalisé
- **Journal des logs** : tableau paginé (50/page), filtres catégorie/niveau/statut, lignes dépliables avec détails JSONB
- **Route `GET /api/admin/logs`** : protégée super-admin, filtrée, paginée
- **Service `src/lib/services/logs/`** : `logEmail()`, `logCalendar()`, `logSystem()` — tous fire & forget (non-bloquants)
- **Intégration email** : 5 fonctions de `services/email/index.ts` loggent succès + erreur
- **Intégration Calendar** : create/update/delete loggés + notification `calendar_error` admin si échec
- **Purge cron** : route `/api/cron/purge-logs` — supprime les logs > 90 jours, déclenchée par GitHub Actions (cron-daily.yml)
- Entrée "Système" dans sidebar admin (icône `ServerCog`) — visible super-admin uniquement

### ✅ Espace Professionnel (100%)
- /professional/mon-compte : profil perso, pro, adresse, sécurité
- Rapatriement réservations guest (GuestReservationsBanner)
- /professional/reservations : liste + historique
- Changement de créneau en self-service (ProChangeSlotDialog)

### ✅ Company (100%)
- Dashboard, liste/filtres réservations, statistiques, export, mon compte
- Voit : `special_requests`, `checkin_comment`, `checkin_venue_notes`, `cancellation_reason`
- Ne voit jamais : `checkin_internal_notes` (UI + service + RPC)

### ✅ Emails transactionnels (100%)
| Type | Route API | Statut |
|------|-----------|--------|
| Confirmation réservation | POST /api/emails/send-confirmation | ✅ S129 |
| Annulation réservation | POST /api/emails/send-cancellation | ✅ S131 |
| Modification créneau | POST /api/emails/send-modification | ✅ S132 |
| Confirmation par ID (admin/externe) | POST /api/emails/send-confirmation-by-id | ✅ S138 |
| Notifications manager (3 types) | inclus dans les routes ci-dessus | ✅ S131-132 |
| Emails post-checkin | POST /api/emails/send-checkin-followup | ✅ S147 |

### ✅ Templates email dynamiques (100%) — S134-S136 + S144 + S148-S149
- **11 templates en DB** : 4 transactionnels + 3 rappels + 4 post accueil
- UI admin : onglet "Templates" avec 3 groupes visuels
- Preview email : 11 builders supportés
- Service email refactorisé → 8 modules dans `src/lib/services/email/`

### ✅ Rappels automatiques (100%) — S136 — VALIDÉ EN PROD
| Type | Déclencheur | Fenêtre | Couleur | Statut |
|------|-------------|---------|---------|--------|
| J-7 | GitHub Actions 7h UTC | `[J-7 18h, J-6 6h]` | Ambre `#92400e` | ✅ Testé prod |
| J-2 | GitHub Actions 7h UTC | `[J-2 18h, J-1 6h]` | Orange `#c2410c` | ✅ S136 |
| H-12 | GitHub Actions toutes les heures | `[H-11h30, H-12h30]` | Bleu DD `#1e3a5f` | ✅ Testé prod |

### ✅ Notifications admin (100%) — S137
- Badge cloche dans le header admin (polling 30s), badge rouge avec compteur
- Sheet latéral : liste paginée (20/page), skeleton, état vide, erreur
- Marquage lu individuel, "tout marquer lu", "vider" (soft delete par timestamp)
- 4 types : nouvelle réservation (vert), annulation (rouge), modification (ambre), erreur Calendar (orange) — S150

### ✅ Google Calendar (100%) — S138
- Création / mise à jour / suppression événements Calendar
- Auth OAuth2 refresh token (reservation.derviche@gmail.com)
- Service `src/lib/services/google-calendar/` (4 modules)
- Erreurs loggées en `app_logs` + notification admin `calendar_error` — S150

### ✅ Walk-in FAB (100%) — S140
- ReservationFAB : bouton flottant gold visible partout dans /accueil
- SearchStep : recherche email OU nom, AbortController anti-race
- SelectSlotStep : sélection show + créneau si pas de slotId dans URL
- Migration 064 : fix sécurité RPC externe (hosted_by_id)

---

## Dernier travail (S150 — 9 mars 2026)

### S150-A — Infrastructure logs (migrations + service)
- Migration 072 : table `app_logs` — RLS super-admin, indexes optimisés
- Migration 073 : type `calendar_error` dans `admin_notifications.type` + clés `resend_plan`/`resend_monthly_quota` dans `app_settings`
- Service `src/lib/services/logs/` — `types.ts`, `queries.ts`, `index.ts`
- Intégration dans `services/email/index.ts` : 5 fonctions loggent succès + erreur (fire & forget)
- Intégration dans `services/google-calendar/queries.ts` : 3 opérations loggées + notification `calendar_error`
- `src/components/admin/notifications/notification-item.tsx` : type `calendar_error` ajouté

### S150-B — UI monitoring
- Route `GET /api/admin/logs` — super-admin, filtres, pagination 50/page
- Page `/admin/systeme` + composants : `systeme-content.tsx`, `resend-quota-widget.tsx`, `logs-table.tsx`
- Sidebar admin : entrée "Système" (icône `ServerCog`, allowedRoles: ['super-admin'])
- Route `/api/cron/purge-logs` — supprime app_logs > 90 jours
- `cron-daily.yml` : step purge-logs ajouté (continue-on-error: true)
- `src/types/supabase.ts` + `src/types/database.ts` : table `app_logs` déclarée

### S150-audit — Corrections post-audit Cursor (9/10)
- **Critique** : `resend-quota-widget.tsx` — fix JSON double-encodage (`.update({ value: '"free"' })` → `.update({ value: 'free' })`) + helpers `normalizePlan()` / `normalizeQuota()` + erreur de chargement visible
- **Important** : `middleware.ts` — ajout `SUPER_ADMIN_ONLY_ROUTES` (`/admin/preferences`, `/admin/systeme`) + `isSuperAdminOnlyRoute()` ; `/admin/professionnels` ajouté dans `RESTRICTED_ADMIN_ROUTES`

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S151** | RGPD — suppression de compte (`supabase.auth.admin.deleteUser`) | 🟡 Moyenne |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau | 🟡 Basse |
| Migrations 059/060 obsolètes | `supabase/migrations/` | Appliquées en base mais remplacées par 061 | 🟡 Basse |
| Timezone crons | `reminders/queries.ts` | UTC naïf | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` absents du footer et emails | 🟡 Basse |
| RGPD purge auto | — | Durées stockées, aucune purge automatique | 🟡 S151 |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement |
| `src/components/ui/sheet.tsx` | `cursor-pointer` ajouté sur bouton fermeture |
| `lib/utils/export-professionals.ts` | CSV uniquement — xlsx/exceljs exclus (vulnérabilités) |
| `api/cron/*/route.ts` | En dev sans `CRON_SECRET` : routes accessibles librement (warning loggé) |
| `middleware.ts` | `api/cron` exclu du matcher — auth par `CRON_SECRET` uniquement |
| `middleware.ts` | `SUPER_ADMIN_ONLY_ROUTES` : `/admin/preferences` + `/admin/systeme` — super-admin strict |
| `api/admin/notifications/*` | INSERT `admin_notifications` uniquement via service role |
| `app/admin/layout.tsx` | Hook `useNotifications` instancié ici (header) — pas dans la sidebar |
| `src/lib/services/google-calendar/auth.ts` | Redirect URI localhost en dur — utilisé uniquement pour obtenir le refresh token |
| Routes email `externe` | `send-confirmation-by-id`, `send-cancellation`, `send-modification` : check `hosted_by_id` obligatoire |
| `add-reservation-drawer` | `slotId` optionnel → 3 étapes si absent, 2 étapes si présent dans URL |
| `ReservationFAB` | `parseSlotIdFromPath` : UUID regex sur `window.location.pathname` |
| `visualViewport` PWA | Implémenté sur checkin-drawer (S141) + transfer-slot-drawer (S142) |
| `guestCountry` PWA | Champ pays propagé sur toute la chaîne checkin (14 fichiers) |
| `isStaffDD` PWA | `role !== null && role !== 'company'` — calculé dans useCheckinDrawer + useAddReservation |
| `ADMIN_ROLES` checkin | `['super-admin', 'admin', 'externe']` — contrôle lecture/écriture `checkin_internal_notes` |
| Commentaires JSX multi-lignes | Toujours fermer avec `*/}` et non `*/` — erreur TS1005 sinon |
| `checkin_followup_emails` | Upsert avec `onConflict: 'reservation_id,template_key'` — anti-doublon côté API |
| `is_simple_style` | true = fond blanc sobre (templates post-checkin) ; false = header bleu Derviche |
| `app_logs` fire & forget | `void logEmail(...)` / `void logCalendar(...)` : intentionnel — une erreur de log ne bloque jamais l'opération métier |
| `resend_plan` / `resend_monthly_quota` | Valeurs JSONB directes (string/number) — ne pas wrapper avec guillemets supplémentaires |

---

## Migrations Supabase

| # | Fichier | Description | Appliquée prod |
|---|---------|-------------|----------------|
| 001-051 | … | Voir historique sessions précédentes | ✅ |
| 052 | `052_fix_admin_notification_subject.sql` | Correction sujet admin_notification | ✅ |
| 053 | `053_fix_email_catalogue_url.sql` | email_catalogue_url → derviche-pro.fr/catalogue | ✅ |
| 054 | `054_fix_unique_reservation_user_slot.sql` | Partial index — fix bug changement créneau | ✅ |
| 055 | `055_add_reminder_email_templates.sql` | 3 templates rappels en DB | ✅ |
| 056 | `056_add_reminder_app_settings.sql` | 3 toggles `reminder_enabled_*` (défaut : true) | ✅ |
| 057 | `057_create_admin_notifications.sql` | Table `admin_notifications` + index + RLS | ✅ |
| 058 | `058_create_admin_notification_reads.sql` | Table `admin_notification_reads` + RLS | ✅ |
| 059 | `059_add_dismissed_to_notification_reads.sql` | ~~Colonne dismissed~~ — abandonné, remplacé par 061 | ✅ |
| 060 | `060_add_update_policy_notification_reads.sql` | ~~Policy UPDATE reads~~ — abandonné | ✅ |
| 061 | `061_create_admin_notification_dismissals.sql` | Table `admin_notification_dismissals` — architecture finale | ✅ |
| 062 | `062_add_google_calendar_settings.sql` | 3 clés `app_settings` Google Calendar | ✅ |
| 063 | `063_create_walkin_reservation_rpc.sql` | RPC `create_walkin_reservation` (walk-in PWA) | ✅ |
| 064 | `064_fix_walkin_rpc_externe_access.sql` | Fix sécurité : externe → `hosted_by_id` | ✅ |
| 065 | `065_add_country_to_admin_reservation_rpc.sql` | RPC `get_admin_reservations` avec `guest_country` | ✅ |
| 066 | `066_add_country_to_update_reservation_safe.sql` | RPC `update_reservation_safe` avec `p_country` | ✅ |
| 067 | `067_allow_externe_internal_notes.sql` | RPC `create_admin_reservation` : externe peut écrire `checkin_internal_notes` | ✅ |
| 068 | `068_checkin_followup_emails.sql` | Table `checkin_followup_emails` + `is_simple_style` + 4 templates post-checkin | ✅ |
| 069 | `069_add_unique_constraint_checkin_followup_emails.sql` | UNIQUE `(reservation_id, template_key)` + dédoublonnage | ✅ |
| 070 | `070_fix_rls_checkin_followup_emails_insert.sql` | RLS INSERT restreinte aux 4 rôles autorisés | ✅ |
| 071 | `071_add_link_options_to_email_templates.sql` | 8 colonnes liens optionnels sur `email_templates` | ✅ |
| 072 | `072_create_app_logs.sql` | Table `app_logs` — journal système, RLS super-admin, indexes | ✅ |
| 073 | `073_add_calendar_error_and_resend_settings.sql` | Type `calendar_error` dans `admin_notifications` + clés `resend_plan`/`resend_monthly_quota` | ✅ |
