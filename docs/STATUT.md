# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 136 (final) — 4 mars 2026

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
- Table `email_templates` avec **7 templates en DB** (4 transactionnels + 3 rappels)
- UI admin : onglet "Templates" avec 2 groupes visuels (transactionnels / rappels)
- Preview email : 7 builders supportés, mock dédié pour les rappels
- Service email : 8 modules dans `src/lib/services/email/`

### ✅ Rappels automatiques (100%) — S136
| Type | Cron | Fenêtre | Couleur header | Statut |
|------|------|---------|----------------|--------|
| J-7 | `0 7 * * *` (daily) | `[J-7 18h, J-6 6h]` | Ambre `#92400e` | ✅ S136 |
| J-2 | `0 7 * * *` (daily) | `[J-2 18h, J-1 6h]` | Orange `#c2410c` | ✅ S136 |
| H-12 | `0 * * * *` (hourly) | `[H-11h30, H-12h30]` | Bleu DD `#1e3a5f` | ✅ S136 |

- **Anti-doublon** : `sent_notifications` avec contrainte unique `(reservation_id, type)`
- **Anti race condition** : pattern optimistic lock — `tryClaimReminder()` avant envoi, `releaseReminderClaim()` si échec
- **Routes cron sécurisées** : `CRON_SECRET` via header `Authorization: Bearer`
- **Vercel Cron Jobs** : configurés dans `vercel.json`
- **Toggles admin** : `reminder_enabled_7d/2d/12h` dans `app_settings` — lus via service role (bypass RLS)
- **Envoi séquentiel** : délai 600ms anti rate-limit Resend
- **Fallbacks DB** : 3 templates de secours si DB inaccessible

---

## Dernier travail (Session 136 — 4 mars 2026)

### Rappels automatiques J-7 / J-2 / H-12 — fichiers créés/modifiés

| Fichier | Modification |
|---------|-------------|
| `migration 055` | 3 templates rappels en DB : `reminder_7d`, `reminder_2d`, `reminder_12h` |
| `migration 056` | 3 toggles `reminder_enabled_*` dans `app_settings` (défaut : `true`) |
| `types/email-templates.ts` | `EmailTemplateKey` étendu (+3 clés reminder) + labels |
| `email/fallbacks.ts` | +3 fallbacks reminder — `key: EmailTemplateKey` + `Record<EmailTemplateKey>` exhaustif |
| `reminders/types.ts` | Types + `DAILY_REMINDER_CONFIGS` + `HOURLY_REMINDER_CONFIG` |
| `reminders/queries.ts` | Éligibles (anti-doublon, fenêtre, managers batch) + `tryClaimReminder` + `updateReminderMessageId` + `releaseReminderClaim` |
| `reminders/send.ts` | Flux : claim → config+template → HTML → Resend → update/release |
| `reminders/process.ts` | `readToggleServerSide()` via service role (bypass RLS) + boucle `for` indexée |
| `reminders/index.ts` | Barrel exports (dont 3 nouvelles fonctions queries) |
| `builders/reminder-7d.ts` | Builder HTML J-7 (ambre `#92400e`) |
| `builders/reminder-2d.ts` | Builder HTML J-2 (orange `#c2410c`) |
| `builders/reminder-12h.ts` | Builder HTML H-12 (bleu DD `#1e3a5f`) + `buildInfoBlock` couleurs corrigées |
| `api/cron/reminders/daily/route.ts` | Route GET — J-7 + J-2, `Object.values(DAILY_REMINDER_CONFIGS)` |
| `api/cron/reminders/hourly/route.ts` | Route GET — H-12 |
| `vercel.json` | 2 crons (`0 7 * * *` et `0 * * * *`) |
| `.env.local` | `CRON_SECRET` ajouté, doublon `NEXT_PUBLIC_APP_URL` corrigé |
| `preview/route.ts` | +3 builders reminder + `MOCK_REMINDER` + `VALID_KEYS` étendu + `default: never` exhaustif |
| `[key]/route.ts` | `VALID_TEMPLATE_KEYS` étendu (+3 clés reminder) |
| `templates-section.tsx` | `TemplateAccordionItem` + `TemplateGroupSeparator` + 2 groupes, commentaires "7 templates" |
| `preferences-tabs.tsx` | Onglet Rappels : `CalendarClock` + statut `active` |
| `reminders-section.tsx` | Banner "Non connecté" retiré |
| `app-settings.ts` | `getReminderSettings()` : `parseBool()` cohérent |

### Points techniques notables S136

- **Optimistic lock** : `tryClaimReminder()` insère `pending` avant envoi — contrainte unique DB arbitre les conflits. `releaseReminderClaim()` libère si envoi échoue (retry au prochain cron). `updateReminderMessageId()` remplace `pending` par l'ID Resend réel.
- **Toggles service role** : `readToggleServerSide()` dans `process.ts` bypasse la RLS — le client anon ne peut pas lire `app_settings` en contexte cron (sans session).
- **Switch exhaustif** : `default: never` dans `generatePreviewHtml` — erreur compile si clé manquante.
- **Timezone naïf** : créneaux comparés en UTC (acceptable pour fenêtres larges J-7/J-2 ; H-12 ±30min).
- **`logReminderSent`** : marqué `@deprecated` dans `queries.ts` — suppression prévue en S137.

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S137** | Système notifications admin (badge lu/non-lu) | 🟡 Moyenne |
| **S138** | RGPD suppression compte (`supabase.auth.admin.deleteUser`) | 🟡 Basse |

---

## Plan de vérification S136 (à faire en prod)

```bash
# 1. Vérifier les crons dans Vercel Dashboard → Settings → Cron Jobs
#    Attendu : /api/cron/reminders/daily (0 7 * * *) et /hourly (0 * * * *)

# 2. Tester les routes manuellement
curl -s -H "Authorization: Bearer <CRON_SECRET>" \
  https://derviche-pro.vercel.app/api/cron/reminders/daily | jq
# Attendu : { "ok": true, "totalSent": 0, "totalFailed": 0, ... }

# 3. Test bout en bout : créer une résa dans la fenêtre J-7 en SQL,
#    relancer le curl, vérifier réception email + ligne dans sent_notifications.

# 4. Vérifier toggle : désactiver J-7 dans /admin/preferences → Rappels,
#    relancer curl → "enabled": false dans la réponse.

# 5. Vérifier anti-doublon : relancer curl après envoi →
#    "Slot déjà réclamé" dans les logs Vercel, sent: 0.
```

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `logReminderSent` deprecated | `reminders/queries.ts` | Remplacé par `tryClaimReminder` + `updateReminderMessageId` — à supprimer en S137 | 🟠 S137 |
| Timezone crons | `reminders/queries.ts` | UTC naïf — stocker les créneaux en `timestamptz` si précision accrue requise | 🟡 Basse |
| Champs org non consommés | `app_settings` | `contact_email`, `phone`, `address`, `website` stockés, absents du footer et des emails | 🟡 Basse |
| Zod sur query params | `preview/route.ts` | Pas de validation Zod (admin uniquement, risque faible) | 🟡 Basse |
| `organization_logo_url` | DB | Doublon à supprimer (remplacé par onglet Apparence, migration 050) | 🟡 Basse |
| RGPD purge auto | — | Durées de conservation stockées, aucune purge automatique | 🟡 S138 |
| Footer admin codé en dur | `builders/admin-notification.ts` | N'utilise pas `buildFooterRow` contrairement aux autres builders | 🟡 Basse |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement (shadcn ne l'inclut pas) |
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `buildCtaBlock` dans `html-helpers.ts` | `href` contrôlé côté serveur — ne jamais passer une URL utilisateur |
| `ProReservationCard.tsx` | `formatTime` et `isCancellable` : format attendu `HH:MM` ou `HH:MM:SS` (Supabase) |
| `api/cron/reminders/*/route.ts` | En dev sans `CRON_SECRET` : routes accessibles librement (warning loggé) |

---

## Migrations Supabase

| # | Fichier | Description |
|---|---------|-------------|
| 001-051 | … | Voir historique sessions précédentes |
| 052 | `052_fix_admin_notification_subject.sql` | Correction sujet `admin_notification` |
| 053 | `053_fix_email_catalogue_url.sql` | Correction `email_catalogue_url` → `derviche-pro.fr/catalogue` |
| 054 | `054_fix_unique_reservation_user_slot.sql` | Partial index — fix bug changement créneau |
| 055 | `055_add_reminder_email_templates.sql` | 3 templates rappels (`reminder_7d`, `reminder_2d`, `reminder_12h`) |
| 056 | `056_add_reminder_app_settings.sql` | 3 toggles `reminder_enabled_*` dans `app_settings` (défaut : `true`) |
