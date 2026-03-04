# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 137 (validé build prod) — 4 mars 2026

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
| Notifications | ✅ Badge cloche sidebar + Sheet paginé + marquage lu individuel — S137 |

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

### ✅ Notifications admin (100%) — S137
- **Badge cloche** dans le footer de la sidebar admin (polling 30s)
- **Sheet latéral** : liste paginée (20/page), skeleton, état vide, erreur
- **Marquage lu individuel** : chaque admin gère ses propres notifications lues
- **"Tout marquer lu"** : upsert batch optimiste
- **Mutations optimistes** : is_read mis à jour immédiatement côté UI
- **3 types** : nouvelle réservation (vert), annulation (rouge), modification (ambre)
- **Déclenchement** : après chaque envoi email confirmation/annulation/modification

**Architecture :**
- 2 tables : `admin_notifications` + `admin_notification_reads` (PK composite)
- RLS : INSERT uniquement service role — SELECT/UPDATE admin + super-admin
- API : GET `/api/admin/notifications` + POST `[id]/read` + POST `read-all`
- Service : `src/lib/services/notifications/` (types + queries + index)
- Hook : `use-notifications.ts` — polling 30s, pagination, mutations

---

## Dernier travail (Session 137 — 4 mars 2026)

### Fichiers clés créés/modifiés

| Fichier | Modification |
|---------|-------------|
| `migration 057` | Table `admin_notifications` + index + RLS |
| `migration 058` | Table `admin_notification_reads` + RLS |
| `reminders/queries.ts` | Suppression `logReminderSent` @deprecated |
| `reminders/index.ts` | Export `logReminderSent` supprimé |
| `services/notifications/types.ts` | Types `NotificationType`, `AdminNotification`, etc. |
| `services/notifications/queries.ts` | 5 fonctions CRUD notifications |
| `services/notifications/index.ts` | Barrel exports |
| `services/index.ts` | Module notifications enregistré |
| `api/admin/notifications/route.ts` | GET liste paginée + unreadCount |
| `api/admin/notifications/[id]/read/route.ts` | POST marquer une notif lue |
| `api/admin/notifications/read-all/route.ts` | POST tout marquer lu |
| `api/emails/send-confirmation/route.ts` | + `createAdminNotification('new_reservation')` |
| `api/emails/send-cancellation/route.ts` | + `createAdminNotification('cancellation')` |
| `api/emails/send-modification/route.ts` | + `createAdminNotification('modification')` |
| `hooks/use-notifications.ts` | Hook polling 30s + pagination + mutations optimistes |
| `components/admin/notifications/notification-item.tsx` | Ligne notif : icône + message + date relative |
| `components/admin/notifications/notification-badge.tsx` | Cloche + badge rouge |
| `components/admin/notifications/notification-sheet.tsx` | Sheet paginé complet |
| `components/admin/admin-sidebar/index.tsx` | Intégration badge + sheet |

### Points techniques notables S137
- **Marquage lu individuel** : table de jonction `admin_notification_reads` (PK composite) — plus propre qu'un array `UUID[]` dénormalisé.
- **is_read via LEFT JOIN** : calculé côté Supabase, filtré automatiquement par RLS (`user_id = auth.uid()`) — pas de requête supplémentaire.
- **Mutations optimistes** : `markAsRead` et `markAllAsRead` mettent à jour l'UI immédiatement, l'appel API est non-bloquant.
- **Sheet vs Popover** : Sheet choisi car Popover n'est pas dans le projet shadcn — évite une nouvelle dépendance.
- **`slot_date` null dans send-confirmation** : payload ne contient que la date formatée FR, pas l'ISO. Dette légère, non bloquant.

---

## À faire (prochaines sessions)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S138** | RGPD suppression compte (`supabase.auth.admin.deleteUser`) | 🟡 Basse |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| `slot_date` null confirmation | `send-confirmation/route.ts` | Payload ne contient pas l'ISO date du créneau — notif créée sans `slot_date` | 🟡 Basse |
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
| `api/admin/notifications/*` | INSERT `admin_notifications` uniquement via service role (pas de policy RLS authenticated) |

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
