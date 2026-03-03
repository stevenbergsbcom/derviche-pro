# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 134A — 3 mars 2026

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
| Préférences | ✅ Organisation, Apparence (thème + logos), Email (7 champs), Notifications (3 toggles), Rappels, RGPD |

### ✅ Espace Professionnel (100%)
- /professional/mon-compte : profil perso, pro, adresse, sécurité
- Fix bug country prefill
- Rapatriement réservations guest (GuestReservationsBanner)
- /professional/reservations : liste réservations à venir + historique
- Changement de créneau en self-service (ProChangeSlotDialog)
- UX mobile : boutons empilés pleine largeur (Modifier / Voir / Annuler)

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations
- Statistiques
- Export
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

### ✅ Templates email dynamiques (100%) — S134A
- Table `email_templates` (migration 051) avec 4 templates en DB
- Champs éditables par admin : `subject`, `intro_text`, `body_text`, `info_text`, `header_title`, `salutation`, `cta_text`, `contact_block_title`
- Champs booléens : `show_contact_block`, `show_reservation_code`, `is_active`
- Service `email-templates.ts` : `getEmailTemplate()`, `resolveTemplateVariables()`, `textToHtml()`
- Service `email.ts` : refonte complète — tous les builders lisent les champs depuis DB
- Module partagé `lib/utils/format-date.ts` : `formatDateFr()` / `formatTimeFr()` (anti-duplication)
- Fallback `getFallbackTemplate()` pour les 4 templates si DB inaccessible
- RLS : super-admin ALL, admin SELECT, auth SELECT si `is_active = true`
- **Score audit : 10/10**

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export CSV natif pour professionnels (sans dépendance xlsx/exceljs)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Session 134A)

**Templates email dynamiques depuis DB :**

- `supabase/migrations/051_create_email_templates.sql` : table `email_templates`, 4 templates insérés, RLS, trigger `updated_at`
- `src/types/email-templates.ts` : `EmailTemplateKey` union, `EmailTemplate` interface complète, `EmailTemplateUpdatePayload`, `EMAIL_TEMPLATE_NAMES`
- `src/lib/services/email-templates.ts` : `getEmailTemplate()`, `getAllEmailTemplates()`, `updateEmailTemplate()`, `resolveTemplateVariables()`, `textToHtml()`
- `src/lib/services/email.ts` : refonte complète — blocs partagés (`buildContactBlock`, `buildInfoBlock`, `buildSignatureBlock`, `buildCtaBlock`, `buildFooterRow`), `getFallbackTemplate()` pour 4 templates, `escapeHtml()` sur 100% des champs HTML dont dates/heures
- `src/lib/utils/format-date.ts` : module partagé `formatDateFr()` / `formatTimeFr()` importé par les routes email
- `src/app/api/emails/send-modification/route.ts` : status 422 si destinataire introuvable, fusion 2 requêtes manager → 1, import `UserRole`, import `format-date`
- `src/app/api/emails/send-cancellation/route.ts` : `UserRole` type, import `format-date`
- `src/app/admin/preferences/components/sections/email-section.tsx` : nettoyage champs sujets migrés vers `email_templates`

**Score audit Cursor : 10/10**

**Commits mergés sur main :**
- `feat(S134A): templates email dynamiques depuis DB`
- `fix(S134A): corrections post-audit (422, format-date, UserRole, escapeHtml dates)`
- `fix(S134A): escapeHtml slotDate/Time dans buildAdminNotificationHtml`

---

## Travail précédent (Session 133)

**Audit app_settings + nettoyage préférences :**
- Suppression bannière `email-section.tsx` (Resend actif depuis S129)
- Migration 050 : ajout `theme_preset`, `logo_white_url`, `logo_dark_url`, `organization_address` dans `app_settings`
- Section Email : 7 champs (+ `email_signature`, `email_footer_text`, `organization_website`)
- Corrections audit S132 : type guard RPC, `UserRole`, timezone `T12:00:00`, aria-labels
- **Score audit : 8.3/10**

---

## Travail précédent (Session 132)

**Changement de créneau pro self-service + email de modification :**
- `src/lib/services/pro-reservations/index.ts` : types Pro + `getProAvailableSlotsForShow()` + `changeMyReservationSlot()`
- `src/app/professional/reservations/components/ProChangeSlotDialog.tsx`
- Fix stale closure + `load()` retourne `boolean`
- **Score audit : 8.5/10**

---

## À faire

### Sessions planifiées

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S134B** | UI admin onglet "Templates" dans préférences — édition `subject/intro/body/info/header_title/salutation/cta_text` par template | 🔴 Haute |
| **S135** | Rappels automatiques J-7/J-2 (Vercel Cron ou Supabase pg_cron) | 🟠 Moyenne |
| **S136** | Système notifications admin (badge lu/non-lu, table `admin_notifications`) | 🟡 Basse |
| **S137** | RGPD suppression compte (`supabase.auth.admin.deleteUser` quand `deleted_at`) | 🟡 Basse |

### Fonctionnalités restantes (cahier des charges)
- [x] ~~Emails transactionnels~~ — Confirmation ✅ S129 / Annulation ✅ S131 / Modification ✅ S132
- [x] ~~Templates email éditables depuis DB~~ ✅ S134A (backend + service)
- [ ] UI édition templates email — S134B
- [ ] Rappels automatiques (Vercel Cron ou Supabase pg_cron) — S135
- [ ] Purge RGPD automatique — S137
- [ ] Suppression compte RGPD (`supabase.auth.admin.deleteUser`) — S137

---

## ⚠️ DETTE TECHNIQUE

| Élément | Description | Priorité |
|---------|-------------|----------|
| `email_catalogue_url` en DB | Pointe encore Vercel, pas `derviche-pro.fr/catalogue` | 🟠 Corriger en S134B |
| `organization_logo_url` | Doublon à supprimer (remplacé par onglet Apparence migration 050) | 🟡 Basse |
| Rappels admin | `reminder_enabled_7d/2d/12h` stockés mais aucun job planifié | 🟠 S135 |
| RGPD | Durées de conservation stockées mais aucune purge automatique | 🟡 S137 |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `app_settings` (DB) | `email_catalogue_url` pointe Vercel → à corriger vers `derviche-pro.fr` |
| `email_templates` (DB) | Champs `header_title`, `salutation`, `cta_text` non encore exposés dans l'UI admin (S134B) |
