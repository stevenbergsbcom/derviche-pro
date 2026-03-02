# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 132

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
| Préférences | ✅ Organisation, Apparence (thème + logos), Email, Rappels, RGPD + badges statut |

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

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export Excel/CSV (admin + company)
- Export CSV natif pour professionnels (sans dépendance xlsx/exceljs)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Session 132)

**Changement de créneau pro self-service + email de modification :**

- `src/lib/services/pro-reservations/index.ts` : types `ProAvailableSlot`, `ProAvailableSlotsResult`, `ChangeSlotResult` + fonctions `getProAvailableSlotsForShow()` + `changeMyReservationSlot()` (utilise RPC `update_reservation_safe`)
- `src/lib/services/email.ts` : interface `ReservationModificationEmailData` + template HTML `buildModificationHtml()` (ancien créneau barré en gris, nouveau en bleu) + `sendReservationModificationEmail()`
- `src/app/api/emails/send-modification/route.ts` : route API complète (validation Zod, vérification ownership, notif manager si toggle `email_notification_modification` ON)
- `src/app/professional/reservations/components/ProChangeSlotDialog.tsx` : dialog sélection créneau avec radio visuel, chargement async, gestion erreurs
- `src/app/professional/reservations/components/ProReservationCard.tsx` : boutons mobile empilés pleine largeur (Modifier principal bleu, Voir secondaire outline, Annuler ghost rouge)
- `src/hooks/useProReservations.ts` : `changeSlot()` + `isChangingSlot` + `load()` retourne `boolean` (fix bug faux succès si refresh échoue)
- Fix conflit export : types pro renommés avec préfixe `Pro` (vs admin-reservations qui exporte déjà `AvailableSlot`)
- **Bug détecté et corrigé par audit Cursor** : `changeSlot` retournait `success: true` même si `load()` échouait après la modification

**Score audit Cursor : 8.5/10**

**Commits mergés sur main :**
- `feat: changement de créneau par le pro + email de modification`
- `fix: renommer bouton Changer → Modifier, supprimer places restantes dialog`
- `fix: UX mobile réservations pro - layout boutons + labels cohérents`
- `fix: boutons mobile réservations pro - option A pleine largeur empilée`
- `fix: bouton Annuler pleine largeur sur mobile`
- `fix: changeSlot détecte échec load() après modification créneau`

---

## Travail précédent (Session 131)

**Notifications email manager + préférences :**
- `sendAdminNotificationEmail()` : notif vers manager DD du spectacle (derviche_manager_id) pour nouvelles résas, annulations, modifications
- 3 toggles dans préférences admin : `email_notification_new_reservation`, `email_notification_cancellation`, `email_notification_modification`
- `escapeHtml()` dans tous les templates email
- `isBooleanSettingTrue()` : utilitaire pour lire les booléens JSONB depuis app_settings
- Fix JSONB bool : correction stockage/lecture des toggles en DB
- Section Notifications dans /admin/settings/preferences
- **Score audit : 8.7/10**

---

## Travail précédent (Session 130)

**Fix flash logout :**
- `logout-button.tsx` : `window.location.href` (pas `router.push`) + ref `isMounted`
- Layouts professional + company : `LoadingScreen` si `!isAuthenticated` + timeout 4s → `AccessDenied` avec lien `/login`
- `AccessDenied` seulement pour utilisateur connecté avec mauvais rôle

---

## Travail précédent (Session 129)

**Emails transactionnels — Confirmation de réservation (Resend) :**

- Achat domaine `derviche-pro.fr` (O2switch) + DNS configurés (DKIM, SPF MX, SPF TXT, DMARC)
- Domaine vérifié dans Resend (région EU Frankfurt — RGPD)
- Service `src/lib/services/email.ts` : `sendReservationConfirmationEmail()` avec template HTML complet
- Route API `POST /api/emails/send-confirmation` avec validation Zod
- Configuration expéditeur lue depuis `app_settings` (DB) : `email_from_name`, `email_from_address`, `email_reply_to`
- Expéditeur : `reservations@derviche-pro.fr` | Réponse : `contact@derviche-pro.fr`

---

## Travail précédent (Session 128)

**Refonte UX modale professionnels :**
- Avatar initiales, InfoRow horizontal, cards réservations 3 colonnes
- Deep-link réservations (`/admin/reservations?reservationId=xxx`)
- Colonnes configurables avec persistance Supabase
- Export CSV BOM UTF-8 natif (sans xlsx/exceljs)
- Fix stale closure dans `useProfessionalsPage.ts`
- **Score global : 8.6/10**

---

## À faire

### Sessions planifiées

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S133** | Audit préférences admin (app_settings consommées vs stockées) + suppression bannière "non connecté" dans `email-section.tsx` | 🔴 Haute |
| **S134** | Affichage `organization_name` dans emails + catalogue public | 🟠 Moyenne |
| **S135** | Rappels automatiques J-7/J-2 (Vercel Cron ou Supabase pg_cron) | 🟠 Moyenne |
| **S136** | Système notifications admin (badge lu/non-lu, table `admin_notifications`) | 🟡 Basse |
| **S137** | RGPD suppression compte (`supabase.auth.admin.deleteUser` quand `deleted_at`) | 🟡 Basse |

### Fonctionnalités restantes (cahier des charges)
- [x] ~~Emails transactionnels~~ — Confirmation ✅ S129 / Annulation ✅ S131 / Modification ✅ S132
- [ ] Rappels automatiques (Vercel Cron ou Supabase pg_cron) — S135
- [ ] Purge RGPD automatique — S137
- [ ] Suppression compte RGPD (`supabase.auth.admin.deleteUser`) — S137
- [ ] Affichage `organization_name` dans emails et catalogue public — S134
- [ ] Bannière "non connecté" à supprimer dans `email-section.tsx` (Resend actif depuis S129) — S133
- [ ] ⚠️ `email_catalogue_url` en DB pointe encore Vercel (pas derviche-pro.fr) — corriger en S133

---

## ⚠️ DETTE TECHNIQUE — Section Préférences Admin

**Date d'audit :** 18 février 2026 (mis à jour S132)
**Statut :** Données sauvegardées mais partiellement consommées

| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse | ⚠️ `organization_name` = alt logo sidebar seulement | Non |
| Email | `email_from_name`, `email_from_address`, `email_reply_to` | ✅ Tous les emails transactionnels | ✅ OK |
| Notifications | 3 toggles new/cancellation/modification | ✅ Lus dans les 3 routes email | ✅ OK |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |
| `email_catalogue_url` | URL catalogue dans les emails | ⚠️ Pointe encore Vercel pas derviche-pro.fr | Mineur |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `app_settings` (DB) | `email_catalogue_url` pointe Vercel → à corriger vers derviche-pro.fr |
