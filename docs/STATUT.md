# Statut du projet - Derviche Pro

> Dernière mise à jour : Session S154 (complète ✅) — Dashboard admin enrichi (graphique, top 3, créneaux 24h, saison configurable) + corrections post-audit (timezone, race condition) — 9 mars 2026

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
| Rate limiting routes manquantes | `rate-limit.ts` | `/api/emails/send-cancellation`, `/api/emails/send-modification`, `/api/emails/send-checkin-followup` non encore protégées | 🟡 Basse |

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

> Aucune migration en S157 ni S158 — modifications purement UI/hooks.
