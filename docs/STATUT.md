# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 142 — Harmonisation UX PWA mobile + corrections post-audit, mergé main — 6 mars 2026

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
- **S140** : ReservationFAB — bouton flottant gold, création de réservation depuis n'importe quelle page /accueil
- **S140** : SearchStep — recherche email OU nom avec pré-remplissage formulaire
- **S140** : SelectSlotStep — sélection show + créneau si pas de contexte URL
- **S140** : AddReservationDrawer enrichi — 3 étapes (select-slot → search → form)
- **S140** : NotificationSwitches intégrés (email + calendar) dans le drawer
- **S141** : CancelConfirmDialog — fix `DrawerHeaderProps` mort, aria-labels, `p_country` dans updateReservation
- **S141** : Fix UX mobile clavier — `visualViewport` hook + `scrollIntoView` sur focus input
- **S142** : Harmonisation UX mobile — `GuestInfoSection` h-12/text-base/space-y-2/champs empilés + **champ Pays**
- **S142** : `NotesSection` — textareas rows=3 + text-base
- **S142** : `PlacesSelector` — boutons h-12/w-12, input h-12/text-base
- **S142** : `TransferFooter` — boutons h-12/text-base
- **S142** : `TransferSlotDrawer` — visualViewport (clavier mobile)
- **S142** : `SlotsList` — représentations passées masquées par défaut, révélées via bouton collapsible

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
- Badge cloche dans le header admin (polling 30s), badge rouge avec compteur
- Sheet latéral : liste paginée (20/page), skeleton, état vide, erreur
- Marquage lu individuel, "tout marquer lu", "vider" (soft delete par timestamp)
- 3 types : nouvelle réservation (vert), annulation (rouge), modification (ambre)
- Architecture : 3 tables + dismiss par `dismissed_at` + RLS service role

### ✅ Google Calendar (100%) — S138
- Création / mise à jour / suppression événements Calendar
- Auth OAuth2 refresh token (`reservation.derviche@gmail.com`)
- Service `src/lib/services/google-calendar/` (4 modules)
- `google_calendar_event_id` stocké dans `reservations`

### ✅ Switches email/calendar PWA & Admin (100%) — S139
- Composant partagé `NotificationSwitches` (admin + PWA)
- Switch Calendar conditionnel : masqué si aucun événement Calendar associé
- Modale de confirmation avant annulation PWA (`CancelConfirmDialog`)
- Fix sécurité : externe limité à ses spectacles assignés (`hosted_by_id`)

### ✅ Walk-in FAB + SearchStep enrichi (100%) — S140
- **ReservationFAB** : bouton flottant gold visible partout dans `/accueil`, contextuel selon URL
- **SearchStep** : recherche email (exact) OU nom (ILIKE échappé), AbortController anti-race
- **SelectSlotStep** : sélection show + créneau si pas de `slotId` dans l'URL, cleanup demontage
- **AddReservationDrawer** enrichi : `slotId` optionnel, 3 étapes, indicateur `aria-current="step"`
- **NotificationSwitches** intégrés : email + calendar, envoi non-bloquant après création
- **Migration 064** : fix sécurité RPC externe — `hosted_by_id` (cohérent migration 040)
- **Nettoyage** : dead code `walkin-reservation/route.ts` supprimé, bouton "Ajouter" retiré de `ActionBar`

---

## Dernier travail (Session 142 — 6 mars 2026)

### Contexte
Suite de la S141 (corrections post-audit + fix UX mobile clavier). Harmonisation UX complète des composants PWA checkin-drawer + transfer-slot-drawer pour uniformiser l'expérience mobile.

### Corrections S141 (appliquées avant S142)
- `DrawerHeaderProps` mort supprimé de `types.ts`
- `aria-label` sur boutons Annuler/Créer du dialog admin
- `p_country` ajouté dans `updateReservation` mutations
- Migration 065 (renommage 062) + Migration 066 (`update_reservation_safe` avec `p_country`)
- Fix UX mobile : `autoFocus` supprimé sur SearchStep, `visualViewport` hook sur checkin-drawer
- `scrollIntoView` sur focus input SearchStep (délai 350ms)

### Fichiers clés modifiés S142

| Fichier | Modification |
|---------|-------------|
| `checkin-drawer/sections/GuestInfoSection.tsx` | Refonte complète UX mobile : h-12/text-base, champs empilés, space-y-2, icônes w-4, + **champ Pays** |
| `checkin-drawer/types.ts` | + `country` dans `GuestFormState`, + `setGuestCountry` dans `UseCheckinDrawerReturn` |
| `checkin-drawer/hooks/useGuestForm.ts` | + état `country` + setter `setGuestCountry` |
| `checkin-drawer/useCheckinDrawer.ts` | + exposition `setGuestCountry` |
| `checkin-drawer/helpers/mappers.ts` | + `guestCountry` dans tous les payloads, comparaisons, résultats |
| `checkin-drawer/index.tsx` | + prop `onCountryChange` passé à `GuestInfoSection` |
| `accueil/ReservationRow.tsx` | + `guestCountry` dans `ReservationRowData` |
| `checkin/types.ts` | + `guestCountry` dans `CheckinReservation`, `UpdateCheckinParams`, `UpdateGuestInfoParams` |
| `checkin/reservations.ts` | + `guest_country` dans SELECT, UPDATE et transformers |
| `checkin/cancel.ts` | + `guest_country` dans SELECT et transformers (cancel + reactivate) |
| `checkin/transfer.ts` | + `guest_country` dans SELECT et transformer |
| `checkin-drawer/sections/NotesSection.tsx` | rows 2→3, + `text-base` sur les 3 textareas |
| `transfer-slot-drawer/components/PlacesSelector.tsx` | Boutons h-12/w-12, input h-12/text-base, suppression `size="icon"` |
| `transfer-slot-drawer/components/TransferFooter.tsx` | Boutons h-12/text-base |
| `transfer-slot-drawer/components/SlotsList.tsx` | Séparation slots à venir / passés, bouton collapsible pour les passés |
| `transfer-slot-drawer/index.tsx` | + `visualViewport` hook (clavier mobile), `dvh` fallback |

### Migrations appliquées en prod S141
- `065_add_country_to_admin_reservation_rpc.sql` (renommage 062)
- `066_add_country_to_update_reservation_safe.sql`

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S143** | Emails post-checkin : boutons email dans CheckinDrawer après sélection statut de présence + nouveaux templates (présent, absent, coup de cœur, presse) | 🔴 Haute |
| **S144** | RGPD — suppression de compte (`supabase.auth.admin.deleteUser`) | 🟡 Moyenne |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau | 🟡 Basse |
| Migrations 059/060 obsolètes | `supabase/migrations/` | Appliquées en base mais plus utilisées (remplacées par 061) | 🟡 Basse |
| Timezone crons | `reminders/queries.ts` | UTC naïf | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` absents du footer et emails | 🟡 Basse |
| RGPD purge auto | — | Durées stockées, aucune purge automatique | 🟡 S144 |

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
| `add-reservation-drawer` | `slotId` optionnel → 3 étapes si absent, 2 étapes si présent dans URL |
| `ReservationFAB` | `parseSlotIdFromPath` : UUID regex sur `window.location.pathname` |
| `visualViewport` PWA | Implémenté sur checkin-drawer (S141) + transfer-slot-drawer (S142) |
| `guestCountry` PWA | Champ pays propagé sur toute la chaîne checkin (14 fichiers) — pas de migration BDD (colonne existante) |

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
| 064 | `064_fix_walkin_rpc_externe_access.sql` | Fix sécurité : externe → `hosted_by_id` (cohérent migration 040) | ✅ |
| 065 | `065_add_country_to_admin_reservation_rpc.sql` | RPC `get_admin_reservations` avec `guest_country` | ✅ |
| 066 | `066_add_country_to_update_reservation_safe.sql` | RPC `update_reservation_safe` avec `p_country` | ✅ |
