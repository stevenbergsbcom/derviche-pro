# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 139 (complète + validée build) — 5 mars 2026

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
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
- **S139** : Modale de confirmation avant annulation (avec switches)

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
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels, Templates (7), Google Calendar, RGPD |
| Notifications | ✅ Badge cloche header + Sheet paginé + marquage lu + dismiss — S137 |

### ✅ Espace Professionnel (100%)
- /professional/mon-compte : profil perso, pro, adresse, sécurité
- Rapatriement réservations guest (GuestReservationsBanner)
- /professional/reservations : liste + historique
- Changement de créneau en self-service (ProChangeSlotDialog)

### ✅ Company (100%)
- Dashboard, liste/filtres réservations, statistiques, export, mon compte

### ✅ Emails transactionnels (100%)
| Type | Route API | Statut |
|------|-----------|--------|
| Confirmation réservation | POST /api/emails/send-confirmation | ✅ S129 |
| Annulation réservation | POST /api/emails/send-cancellation | ✅ S131 |
| Modification créneau | POST /api/emails/send-modification | ✅ S132 |
| Confirmation par ID (admin/externe) | POST /api/emails/send-confirmation-by-id | ✅ S138 |
| Notifications manager (3 types) | inclus dans les routes ci-dessus | ✅ S131-132 |

### ✅ Templates email dynamiques (100%) — S134-S136
- **7 templates en DB** : 4 transactionnels + 3 rappels (migrations 051 + 055)
- UI admin : onglet "Templates" avec 2 groupes visuels
- Preview email : 7 builders supportés avec mock dédié rappels
- Service email refactorisé → 8 modules dans `src/lib/services/email/`

### ✅ Rappels automatiques (100%) — S136 — **VALIDÉ EN PROD**
| Type | Déclencheur | Fenêtre | Couleur | Statut |
|------|-------------|---------|---------|--------|
| J-7 | GitHub Actions 7h UTC | `[J-7 18h, J-6 6h]` | Ambre `#92400e` | ✅ **Testé prod** |
| J-2 | GitHub Actions 7h UTC | `[J-2 18h, J-1 6h]` | Orange `#c2410c` | ✅ S136 |
| H-12 | GitHub Actions toutes les heures | `[H-11h30, H-12h30]` | Bleu DD `#1e3a5f` | ✅ **Testé prod** |

**Architecture :**
- **GitHub Actions** : `cron-daily.yml` (J-7+J-2) + `cron-hourly.yml` (H-12)
- **Anti-doublon** : `sent_notifications` avec contrainte unique `(reservation_id, type)`
- **Anti race condition** : pattern optimistic lock — `tryClaimReminder()` avant envoi
- **Sécurité** : `CRON_SECRET` dans GitHub Secrets + exclu du middleware Next.js

### ✅ Notifications admin (100%) — S137

**Fonctionnalités :**
- Badge cloche dans le header admin (polling 30s), badge rouge avec compteur
- Sheet latéral : liste paginée (20/page), skeleton, état vide, erreur
- Marquage lu individuel : chaque admin gère ses propres lectures
- "Tout marquer lu" : upsert batch optimiste
- "Vider" : soft delete individuel par timestamp (dismissed_at)
- Mutations optimistes avec resync badge en cas d'échec
- 3 types : nouvelle réservation (vert), annulation (rouge), modification (ambre)
- Clic notification → fermeture Sheet + navigation vers la réservation (query param)

**Architecture :**
- 3 tables : `admin_notifications` + `admin_notification_reads` + `admin_notification_dismissals`
- **Dismiss par timestamp** : `dismissed_at` = "j'ai vidé à cet instant" → filtre `created_at > dismissed_at`
- RLS : INSERT uniquement service role — SELECT/UPDATE admin + super-admin
- `getDismissedAt()` mutualisé (passé en paramètre à `getAdminUnreadCount` pour éviter double appel DB)
- Notifications créées **uniquement sur actions PRO** (send-confirmation/cancellation/modification)
- Cloche dans `src/app/admin/layout.tsx` (header, pas sidebar)
- Page `/admin/reservations` utilise query param `?reservationId=` (pas segment dynamique)
- Click-through corrigé : `stopPropagation` + `setTimeout(350ms)` avant `router.push`

### ✅ Google Calendar (100%) — S138

**Fonctionnalités :**
- Création automatique d'un événement Calendar à chaque confirmation de réservation
- Mise à jour de l'événement lors d'un changement de créneau
- Suppression de l'événement lors d'une annulation
- Invitation email Google envoyée au professionnel
- Préférences admin : switch principal + 2 switches email (annulation, modification)
- Non-bloquant : une erreur Calendar n'interrompt jamais le flux de réservation

**Architecture :**
- Auth : OAuth2 refresh token (`reservation.derviche@gmail.com`)
- Service : `src/lib/services/google-calendar/` (4 modules : types, auth, queries, index)
- `google_calendar_event_id` stocké dans `reservations` après création
- Migration 062 : 3 clés `app_settings`

### ✅ Switches email/calendar PWA & Admin (100%) — S139

**Fonctionnalités :**
- Switches email ON/OFF et Calendar ON/OFF sur toutes les actions admin et PWA
- Composant partagé `NotificationSwitches` (admin + PWA)
- Switch Calendar conditionnel : masqué si aucun événement Calendar associé
- Modale de confirmation avant annulation PWA (`CancelConfirmDialog`)
- Fermeture modale uniquement en cas de succès (`handleCancel` retourne `boolean`)

**Sécurité :**
- Fix : un `externe` ne peut déclencher emails/Calendar que sur ses spectacles assignés (`hosted_by_id`)
- Fix : suppression du double appel email annulation dans `useAdminReservations`
- Fix : `syncCalendar` manquant dans le fetch transfert de créneau PWA

---

## Dernier travail (Session 139 — 5 mars 2026)

### Fichiers clés créés/modifiés S139

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/reservations/notification-switches.tsx` | Composant partagé switches email + calendar |
| `src/app/admin/reservations/page.tsx` | Switches sur annulation/modification/création + fix `hasCalendarEvent` |
| `src/hooks/useAdminReservations.ts` | Suppression appel email redondant dans `cancel()` |
| `src/components/accueil/transfer-slot-drawer/useTransferSlot.ts` | Ajout `syncCalendar` dans body fetch + switches UI |
| `src/components/accueil/checkin-drawer/sections/CancelConfirmDialog.tsx` | Nouveau — modale confirmation annulation PWA |
| `src/components/accueil/checkin-drawer/sections/FooterSection.tsx` | Suppression switches inline → bouton ouvre modale |
| `src/components/accueil/checkin-drawer/hooks/useCheckinActions.ts` | `handleCancel(notifOptions)` + retourne `boolean` |
| `src/components/accueil/checkin-drawer/useCheckinDrawer.ts` | `cancelDialogOpen` + `handleCancelWithDialog` |
| `src/components/accueil/checkin-drawer/types.ts` | Types mis à jour |
| `src/components/accueil/checkin-drawer/index.tsx` | Branchement `CancelConfirmDialog` |
| `src/app/api/emails/send-confirmation-by-id/route.ts` | Fix sécurité : check `hosted_by_id` pour `externe` |
| `src/app/api/emails/send-cancellation/route.ts` | Fix sécurité : check `hosted_by_id` + `hosted_by_id` dans select |
| `src/app/api/emails/send-modification/route.ts` | Fix sécurité : check `hosted_by_id` + `hosted_by_id` dans select |

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S140** | PWA : création de réservation depuis la PWA check-in | 🔴 Haute |
| **S141** | Emails post-checkin : email différent selon statut de présence (présent, absent, coup de cœur, presse) | 🔴 Haute |
| **S142** | RGPD — suppression de compte (`supabase.auth.admin.deleteUser`) | 🟡 Moyenne |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau | 🟡 Basse |
| Migrations 059/060 obsolètes | `supabase/migrations/` | Appliquées en base mais plus utilisées (remplacées par 061) | 🟡 Basse |
| Timezone crons | `reminders/queries.ts` | UTC naïf | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` absents du footer et emails | 🟡 Basse |
| RGPD purge auto | — | Durées stockées, aucune purge automatique | 🟡 S142 |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement |
| `src/components/ui/sheet.tsx` | `cursor-pointer` ajouté sur bouton fermeture |
| `lib/utils/export-professionals.ts` | CSV uniquement — xlsx/exceljs exclus (vulnérabilités) |
| `api/cron/*/route.ts` | En dev sans `CRON_SECRET` : routes accessibles librement (warning loggé) |
| `middleware.ts` | `api/cron` exclu du matcher — auth par `CRON_SECRET` uniquement |
| `api/admin/notifications/*` | INSERT `admin_notifications` uniquement via service role |
| `app/admin/layout.tsx` | Hook `useNotifications` instancié ici (header) — pas dans la sidebar |
| `src/lib/services/google-calendar/auth.ts` | Redirect URI localhost en dur — utilisé uniquement pour obtenir le refresh token |
| Routes email `externe` | `send-confirmation-by-id`, `send-cancellation`, `send-modification` : check `hosted_by_id` obligatoire |

---

## Migrations Supabase

| # | Fichier | Description |
|---|---------|-------------|
| 001-051 | … | Voir historique sessions précédentes |
| 052 | `052_fix_admin_notification_subject.sql` | Correction sujet admin_notification |
| 053 | `053_fix_email_catalogue_url.sql` | email_catalogue_url → derviche-pro.fr/catalogue |
| 054 | `054_fix_unique_reservation_user_slot.sql` | Partial index — fix bug changement créneau |
| 055 | `055_add_reminder_email_templates.sql` | 3 templates rappels en DB |
| 056 | `056_add_reminder_app_settings.sql` | 3 toggles `reminder_enabled_*` (défaut : true) |
| 057 | `057_create_admin_notifications.sql` | Table `admin_notifications` + index + RLS |
| 058 | `058_create_admin_notification_reads.sql` | Table `admin_notification_reads` + RLS |
| 059 | `059_add_dismissed_to_notification_reads.sql` | ~~Colonne dismissed~~ — abandonné, remplacé par 061 |
| 060 | `060_add_update_policy_notification_reads.sql` | ~~Policy UPDATE reads~~ — abandonné |
| 061 | `061_create_admin_notification_dismissals.sql` | Table `admin_notification_dismissals` — architecture finale |
| 062 | `062_add_google_calendar_settings.sql` | 3 clés `app_settings` Google Calendar |
