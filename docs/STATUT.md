# Statut du projet - Derviche Pro

> Dernière mise à jour : Session S173 (✅ mergé main) — QR Code dashboard + Bannière installation PWA — 11 mars 2026

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
- `SUPER_ADMIN_ONLY_ROUTES` : `/admin/preferences` + `/admin/systeme` — accès super-admin uniquement (S150)
- Vérification mot de passe (API) — validation Zod ajoutée S153

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
- **S152** : Section "Historique des réservations" dans CheckinDrawer (staff DD uniquement) — 20 dernières réservations, chargement lazy, reset au changement de pro
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
| Dashboard | ✅ Stats, liens rapides, résas récentes, créneaux à venir, graphique réservations (recharts), top 3 spectacles, créneaux 24h, sélecteur période 7j/30j/Saison |
| Réservations | ✅ Liste, filtres, pagination, détail, CRUD, check-in, export |
| Spectacles | ✅ Liste, filtres, CRUD, catégories, publics cibles, médias |
| Représentations | ✅ Créneaux par spectacle, CRUD, série de dates, capacité |
| Lieux | ✅ CRUD salles (venues) |
| Compagnies | ✅ CRUD, liaison utilisateur |
| Professionnels | ✅ Liste, filtres, CRUD, colonnes configurables, export CSV, lien fiche complète |
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels, Templates (11), Google Calendar, RGPD |
| Notifications | ✅ Badge cloche header + Sheet paginé + marquage lu + dismiss — S137 |
| **Système** | ✅ Logs journal + widget quota Resend + **widget rate limiting — S153** |
| **Utilisateurs** | ✅ CRUD comptes internes + vue assignations spectacles pour externes — S153 |

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

### ✅ Admin — Système / Monitoring (100%) — S150 + S153
- Page `/admin/systeme` — accès super-admin uniquement
- **Widget quota Resend** : comptage local depuis `app_logs`, barre de progression, alerte >80%, switch plan free/pro
- **Widget rate limiting** : tentatives bloquées aujourd'hui + 7 jours, badge "Activité suspecte" si >10, dernière IP masquée, répartition par route — S153
- **Journal des logs** : tableau paginé (50/page), filtres catégorie/niveau/statut, lignes dépliables
- **Route `GET /api/admin/logs`** : protégée super-admin, filtrée, paginée
- **Service `src/lib/services/logs/`** : `logEmail()`, `logCalendar()`, `logSystem()` — tous fire & forget
- **Intégration email** : 5 fonctions de `services/email/index.ts` loggent succès + erreur
- **Intégration Calendar** : create/update/delete loggés + notification `calendar_error` admin si échec
- **Purge cron** : route `/api/cron/purge-logs` — supprime les logs > 90 jours

### ✅ Rate Limiting (100%) — S153
- **`src/lib/rate-limit.ts`** : helper Upstash Redis, 3 limiters sliding window, fail-open, `NextResponse` 429
- `auth` : 5 req / 15 min — `/api/auth/verify-password` + `/api/auth/check-account-status`
- `emails` : 20 req / 1h — `/api/emails/send-confirmation`
- `reservations` : 10 req / 10 min — prêt pour future route résa publique
- Logs des blocages dans `app_logs` (action `rate_limit_blocked`) via `logSystem()`
- Headers `Retry-After`, `X-RateLimit-*` sur toutes les réponses 429
- Variables Upstash configurées en local (`.env.local`) et sur Vercel

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

## Dernier travail (S154 — 9 mars 2026) [MERGÉ MAIN ✅]

### S154-A — Dashboard admin enrichi
- Sélecteur de période : 7 jours / 30 jours / Saison (configurable dans Préférences)
- `ReservationsChart` : graphique area recharts, gradient bleu DD, tooltip personnalisé
- `TopShowsCard` : top 3 spectacles par réservations confirmées, barres de progression relatives, médailles
- `Slots24hCard` : créneaux dans les 24h avec lien direct check-in, badge réservations
- `PeriodSelector` : composant boutons actif/inactif
- Migration 078 : `season_start` / `season_end` dans `app_settings` (défauts 09-01 / 06-30)
- Préférences Organisation : nouveau bloc "Saison du dashboard" (super-admin uniquement)
- `setSeasonSettings` utilise `upsert` (crée les clés si inexistantes)
- Hook `useSeasonSettings` + service `getSeasonSettings` / `setSeasonSettings` dans `app-settings.ts`

### S154-B — Corrections post-audit Cursor (timezone + race condition)
- **Bug timezone** : `toLocalDateISO()` remplace `.toISOString().split('T')[0]` partout
  - `period.ts` : `computePeriodBounds`, `generateDateRange`
  - `admin-dashboard/helpers.ts` : `getTodayISO`, `getWeekStartISO`
  - `checkin/helpers.ts` : `getTodayISO`, `getDateDaysAgo`
  - `slots-24h.ts` : bornes `todayISO` / `tomorrowISO`
- **Race condition PeriodSelector** : suppression du `void refresh()` redondant dans `page.tsx` — `period` dans les deps de `loadDashboard` déclenche le rechargement automatiquement
- **`console.error` → `logger.error`** dans `useAdminDashboard.ts`

---

## Travail précédent (S153 — 9 mars 2026) [MERGÉ MAIN ✅]

### S153-A — Assignations spectacles pour les externes
- Route `GET /api/admin/users/[userId]/assignments` — accès super-admin + admin uniquement
- Retourne `AssignedShow[]` : spectacles assignés via `slots.hosted_by_id`, agrégation JS (slot_count, next_slot_date)
- `UserViewDialog` : section `AssignedShowsSection` avec lazy load, AbortController, badge statut, skeleton
- Visible uniquement si `user.role === 'externe'`

### S153-B — Rate Limiting Upstash Redis
- `src/lib/rate-limit.ts` : helper complet, 3 limiters sliding window, fail-open si Redis absent
- `rateLimitResponse()` retourne `NextResponse` (compatible tous route handlers)
- Appliqué sur : `verify-password`, `check-account-status`, `send-confirmation`
- Chaque blocage loggué dans `app_logs` (action `rate_limit_blocked`) via `void logSystem()`
- Variables `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` dans `.env.local` et Vercel

### S153-C — Widget monitoring rate limiting
- `rate-limit-widget.tsx` : compteurs aujourd'hui + 7 jours, badge statut, dernière IP masquée, répartition par route
- `startOfTodayUTC()` avec `Date.UTC()` — fix bug timezone non-UTC
- Flag `cancelled` dans `useEffect` — pas de setState après unmount
- Intégré dans `systeme-content.tsx` en grid 2 colonnes avec `ResendQuotaWidget`

### S153-audit — Corrections post-audit Cursor
- `verify-password` : validation Zod du body (score 8→9)
- `send-confirmation` : `createAdminNotification` → `void .catch()` non bloquant
- `rate-limit-widget` : `Date.UTC()` pour startOfToday + flag `cancelled` anti-unmount

---

## Travail précédent (S152 — 9 mars 2026) [MERGÉ MAIN ✅]

### S152-A — Page fiche professionnel admin
- Page `/admin/professionnels/[id]` — URL partageable
- En-tête : avatar initiales, nom, statut, stats (réservations, confirmées, présences)
- Colonne gauche : infos profil. Colonne droite : tableau historique complet
- Bouton "Voir la fiche complète" dans `ProfessionalsTable` + `ProfessionalModal`

### S152-B — Route API admin historique
- `GET /api/admin/professionals/[professionalId]/history`

### S152-C — Historique PWA dans CheckinDrawer
- `RecentReservationsSection` : chargement lazy, reset sur changement de `userId`
- Visible uniquement pour `isStaffDD`

### S152-D — Migration 077
- RPCs `get_professional_reservation_history` + `get_professional_recent_reservations`

---

## À faire — Backlog priorisé (mis à jour S153 — 9 mars 2026)

### 🟡 MOYENNE PRIORITÉ — Expérience & dashboards

| # | Session | Fonctionnalité | Détail |
|---|---------|----------------|--------|
| 1 | **S155** | Dashboards par rôle (pro, company, externe) | Professionnel : prochain spectacle + mes réservations. Compagnie : taux remplissage/présence par créneau. Externe-DD : stats filtrées ses spectacles assignés. |
| 2 | **S155** | Exports enrichis | CSV global par période — taux présence par spectacle, par compagnie. Rapport de fin de saison. |
| 3 | **S156** | Filtre "Mes spectacles" catalogue | Pour un pro connecté : badge/filtre pour voir en 1 clic les spectacles déjà vus vs non vus. |
| 4 | **S156** | Magic Link | Connexion sans mot de passe pour les professionnels uniquement (prévu au CDC). |
| 5 | **S157** | Notification push PWA | Pour les rôles staff uniquement (super-admin, admin, externe). Rappel H-2 avant spectacle, nouvelle réservation, annulation. PAS pour les programmateurs. |
| 6 | **S157** | Refacto fichiers trop gros | Par ordre : `EmailTemplateForm.tsx` (27 KB 🚨), `useCompanyReservations.ts` (18 KB), `app-settings.ts` (18 KB), `internal-users.ts` (16 KB), `useAdminReservations.ts` (15 KB). |
| 7 | **S158** | QR Code à la publication | Généré automatiquement vers `/catalogue/[slug]` quand un spectacle passe en `published`. |

### 🟡 MOYENNE PRIORITÉ — CDC V4 non implémenté

| # | Session | Fonctionnalité | Détail |
|---|---------|----------------|--------|
| 8 | **S159** | Champs manquants formulaires | `venues` : capacité, PMR, parking, transports. `shows` : période, responsable Derviche, politique invitation, dates relâche. `companies` : ville, contact. |
| 9 | **S159** | Upload logos compagnies + photos salles | Supabase Storage existe, UI d'upload manque. |
| 10 | ~~S159~~ | ~~Dashboard externe-DD dédié~~ | Intégré dans S155 |

### 🟢 BASSE PRIORITÉ

| # | Fonctionnalité | Détail |
|---|----------------|--------|
| 11 | Vue calendrier compagnie | Représentations chronologiques de leurs spectacles |
| 12 | Impression liste d'émargement | Export PDF de la liste de présence pour accueil sur place |
| 13 | Réorganisation catégories | Drag & drop ou flèches haut/bas (champ `display_order` existe) |
| 14 | Audit logs actions métier | Traçabilité RGPD : qui a modifié quoi |
| 15 | Pages légales | CGU, mentions légales, politique de confidentialité |
| 16 | Champs org dans footer + emails | `contact_email`, `phone`, `address`, `website` dans `app_settings` non consommés |
| 17 | Redirection mobile auto au login | Selon device + rôle (prévu au CDC section 2.6) |
| 18 | Stats compagnie avancées | Profil des programmateurs par fonction et région |

### 🔭 Phase 2 — Post-MVP

| # | Fonctionnalité |
|---|----------------|
| 19 | White-label / Multi-tenant |
| 20 | API publique partenaires |
| 21 | Mode offline check-in PWA |
| 22 | Analytics avancées |

---

---

## S155 — Dashboards Pro + Company [MERGÉ MAIN ✅]

**Fichiers créés**
- `src/lib/services/pro-dashboard.ts` — `getProDashboard()` : prochain créneau, 3 prochaines résas, 3 spectacles non réservés
- `src/hooks/useProDashboard.ts` — hook avec data/isLoading/error/refresh
- `src/app/professional/_dashboard/NextShowCard.tsx` — card hero pleine largeur
- `src/app/professional/_dashboard/UpcomingReservationsCard.tsx` — 3 prochaines résas
- `src/app/professional/_dashboard/DiscoverShowsCard.tsx` — 3 spectacles non réservés
- `src/app/professional/page.tsx` — layout dashboard pro
- `src/lib/services/company-dashboard.ts` enrichi — `checkin_count` ajouté

**Corrections**
- `company-stats-cards.tsx` : taux de remplissage supprimé, grille 3 colonnes
- `company-upcoming-slots.tsx` : barre présents/inscrits
- Sidebar pro : "Tableau de bord" en 1ère position
- Piège shadcn `CardHeader flex-row` → wrapper `div` interne (3 cartes)

---

## S156 — Dashboard externe + corrections console [MERGÉ MAIN ✅]

**Bugs corrigés (4 en cascade)**

1. **Filtre `assignedShowIds`** : pattern `Array.isArray()` dans tous les services admin-dashboard (`top-shows`, `stats`, `slots`, `slots-24h`, `reservations`, `chart`). Convention : `null` = accès complet, `[]` = externe sans assignation → vide, `[ids]` = filtre.
2. **Source de vérité externe** : `useAdminDashboard` lit maintenant `slots.hosted_by_id` (pas `user_show_assignments` obsolète depuis migration 040). Déduplication via `Set`.
3. **RLS migration 079** : policies `externe-dd` non corrigées sur 4 tables — appliquée en prod.
4. **403 console** : `AdminNotificationsWrapper` créé — vérifie le rôle avant de monter `useNotifications`. Zéro 403 pour `externe`, `professional`, `company`.
5. **406 console** (`user_preferences`) : `.single()` → `.maybeSingle()` pour GET ; upsert sans `.select().single()` pour SET.
6. **`checkin_count`** : corrigé pour sommer `num_places` (pas compter les lignes) — une réservation peut couvrir plusieurs personnes.

**Fichiers créés/modifiés**
- `src/components/admin/notifications/admin-notifications-wrapper.tsx` (nouveau)
- `src/app/admin/layout.tsx` (simplifié)
- `src/lib/services/user-preferences.ts` (maybeSingle + upsert fix)
- `src/hooks/useAdminDashboard.ts` (slots.hosted_by_id)
- `src/lib/services/admin-dashboard/*.ts` (6 fichiers — Array.isArray)
- `src/lib/services/company-dashboard.ts` (checkin_count fix)
- `src/app/professional/_dashboard/DiscoverShowsCard.tsx` (CardHeader fix)
- `src/app/professional/_dashboard/UpcomingReservationsCard.tsx` (CardHeader fix)

**Audit S156** : 8,7/10 — zéro bloquant

**Dette identifiée**
- `user_preferences` : `as any` à supprimer après regénération des types Supabase
- `formatDate` dupliqué dans les 3 cartes dashboard pro → à centraliser dans `_dashboard/utils.ts`

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `user_preferences` `as any` | `user-preferences.ts` | À supprimer après regénération types Supabase | 🟡 Basse |
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau | 🟡 Basse |
| Migrations 059/060 obsolètes | `supabase/migrations/` | Appliquées en base mais remplacées par 061 | 🟡 Basse |
| Timezone crons | `reminders/queries.ts` | UTC naïf | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` absents du footer et emails | 🟡 Basse |
| RGPD purge auto | — | Durées stockées, aucune purge automatique planifiée | 🟡 Basse |
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau | 🟡 Basse |

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
| `rate-limit.ts` | Singleton Redis partagé entre invocations serverless — fail-open si Upstash down |
| `startOfTodayUTC()` | Toujours utiliser `Date.UTC()` pour les bornes de requêtes — évite le bug timezone UTC+ |

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
| 074 | `074_add_for_update_to_public_reservation_rpc.sql` | Verrou atomique `FOR UPDATE` + fix `guest_country` + code `CAPACITY_FULL` | ✅ |
| 075 | `075_add_composite_index_reservations_slot_status.sql` | Index composite `(slot_id, status)` partiel + index `slot_confirmed` | ✅ |
| 076 | `076_create_anonymize_and_delete_account_rpc.sql` | RGPD : RPC `anonymize_and_delete_account` | ✅ |
| 077 | `077_create_professional_history_rpcs.sql` | RPCs `get_professional_reservation_history` + `get_professional_recent_reservations` | ✅ |
| 078 | `078_add_season_settings.sql` | `season_start` (09-01) + `season_end` (06-30) dans `app_settings` | ✅ |
| 079 | `079_fix_rls_externe_dd_to_externe.sql` | Fix RLS `externe-dd`→`externe` sur 4 tables manquantes (user_show_assignments, profiles, shows, slots) | ✅ |

| 080 | `080_add_slot_date_to_reservations.sql` | Colonnes `slot_date`/`slot_time` dénormalisées + trigger `sync_reservation_slot_datetime` + backfill + index | ✅ |

---

## S162 — Stats cards + fix tri slot_date ✅ mergé main

### Changements
- `StatsCards` : rechargement automatique quand filtre spectacle change (`useEffect` sur `filters.showId`)
- Badge contextuel `🎭 Stats pour : [titre]` au-dessus des cards
- `stats.total` = confirmées uniquement (hors annulées) — Option A validée
- Card **Places réservées** avec moyenne par réservation (`totalPlaces / total`)
- Taux annulation calculé sur volume réel (`total + cancelled`)
- **BUGFIX** : tri `slot_date_asc/desc` ne fonctionnait jamais (limitation Supabase JS — `.order({ referencedTable })` ne trie pas la table parente)
- **Migration 080** : colonnes `slot_date`/`slot_time` dénormalisées + trigger `sync_reservation_slot_datetime` + backfill + index
- `filters.ts` + `list.ts` : tous les tris de date utilisent `slot_date`/`slot_time` directs

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/app/admin/reservations/components/stats-cards.tsx` | Refonte complète — 4 cards, badge spectacle, logique stats |
| `src/app/admin/reservations/page.tsx` | useEffect filtre spectacle → loadStats, filteredShowTitle |
| `src/lib/services/admin-reservations/stats.ts` | total = confirmées uniquement |
| `src/lib/services/admin-reservations/filters.ts` | Tri slot_date dénormalisé + fix fallback default |
| `src/lib/services/admin-reservations/list.ts` | Export mode : slot_date dénormalisé |
| `supabase/migrations/080_add_slot_date_to_reservations.sql` | Migration appliquée prod |

---

## S163 — Refonte UI filtres réservations admin ✅ mergé main

### Changements
- `SearchAndActions` : filtre Spectacle + bouton **Filtres** (avec badge) sur la ligne principale
- `FiltersSection` : panneau avancé caché par défaut — statut, tri, période, dates, reset
- `advancedFiltersCount` : exclut `showId` et `search` (déjà sur la ligne principale)
- `Math.max(0, ...)` sur badge pour éviter valeur négative
- Fallback `default` dans `filters.ts` corrigé sur colonnes dénormalisées
- Scroll interne tableau supprimé (`overflow-x-auto` uniquement) — un seul scroll de page
- Fix TS : `ShowOption` exporté depuis `search-and-actions`, retiré de `filters-section`

### Structure UI finale page réservations
```
AdminPageHeader
StatsCards (avec badge spectacle si filtre actif)
[🔍 Recherche...] [Spectacle ▼] [Filtres (N)] [|] [↻] [⊞] [Export]  ← ligne principale
┌─ Panneau avancé (caché par défaut) ──────────────────────────────┐
│ [Statut ▼] [Tri ▼] [Période ▼] [Raccourci ▼] [Du] [Au] [Reset]  │
└──────────────────────────────────────────────────────────────────┘
ReservationsContent (tableau sans scroll interne)
PaginationControls
```

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/app/admin/reservations/components/search-and-actions.tsx` | Refonte — spectacle + bouton Filtres |
| `src/app/admin/reservations/components/filters-section.tsx` | Panneau avancé, advancedFiltersCount interne |
| `src/app/admin/reservations/components/reservations-content.tsx` | Suppression max-h-[70vh] → overflow-x-auto |
| `src/app/admin/reservations/components/index.ts` | Export ShowOption depuis search-and-actions |
| `src/app/admin/reservations/page.tsx` | Props mises à jour |

### Points techniques à retenir
- `sticky thead` + `overflow-x-auto` sur même conteneur = **impossible en CSS pur** (crée un stacking context qui casse le sticky)
- Le header de colonnes n'est plus sticky — compromis accepté pour supprimer le double scroll

> Audit Cursor S162+S163 : 9.1/10 global, zéro critique. Fixes post-audit appliqués (fallback tri + Math.max badge).

---

## S164 — Outils de maintenance `/admin/système` ✅ mergé main

### Changements
- RPCs purge notifications + reset data (migration 081)
- Page `/admin/système` : section purge notifications + section reset données
- Route `POST /api/admin/reset-auth-users` (super-admin uniquement)
- **Bugfix** `admin/reservations` : `showIdInitializedRef` + rechargement liste sur changement `filters.showId`

### Fichiers créés/modifiés
| Fichier | Action |
|---------|--------|
| `supabase/migrations/081_maintenance_rpcs.sql` | RPCs purge + reset |
| `src/lib/services/maintenance.ts` | Types + fonctions maintenance |
| `src/app/api/admin/reset-auth-users/route.ts` | Route reset auth users |
| `src/app/admin/systeme/components/notifications-purge-section.tsx` | UI purge |
| `src/app/admin/systeme/components/data-reset-section.tsx` | UI reset data |
| `src/app/admin/systeme/components/systeme-content.tsx` | Orchestrateur |

---

## S165 — Représentations admin : tri + masquage passées ✅ mergé main

### Changements
- `sortDir` state (`'asc'|'desc'`, défaut `'asc'`) dans `useRepresentationsPage`
- `hidePast` state (défaut `true`) — représentations passées masquées par défaut
- `todayStr` : `useState` (pas `useMemo`) — valeur locale, pas UTC
- `pastCount` : compteur de représentations passées masquées (badge)
- Représentations passées : `opacity-50` + `line-through` dans table et cards
- `resetFilters` : remet `hidePast(true)` + `setSortDir('asc')` + autres filtres
- `console.error` → `logger.error` (4 occurrences)
- `todayStr` exposé dans le return du hook (plus de duplication dans `page.tsx`)

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/app/admin/spectacles/[id]/representations/types.ts` | Ajout `sortDir`, `hidePast`, `pastCount`, `todayStr`, `isPast` |
| `src/app/admin/spectacles/[id]/representations/hooks/useRepresentationsPage.ts` | Logique tri + masquage |
| `src/app/admin/spectacles/[id]/representations/components/RepresentationFilters.tsx` | Toggle tri + badge passées |
| `src/app/admin/spectacles/[id]/representations/components/RepresentationTableRow.tsx` | `isPast` → opacité |
| `src/app/admin/spectacles/[id]/representations/components/RepresentationCard.tsx` | `isPast` → opacité |
| `src/app/admin/spectacles/[id]/representations/page.tsx` | `todayStr` depuis hook uniquement |

---

## S166 — Espace Company : alignement admin + fixes audit ✅ mergé main

### Changements
- `search-and-actions.tsx` : Select spectacle + bouton Filtres (badge `advancedFiltersCount`) dans la barre principale
- `filters-section.tsx` : filtre spectacle supprimé (déplacé), toggle mobile supprimé, `if (!filtersExpanded) return null`
- `stats-cards.tsx` : card 1 = confirmées, card 2 = places + moyenne, card 3 = présents + progress bar + emojis, card 4 = annulées + absents
- **Fix bug audit** : taux attrition card 4 = `(cancelled + absent) / (confirmed + cancelled + absent)` (cohérent avec le titre)
- **Fix bug audit** : `handleResetFilters` remet maintenant TOUS les filtres (`showId`, `status`, `checkinStatus`, `dateFrom`, `dateTo`, `search`)
- `company-reservations.ts` : tri `slot_date`/`slot_time` dites sur colonnes dénormalisées (migration 080)
- `reservations-content.tsx` : suppression `max-h-[70vh]` → `overflow-x-auto` uniquement
- `company-upcoming-slots.tsx` : refonte UI — layout titre+badge, date+lieu en ligne, barre présence redesignée
- `company/spectacles/page.tsx` : `pt-0` sur Card (suppression padding top shadcn/ui)

### Points techniques retenus
- `useCompanyReservations.setFilters` recharge automatiquement les réservations (≠ admin) → ne jamais appeler `loadReservations` en plus dans les effets sous peine de boucle infinie
- `advancedFiltersCount = Math.max(0, activeFiltersCount - (showId?1:0) - (appliedSearch?1:0))` — exclut les filtres déjà sur la barre principale
- Supabase JS : `.order({ referencedTable })` ne trie JAMAIS la table parente → toujours utiliser colonnes dénormalisées

### Migrations
| # | Fichier | Description | Appliquée prod |
|---|---------|-------------|---------------|
| 081 | `081_maintenance_rpcs.sql` | RPCs purge notifications + reset data | ✅ |
| 082 | `082_companies_contact_email_nullable.sql` | `DROP NOT NULL` sur `companies.contact_email` | ✅ |

> Audit Cursor S166 : 9.2/10 global, zéro critique. Fixes post-audit appliqués (taux attrition + reset filtres complet).

---

## S168 — Corrections UX & dette technique ✅ mergé main

### S168-A — Harmonisation footer AddReservationDrawer (PWA)
- Footer aligné sur `FooterSection` du `CheckinDrawer` : taille standard shadcn, couleur primaire, label "Fermer"
- Footer fixe hors du scroll via attribut HTML5 natif `form="add-reservation-form"` sur le bouton submit
- Titres des 3 sections `RequiredFieldsSection` uniformisés en `text-base`
- Pattern : `form#add-reservation-form` sur la balise `<form>`, `FormFooter` sorti du `div.overflow-y-auto`

### S168-B — Rate limiting routes email manquantes (dette S153)
- `send-cancellation`, `send-modification`, `send-checkin-followup` : ajout `checkRateLimit('emails', request)`
- Limiter `emails` : 20 req / 1h par IP, fail-open si Redis absent
- Blocages loggués dans `app_logs` (action `rate_limit_blocked`)
- Dette technique STATUT.md soldée

### S168-C — Email contact compagnie optionnel
- Migration 082 : `DROP NOT NULL` sur `companies.contact_email`
- `supabase.ts` + `database.ts` : `contact_email` nullable dans `Row` / `Insert` / `Update`
- `CompanyOption` (spectacles/types.ts) : `contactEmail: string | null`
- `company-quick-create-dialog` : `*` retiré, validation sur nom uniquement, message corrigé
- `company-dialog` + `company-form-dialog` : null guards `?.trim() || null` + `?? ''`
- `useSpectaclesPage` : `data.email.trim() || null` — passe `null` si email vide

### Fichiers modifiés S168
| Fichier | Action |
|---------|--------|
| `src/components/accueil/add-reservation-drawer/sections/FormFooter.tsx` | Footer harmonisé, `form={formId}` |
| `src/components/accueil/add-reservation-drawer/types.ts` | `formId: string` dans `FormFooterProps` |
| `src/components/accueil/add-reservation-drawer/index.tsx` | `form#add-reservation-form`, footer fixe |
| `src/components/accueil/add-reservation-drawer/sections/RequiredFieldsSection.tsx` | `text-base` |
| `src/app/api/emails/send-cancellation/route.ts` | Rate limiting |
| `src/app/api/emails/send-modification/route.ts` | Rate limiting |
| `src/app/api/emails/send-checkin-followup/route.ts` | Rate limiting |
| `src/components/admin/spectacles/company-quick-create-dialog.tsx` | Email optionnel |
| `src/types/database.ts` | `contact_email` nullable |
| `src/types/supabase.ts` | `contact_email` nullable |
| `src/app/admin/spectacles/types.ts` | `CompanyOption.contactEmail` nullable |
| `src/components/admin/compagnies/company-dialog.tsx` | Null guards |
| `src/components/admin/compagnies/company-form-dialog.tsx` | Null guards |
| `src/lib/services/companies.ts` | Suppression contrainte inutile |
| `src/app/admin/spectacles/hooks/useSpectaclesPage.ts` | `|| null` |
| `supabase/migrations/082_companies_contact_email_nullable.sql` | Migration |

### Migrations S168
| # | Fichier | Description | Appliquée prod |
|---|---------|-------------|---------------|
| 082 | `082_companies_contact_email_nullable.sql` | `DROP NOT NULL` sur `companies.contact_email` | ✅ |

> Audit Cursor S168-A : 9.75/10 → 10/10 après fix `cn` inutile. Zéro critique.

---

## S167 — UX Espace Professionnel : corrections mobile ✅ mergé main

### Changements
- **Règle annulation** : suppression cutoff 24h → annulable jusqu'à l'heure exacte de la représentation (décision DD documentée dans JSDoc)
- **Message contextuel** : "Représentation passée" affiché quand `isPast && !canCancel && !canChangeSlot` (mobile + desktop)
- **Badge urgence** : ⏰ "Dans Xh" affiché si représentation dans < 24h (mobile + desktop)
- **Tri réservations** : À venir = `slot_date/slot_time` ASC, Historique = DESC
- **Alignement colonnes desktop** : actions header + card `w-56 justify-end`
- **Mon compte** : suppression `max-w-4xl` (skeleton + return)
- **Sidebar** : suppression doublon "Mon compte" footer + `PROFESSIONAL_ACCOUNT_HREF` (code mort)
- **Label rôle** : "Programmateur" → "Professionnel"
- **Titre header mobile** : dynamique selon la route (`getMobilePageTitle`)
- **Sidebar mobile** : fermeture automatique au clic sur un lien (`useSidebar` + `setOpenMobile`)

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/app/professional/reservations/components/ProReservationCard.tsx` | Règle annulation, isPast, badge urgence, w-56 actions |
| `src/app/professional/reservations/page.tsx` | Tri ASC/DESC, header w-56 |
| `src/lib/services/pro-reservations/index.ts` | Tri slot_date/slot_time dénormalisés |
| `src/app/professional/mon-compte/page.tsx` | Suppression max-w-4xl |
| `src/components/professional/professional-sidebar/index.tsx` | Fermeture mobile + suppression SidebarAccountLink |
| `src/components/professional/professional-sidebar/constants.ts` | Label Professionnel + suppression PROFESSIONAL_ACCOUNT_HREF |
| `src/app/professional/layout.tsx` | Titre header mobile dynamique |

### Migrations
Aucune.

> Audit Cursor S167 : 9.4/10 global → 9.5/10 après fix constants.ts. Zéro critique. Seul point signalé : alerte Cursor sur suppression règle 24h → documentée dans JSDoc.

### Bugfixes post-audit (avant merge final)
- **Bug 1** `pro-reservations/index.ts` : `slot_date`/`slot_time` absentes du SELECT → ajoutées dans `PRO_RESERVATION_SELECT` (tri Supabase nécessite les colonnes dans le SELECT)
- **Bug 2** `ProReservationCard.tsx` : `isPast` basé sur `isCancellable()` qui retourne `false` sur `no_show` quelle que soit la date → nouvelle fonction pure `isSlotPast()` basée sur la date réelle, indépendante du statut

### Points techniques retenus (S167)
- Supabase `.order()` nécessite que les colonnes soient présentes dans le SELECT — même pour les colonnes dénormalisées
- `isPast` ne doit jamais dépendre d'une fonction qui court-circuite sur le statut (`isCancellable`) — toujours calculer depuis la date réelle
- shadcn/ui `useSidebar()` expose `isMobile` + `setOpenMobile` → pattern standard pour fermer la sidebar mobile sur navigation
- `getMobilePageTitle(pathname)` : fonction pure dans le layout, pas de hook nécessaire — re-render naturel au changement de `pathname`

---

## S168 — Corrections UX & dette technique ✅ mergé main

### S168-A — Harmonisation footer AddReservationDrawer (PWA)
- Footer aligné sur `FooterSection` du `CheckinDrawer` : taille standard shadcn, couleur primaire, label "Fermer"
- Footer fixe hors du scroll via attribut HTML5 natif `form="add-reservation-form"` sur le bouton submit
- Titres des 3 sections `RequiredFieldsSection` uniformisés en `text-base`
- Pattern : `form#add-reservation-form` sur `<form>`, `FormFooter` sorti du `div.overflow-y-auto`

### S168-B — Rate limiting routes email manquantes (dette S153)
- `send-cancellation`, `send-modification`, `send-checkin-followup` : ajout `checkRateLimit('emails', request)` (20 req / 1h)

### S168-C — Email contact compagnie optionnel
- Migration 082 : `DROP NOT NULL` sur `companies.contact_email`
- `supabase.ts` + `database.ts` : `contact_email` nullable
- `CompanyOption` : `contactEmail: string | null`
- Dialogs company : null guards `?.trim() || null`

### Migrations S168
| # | Fichier | Description | Prod |
|---|---------|-------------|------|
| 082 | `082_companies_contact_email_nullable.sql` | `DROP NOT NULL` sur `companies.contact_email` | ✅ |

> Audit Cursor S168-A : 9.75/10 → 10/10 après fix `cn` inutile.

---

## S169 — Fix hero image page spectacle public ✅ mergé main

- `src/app/(public)/spectacle/[slug]/page.tsx` : remplacement du texte hardcodé `'Derviche Diffusion'` par `{show.companyName}` sur la carte hero.

---

## S170 — Champ photo_folder_url (dossier photo spectacles) ✅ mergé main

### Décisions
- `photo_folder_url TEXT` nullable sur `shows`
- Formulaire admin (MediaSection), vue admin (MediaResourcesSection), email post-checkin (toggle + texte dans préférences Templates)

### Migrations
| # | Fichier | Description | Prod |
|---|---------|-------------|------|
| 083 | `083_add_photo_folder_url_to_shows.sql` | `photo_folder_url TEXT` nullable | ⏳ **À appliquer** |
| 084 | `084_add_photo_folder_link_to_email_templates.sql` | `show_photo_folder_link BOOL` + `photo_folder_link_text TEXT` | ⏳ **À appliquer** |

### Points techniques
- `isSafeUrl()` de `html-helpers.ts` est une pure function importable dans les composants UI
- `MediaResourcesSection` : toutes les URLs (`folderUrl`, `teaserUrl`, `photoFolderUrl`, `captationUrl`) validées via `isSafeUrl()` avant rendu `href`
- Label "Dossier" → **"Dossier de presse"** pour cohérence avec le formulaire

### Audit S170 : 9.9/10 → 10/10
Unique correction : import `isSafeUrl` dans `MediaResourcesSection` pour protéger tous les `href` (XSS `javascript:`).

### Migrations S170
| # | Fichier | Description | Prod |
|---|---------|-------------|------|
| 083 | `083_add_photo_folder_url_to_shows.sql` | `photo_folder_url TEXT` nullable | ✅ |
| 084 | `084_add_photo_folder_link_to_email_templates.sql` | `show_photo_folder_link BOOL` + `photo_folder_link_text TEXT` | ✅ |

---

## S171 — Connexion domaine derviche-pro.fr ✅ (sans merge Git — infra uniquement)

### Changements
- **DNS o2switch** : A record `derviche-pro.fr` → `216.198.79.1` (Vercel)
- **DNS o2switch** : CNAME `www.derviche-pro.fr` → `822ac9d73fc0889c.vercel-dns-017.com`
- **Supabase Auth** : Site URL mis à jour → `https://derviche-pro.fr` + Redirect URLs complètes
- **Vercel** : `NEXT_PUBLIC_APP_URL=https://derviche-pro.fr` (déjà correct depuis le 2 mars)
- **Code source** : zéro URL `derviche-pro.vercel.app` hardcodée trouvée
- **Migrations 083+084** appliquées en prod — champ "Dossier photo" fonctionnel

### Redirect URLs Supabase actives
- `https://derviche-pro.vercel.app/**` (conservé pour compatibilité)
- `http://localhost:3000/**`
- `http://localhost:3001/**`
- `https://derviche-pro.fr`
- `https://www.derviche-pro.fr`
- `https://derviche-pro.fr/**`
- `https://www.derviche-pro.fr/**`

### Migrations
Aucune (infra uniquement).

### Prochaine session : S172 — à définir

---

## S172 — FAB walk-in pour les compagnies + fix doublon nom compagnie PWA ✅ mergé main

### Objectif
Permettre aux compagnies en charge de l'accueil d'ajouter une réservation walk-in via le FAB sur la PWA `/accueil`.

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/components/accueil/ReservationFAB.tsx` | FAB visible pour `company` + vérification `canAccessSlot` pour slotId pré-rempli |
| `src/components/accueil/add-reservation-drawer/SelectSlotStep.tsx` | Filtre `hostedBy='company'` lors du chargement des créneaux |
| `src/lib/services/admin-reservations/constants.ts` | `hosted_by` ajouté dans `SLOT_SELECT_QUERY` |
| `src/lib/services/admin-reservations/stats.ts` | `getAvailableSlotsForShow` accepte `options?: { hostedBy? }` |
| `src/lib/services/admin-reservations/index.ts` | Export `GetAvailableSlotsOptions` |
| `src/app/accueil/components/HeaderSection.tsx` | Suppression préfixe 'Compagnie' hardcodé (doublon avec nom compagnie) |

### Décisions
- `isVisible` FAB : `super-admin || admin || externe || company`
- Pour `company` + `rawSlotId` dans l'URL : `verifiedSlotId` initialisé à `undefined`, mis à `rawSlotId` uniquement après `canAccessSlot(...) === true` (fix audit)
- `getAvailableSlotsForShow(showId)` sans options = rétrocompatible (admin/externe voient tous les créneaux)
- `NotificationSwitches` (email au pro) reste visible pour les compagnies
- Notes internes Derviche (`isStaffDD`) : déjà masquées pour `company` — aucun changement nécessaire

### Points techniques retenus
- `useState(initialValue)` avec une valeur dépendant d'un état async (`role`) → toujours initialiser à `undefined` et laisser le `useEffect` setter après vérification
- `canAccessSlot` vérifie `hosted_by === 'company'` + même `company_id` côté service ; la RLS reste le garde ultime
- `SLOT_SELECT_QUERY` inclut désormais `hosted_by` (non breaking : `transformAvailableSlots` n'expose que les champs nécessaires)

### Migrations
Aucune.

### Audit S172 : 8.5/10 → 10/10
Point corrigé : `verifiedSlotId` initialisé à `undefined` pour `company` quand `rawSlotId` présent dans l'URL (évite drawer pré-rempli non vérifié). Aucun autre point bloquant.

---

---

## S173 — QR Code dashboard + Bannière installation PWA ✅ mergé main

### Objectif
Ajouter un QR code d'accès rapide à la PWA sur le dashboard admin, et une bannière d'invitation à installer la PWA sur `/accueil`.

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `src/app/admin/_dashboard/components/QrCodeModal.tsx` | Nouveau — Dialog avec QRCodeCanvas, téléchargement PNG, bouton ouvrir PWA |
| `src/app/admin/_dashboard/components/index.ts` | Export QrCodeModal |
| `src/app/admin/page.tsx` | QrCodeModal intégré dans la grille accès rapides |
| `src/app/accueil/components/PwaInstallBanner.tsx` | Nouveau — bannière bleue dismissable |
| `src/app/accueil/components/index.ts` | Export PwaInstallBanner |
| `src/app/accueil/page.tsx` | PwaInstallBanner intégrée sous HeaderSection |

### Décisions techniques
- **QR Code** : `QRCodeCanvas` (qrcode.react déjà en dépendance) avec `ref` pour export PNG via `canvas.toDataURL`. URL = `NEXT_PUBLIC_APP_URL/accueil`
- **Bannière** : visible uniquement si `display-mode` ≠ standalone/fullscreen/minimal-ui ET mobile ET sessionStorage pas dismissé
- **Plateformes** : `ios-safari` (Share + écran d'accueil), `ios-chrome` (bouton copier URL — seul Safari peut installer sur iOS), `android` (menu ⋮ Chrome), `unknown` (instructions génériques)
- **Dismiss** : `sessionStorage.setItem('pwa-banner-dismissed', '1')` → persiste jusqu'à fermeture de l'onglet
- **Clipboard** : `navigator.clipboard.writeText` avec fallback `execCommand('copy')` — retour vérifié avant feedback
- **iOS Chrome** : `CriOS|FxiOS|OPiOS|Mercury` dans le user-agent → détecté comme `ios-chrome`

### Points techniques retenus
- `pwaUrl` initialisé via `useState('')` + `setPwaUrl(window.location.href)` dans `useEffect` → évite tout accès à `window` au SSR
- `execCommand('copy')` retourne un boolean → vérifier avant `setCopied(true)` (sinon feedback faux positif)
- Sur iOS, seul Safari peut installer une PWA — tous les autres navigateurs (Chrome, Firefox, Opera) utilisent WebKit mais ne peuvent pas installer
- Page de debug `/accueil/debug` créée puis supprimée après diagnostic (pattern à retenir : créer via MCP Filesystem, pas bash)

### Migrations
Aucune.

### Audit S173 : 8.5/10 → 10/10 après corrections
Corrections appliquées : sessionStorage persist dismiss (priorité 1), isInstalledAsPwa() étendu fullscreen+minimal-ui (priorité 2), execCommand retour vérifié (suggestion Cursor).

---

### Prochaine session : S174 — à définir

**Candidats backlog (par priorité) :**
| # | Fonctionnalité | Complexité | Valeur |
|---|----------------|-----------|--------|
| 1 | Magic Link | Moyenne | CDC + UX pros |
| 2 | Refacto `EmailTemplateForm.tsx` (27 KB 🚨) | Moyenne | Maintenabilité |
| 3 | Champs manquants formulaires (venues PMR, parking, shows période) | Faible | Données terrain |
| 4 | Upload logos compagnies + photos salles | Moyenne | Richesse UI |
