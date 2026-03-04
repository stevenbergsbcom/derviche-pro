# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 136 (final validé en prod) — 4 mars 2026

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
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels, Templates (7), RGPD |

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
- **GitHub Actions** : `cron-daily.yml` (J-7+J-2) + `cron-hourly.yml` (H-12) — contournement limite Hobby Vercel
- **Anti-doublon** : `sent_notifications` avec contrainte unique `(reservation_id, type)`
- **Anti race condition** : pattern optimistic lock — `tryClaimReminder()` avant envoi
- **Toggles** : lus via service role Supabase (bypass RLS — pas de session en contexte cron)
- **Sécurité** : `CRON_SECRET` dans GitHub Secrets + exclu du middleware Next.js
- **Middleware** : `api/cron` exclu du matcher → plus de redirection 307 vers `/login`

---

## Dernier travail (Session 136 — 4 mars 2026)

### Fichiers clés créés/modifiés

| Fichier | Modification |
|---------|-------------|
| `migration 055` | 3 templates rappels en DB |
| `migration 056` | 3 toggles `reminder_enabled_*` dans `app_settings` |
| `reminders/types.ts` | Types + configs DAILY/HOURLY |
| `reminders/queries.ts` | `tryClaimReminder` + `updateReminderMessageId` + `releaseReminderClaim` + `logReminderSent` @deprecated |
| `reminders/send.ts` | Flux : claim → template → HTML → Resend → update/release |
| `reminders/process.ts` | `readToggleServerSide()` service role + boucle `for` indexée |
| `builders/reminder-7d/2d/12h.ts` | Builders HTML thématiques |
| `api/cron/reminders/daily/route.ts` | Route GET sécurisée J-7+J-2 |
| `api/cron/reminders/hourly/route.ts` | Route GET sécurisée H-12 |
| `.github/workflows/cron-daily.yml` | GitHub Actions — 7h UTC |
| `.github/workflows/cron-hourly.yml` | GitHub Actions — toutes les heures |
| `vercel.json` | `{}` — crons supprimés (limite Hobby) |
| `middleware.ts` | `api/cron` ajouté aux exclusions du matcher |
| `preview/route.ts` | +3 builders reminder + mock + default exhaustif |
| `[key]/route.ts` | `VALID_TEMPLATE_KEYS` étendu (+3 reminder) |
| `templates-section.tsx` | 2 groupes visuels, 7 templates |
| `preferences-tabs.tsx` | Onglet Rappels avec `CalendarClock` |
| `fallbacks.ts` | `key: EmailTemplateKey` + Record exhaustif |

### Points techniques notables S136
- **Optimistic lock** : `tryClaimReminder()` insère `pending` avant envoi — contrainte unique DB arbitre. `releaseReminderClaim()` libère si échec (retry au prochain cron).
- **GitHub Actions vs Vercel Cron** : plan Hobby Vercel limité à 1 cron/jour max.
- **Middleware matcher** : exclure `api/cron` évite la redirection 307 vers `/login` (pas de session en contexte cron).
- **Toggles service role** : `readToggleServerSide()` dans `process.ts` — `getAppSetting()` utilise le client anon, incompatible avec le contexte cron (RLS bloque).
- `logReminderSent` marqué `@deprecated` — suppression en S137.

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S137** | Système notifications admin (badge lu/non-lu) | 🟡 Moyenne |
| **S138** | RGPD suppression compte (`supabase.auth.admin.deleteUser`) | 🟡 Basse |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `logReminderSent` deprecated | `reminders/queries.ts` | Remplacé par `tryClaimReminder` + `updateReminderMessageId` — à supprimer en S137 | 🟠 S137 |
| Timezone crons | `reminders/queries.ts` | UTC naïf — stocker en `timestamptz` si précision accrue | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` absents du footer et des emails | 🟡 Basse |
| RGPD purge auto | — | Durées stockées, aucune purge automatique | 🟡 S138 |
| Footer admin codé en dur | `builders/admin-notification.ts` | N'utilise pas `buildFooterRow` | 🟡 Basse |
| Zod query params | `preview/route.ts` | Pas de validation Zod (admin only, risque faible) | 🟡 Basse |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement |
| `lib/utils/export-professionals.ts` | CSV uniquement — xlsx/exceljs exclus (vulnérabilités) |
| `buildCtaBlock` | `href` contrôlé côté serveur — ne jamais passer une URL utilisateur |
| `api/cron/*/route.ts` | En dev sans `CRON_SECRET` : routes accessibles librement (warning loggé) |
| `middleware.ts` | `api/cron` exclu du matcher — authentification par `CRON_SECRET` uniquement |

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
