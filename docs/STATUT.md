# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 136 — 4 mars 2026

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
- Recherche
- Check-in (présent/absent)
- Annulation
- Transfert

### ✅ Admin (100%)
| Module | État |
|--------|------|
| Dashboard | ✅ Stats, liens rapides, résas récentes, créneaux à venir |
| Réservations | ✅ Liste, filtres, pagination, détail, CRUD, check-in, export |
| Spectacles | ✅ Liste, filtres, CRUD, catégories, publics cibles, médias |
| Représentations | ✅ Créneaux par spectacle, CRUD, série de dates, capacité |
| Lieux | ✅ CRUD salles (venues) |
| Compagnies | ✅ CRUD, liaison utilisateur |
| Professionnels | ✅ Liste, filtres, CRUD, colonnes configurables, export CSV, deep-link réservations, modale UX refonte |
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels ✅ S136, Templates ✅ S136 (+3 rappels), RGPD |

### ✅ Espace Professionnel (100%)
- /professional/mon-compte : profil perso, pro, adresse, sécurité
- Rapatriement réservations guest (GuestReservationsBanner)
- /professional/reservations : liste réservations à venir + historique
- Changement de créneau en self-service (ProChangeSlotDialog)

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations, statistiques, export
- Mon compte

### ✅ Emails transactionnels (100%)
| Type | Route API | Statut |
|------|-----------|--------|
| Confirmation réservation | POST /api/emails/send-confirmation | ✅ S129 |
| Annulation réservation | POST /api/emails/send-cancellation | ✅ S131 |
| Modification créneau | POST /api/emails/send-modification | ✅ S132 |
| Notification manager (nouvelle résa) | inclus dans send-confirmation | ✅ S131 |
| Notification manager (annulation) | inclus dans send-cancellation | ✅ S131 |
| Notification manager (modification) | inclus dans send-modification | ✅ S132 |

### ✅ Templates email dynamiques (100%) — S134A + S134B + S135 + S136
- Table `email_templates` (migration 051) avec **7 templates en DB** (4 transactionnels + 3 rappels)
- Champs éditables : `subject`, `intro_text`, `body_text`, `info_text`, `header_title`, `salutation`, `cta_text`, `contact_block_title`
- Champs booléens : `show_contact_block`, `show_reservation_code`, `is_active`
- Service `email-templates.ts` : `getEmailTemplate()`, `resolveTemplateVariables()`, `textToHtml()`
- **Service email refactorisé → 8 modules** (`src/lib/services/email/`) — score audit 9/10
- **UI admin : onglet "Templates" avec 2 groupes visuels** ✅ S136 — transactionnels + rappels automatiques
- **Preview email : 7 builders supportés** ✅ S136 — reminder_7d/2d/12h avec mock dédié
- **Mise en page emails : margin footer ajouté** ✅ S135

### ✅ Rappels automatiques (100%) — S136
| Type | Cron | Fenêtre | Couleur header | Statut |
|------|------|---------|----------------|--------|
| J-7 | `0 7 * * *` (daily) | `[J-7 18h, J-6 6h]` | Ambre `#92400e` | ✅ S136 |
| J-2 | `0 7 * * *` (daily) | `[J-2 18h, J-1 6h]` | Orange `#c2410c` | ✅ S136 |
| H-12 | `0 * * * *` (hourly) | `[H-11h30, H-12h30]` | Bleu DD `#1e3a5f` | ✅ S136 |

- **Anti-doublon** via table `sent_notifications` (type CHECK existant)
- **Routes cron sécurisées** (`CRON_SECRET` header `Authorization: Bearer`)
- **Vercel Cron Jobs** configurés dans `vercel.json`
- **Toggles admin** : `reminder_enabled_7d/2d/12h` dans `app_settings` (migration 056)
- **Envoi séquentiel** avec délai 600ms anti rate-limit Resend
- **Fallbacks DB** : 3 templates de secours si DB inaccessible

---

## Dernier travail (Session 136 — 4 mars 2026)

### Rappels automatiques J-7 / J-2 / H-12

| Fichier | Modification |
|---------|-------------|
| `migration 055` | 3 templates rappels en DB : `reminder_7d`, `reminder_2d`, `reminder_12h` |
| `migration 056` | 3 toggles dans `app_settings` : `reminder_enabled_7d/2d/12h` = true |
| `types/email-templates.ts` | `EmailTemplateKey` étendu (+3 clés reminder) + labels `EMAIL_TEMPLATE_NAMES` |
| `email/fallbacks.ts` | 3 fallbacks reminder ajoutés |
| `reminders/types.ts` | Types + configs `DAILY_REMINDER_CONFIGS` + `HOURLY_REMINDER_CONFIG` |
| `reminders/queries.ts` | Requête éligibles (anti-doublon, fenêtre temporelle, enrichissement managers batch) |
| `reminders/send.ts` | Envoi unitaire : template DB → builder HTML → Resend → log |
| `reminders/process.ts` | Orchestrateur batch + `processMultipleReminders` |
| `reminders/index.ts` | Barrel exports |
| `builders/reminder-7d.ts` | Builder HTML J-7 (ambre) |
| `builders/reminder-2d.ts` | Builder HTML J-2 (orange) |
| `builders/reminder-12h.ts` | Builder HTML H-12 (bleu DD + or) |
| `api/cron/reminders/daily/route.ts` | Route GET sécurisée — J-7 + J-2 |
| `api/cron/reminders/hourly/route.ts` | Route GET sécurisée — H-12 |
| `vercel.json` | 2 crons configurés (`0 7 * * *` et `0 * * * *`) |
| `.env.local` | `CRON_SECRET` ajouté + doublon `NEXT_PUBLIC_APP_URL` corrigé |
| `preview/route.ts` | +3 builders reminder + mock `MOCK_REMINDER` + `VALID_KEYS` étendu + `default` exhaustif |
| `[key]/route.ts` | `VALID_TEMPLATE_KEYS` étendu (+3 clés reminder) — fix bug 400 |
| `templates-section.tsx` | Refactor : `TemplateAccordionItem` + `TemplateGroupSeparator` + 2 groupes (transactionnels / rappels) |
| `preferences-tabs.tsx` | Onglet Rappels → statut `active` / "Actif" |
| `reminders-section.tsx` | Banner "Non connecté" retiré + import nettoyé |
| `app-settings.ts` | `getReminderSettings()` : fix `parseBool()` cohérent avec `getNotificationSettings()` |

### Points techniques notables S136

- **`enrichWithManagers`** : crée son propre client Supabase (évite conflit de types entre versions `@supabase/supabase-js`)
- **Switch exhaustif** dans `generatePreviewHtml` : `default` avec `never` catch compile-time
- **Timezone** : créneaux comparés en UTC naïf (acceptable pour fenêtres larges J-7/J-2 ; H-12 ±30min)
- **Rate-limit Resend** : délai 600ms entre chaque envoi (plan free = 2 req/s)
- **CRON_SECRET** ajouté sur Vercel Dashboard (Production + Preview)

---

## À faire (prochaines sessions)

### Sessions planifiées

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S137** | Système notifications admin (badge lu/non-lu) | 🟡 Moyenne |
| **S138** | RGPD suppression compte (`supabase.auth.admin.deleteUser`) | 🟡 Basse |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| Zod sur query params | `preview/route.ts` | Pas de validation Zod sur les query params (admin uniquement, risque faible) | 🟡 Basse |
| `organization_logo_url` | DB | Doublon à supprimer (remplacé par onglet Apparence migration 050) | 🟡 Basse |
| Timezone crons | `reminders/queries.ts` | Créneaux comparés en UTC naïf — si besoin précision accrue, stocker en `timestamptz` | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` stockés mais absents du footer public et des emails | 🟡 Basse |
| RGPD | — | Durées de conservation stockées, aucune purge automatique | 🟡 S138 |
| Factorisation builders | `src/lib/services/email/builders/` | Pattern résolution template dupliqué entre builders (acceptable, à factoriser si nouveaux types) | 🟡 Basse |
| Footer admin codé en dur | `builders/admin-notification.ts` | N'utilise pas `buildFooterRow` contrairement aux autres builders | 🟡 Basse |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement (shadcn ne l'inclut pas) |
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `src/lib/services/email/` | `index.ts` re-exporte tous les types de `types.ts` pour compatibilité imports existants |
| `buildCtaBlock` dans `html-helpers.ts` | `href` doit toujours être contrôlé côté serveur — ne jamais passer une URL utilisateur |
| `ProReservationCard.tsx` | `formatTime` et `isCancellable` : format attendu `HH:MM` ou `HH:MM:SS` (Supabase) |
| `api/cron/reminders/*/route.ts` | En dev sans `CRON_SECRET`, les routes sont accessibles librement (warning loggé) |

---

## Migrations Supabase

| # | Fichier | Description |
|---|---------|-------------|
| 001-051 | … | Voir historique sessions précédentes |
| 052 | `052_fix_admin_notification_subject.sql` | Correction sujet `admin_notification` (variables `{{événement}}` et `{{nom}}`) |
| 053 | `053_fix_email_catalogue_url.sql` | Correction `email_catalogue_url` → `derviche-pro.fr/catalogue` |
| 054 | `054_fix_unique_reservation_user_slot.sql` | Partial index `(user_id, slot_id)` WHERE `status != 'cancelled'` — fix bug changement créneau |
| 055 | `055_add_reminder_email_templates.sql` | 3 templates rappels en DB (`reminder_7d`, `reminder_2d`, `reminder_12h`) |
| 056 | `056_add_reminder_app_settings.sql` | 3 toggles `reminder_enabled_*` dans `app_settings` (défaut : `true`) |
