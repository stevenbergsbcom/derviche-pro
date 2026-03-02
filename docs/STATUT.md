# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 129

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

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations
- Statistiques
- Export
- Mon compte

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export Excel/CSV (admin + company)
- Export CSV natif pour professionnels (sans dépendance xlsx/exceljs)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Session 129)

**Emails transactionnels — Confirmation de réservation (Resend) :**

- Achat domaine `derviche-pro.fr` (O2switch) + DNS configurés (DKIM, SPF MX, SPF TXT, DMARC)
- Domaine vérifié dans Resend (région EU Frankfurt — RGPD)
- Service `src/lib/services/email.ts` : `sendReservationConfirmationEmail()` avec template HTML complet
- Template branding Derviche (bleu #1e3a5f, or #c9a84c), responsive, variables dynamiques
- Route API `POST /api/emails/send-confirmation` avec validation Zod
- Envoi déclenché **uniquement** à la soumission du formulaire (`spectacle/[slug]/page.tsx`), non-bloquant
- Configuration expéditeur lue depuis `app_settings` (DB) : `email_from_name`, `email_from_address`, `email_reply_to`
- Expéditeur : `reservations@derviche-pro.fr` | Réponse : `contact@derviche-pro.fr`
- Fix `reply_to` → `replyTo` (API Resend v2)
- Fix double envoi : suppression de l'envoi parasite dans `confirmation/page.tsx`

**Corrections sécurité auth :**

- `.single()` → `.maybeSingle()` sur tous les appels `profiles` (middleware, login, LoginForm, useSidebarUserData)
- Fix middleware : vérification profil désactivé/supprimé via **service role key** (bypasse RLS `deleted_at IS NULL`)
- Distinction `deleted_at` vs `disabled_at` dans tous les points de contrôle :
  - `deleted_at` → *"Ce compte a été supprimé. Vous pouvez créer un nouveau compte."*
  - `disabled_at` → *"Votre compte a été désactivé. Contactez un administrateur."*
- Suppression du toast "Connexion réussie" prématuré — la redirection vers le dashboard suffit
- Guard `getUserRole` avant toute redirection (évite redirect sans destination)

**Corrections TypeScript :**

- Import `useRef` manquant dans `confirmation/page.tsx`
- `result.data` possibly undefined dans `spectacle/[slug]/page.tsx`
- `reply_to` → `replyTo` dans `email.ts`

**Corrections post-audit (3 priorités) :**

- API `POST /api/emails/send-confirmation` : vérification réservation en base + correspondance email (service role)
- `confirmation/page.tsx` : suppression fallbacks de démo (Jean Dupont, UUID fictif), écran "Lien invalide" si params manquants
- `useSidebarUserData` : `transformData` exclu des deps `useEffect` (stable via `useCallback`), commentaire explicatif

**Correction sécurité post-audit : check statut compte (deleted_at invisible aux RLS) :**

- Nouveau Server Action `src/lib/actions/auth.ts` : `checkAccountStatus(userId, accessToken)` — utilise service role + valide l'access_token, bypasse RLS `deleted_at IS NULL`
- Nouvelle API route `POST /api/auth/check-account-status` (backup)
- `login/page.tsx` + `LoginForm.tsx` : appelent le Server Action après `signInWithPassword`, avec try-catch fail-open (middleware prend le relais si échec)
- `not_found` traité comme `deleted` → même message "Ce compte a été supprimé"

**À faire (dette mineure) :**
- Flash "Accès interdit/refusé" au moment de la déconnexion — à investiguer

**Scores audit Cursor :** 7,8/10 → estimé 8,5/10 après corrections

**Commits :** à compléter

---

## Travail précédent (Session 128)

**Refonte UX modale professionnels :**
- Avatar initiales `bg-derviche` dans le header
- Structure affichée sous l'email dans le header
- Bouton Modifier intégré dans la rangée d'actions (plus en pleine largeur dans l'onglet)
- `isEditing` remonté dans `ProfessionalModal` — reset automatique au changement d'onglet
- `InfoRow` layout horizontal (label fixe `w-28` + valeur inline) — ~30% moins de scroll
- `cursor-pointer` sur les boutons ✕ des modales (ProfessionalModal + ProfessionalColumnSelectorDialog)

**Refonte cards réservations (onglet Réservations de la modale) :**
- Layout 3 colonnes : bloc date (jour/mois) + infos condensées (titre, lieu, places) + badge statut
- Résumé en haut : nb réservations · places confirmées
- Tri intelligent : futures (date ASC) en premier, passées (date DESC) atténuées
- Labels "À venir" / "Passées" avec aria-label

**Deep-link réservations :**
- Clic sur une card → `/admin/reservations?reservationId=xxx`
- Auto-ouverture de la dialog de détail, nettoyage URL via `history.replaceState`
- UUID validation avant appel API

**Colonnes configurables + Export CSV :**
- `useProfessionalsColumnsPreference` : persistance Supabase (key `admin_professionals_columns`)
- `ProfessionalColumnSelectorDialog` : 7 colonnes optionnelles
- Export CSV BOM UTF-8 (compatible Excel), sans dépendance externe
- `xlsx` et `exceljs` exclus (vulnérabilités sans correctif disponible)

**Mise à jour sécurité :**
- Next.js → 16.1.6 (fix 3 vulnérabilités DoS)
- Vulnérabilités restantes : chaîne eslint uniquement (dev, jamais en prod)

**Fix stale closure (détecté par Cursor AI) :**
- `handleUpdate` dans `useProfessionalsPage.ts` utilisait `professionals.find()` dans une closure potentiellement obsolète
- Corrigé : `setDrawerState(prev => { ...prev.professional, ...data })` via setter fonctionnel
- `professionals` retiré des dépendances de `useCallback`

**Scores audit Cursor :**
- ProfessionalModal : 8,5/10
- ProfessionalReservations : 8,75/10
- ProfessionalColumnSelectorDialog : 8,6/10
- **Score global session : 8,6/10**

**Commits :**
- `feat(ux): refonte modale professionnels + cards réservations`
- `fix(audit): corrections post-audit S128 UX`
- `fix(stale-closure): handleUpdate utilise prev.professional au lieu de professionals.find`
- `Merge dev → main: S128 complète — UX modale + fix stale closure`

---

## Travail précédent (Session 127)

**Espace professionnel /professional/mon-compte :**
- 4 sections : Informations personnelles, Informations professionnelles, Adresse, Sécurité
- Fix bug country prefill (fallback 'France' écrasait la valeur réelle)
- Pattern `if (!profile) return null` pour TypeScript narrowing
- RGPD reporté

---

## Travail précédent (Session 126)

**Rapatriement réservations guest :**
- RPC `get_guest_reservations` + `claim_selected_reservations`
- Hook `useGuestReservationsClaim`
- `GuestReservationsBanner` : bannière dismissible dans l'espace pro
- `profiles` : +postal_code / city / country / email2 / phone2 / afc_number

---

## À faire

### Fonctionnalités restantes (cahier des charges)
- [x] ~~Emails transactionnels~~ — **Confirmation réservation ✅ (Session 129)**
- [ ] Email d'annulation de réservation
- [ ] Template email : amélioration visuelle (logo Derviche, footer légal, lien désabonnement)
- [ ] Rappels automatiques (Vercel Cron ou Supabase pg_cron)
- [ ] Purge RGPD automatique
- [ ] **Gestion suppression complète compte (RGPD)** : lors d'un `deleted_at`, appeler `supabase.auth.admin.deleteUser(userId)` pour libérer l'email et permettre la réinscription. À implémenter dans une session dédiée RGPD.
- [ ] Affichage `organization_name` dans les emails et le catalogue public

### Améliorations identifiées (Préférences admin)
Voir liste de 20 améliorations dans version Session 121.

---

## ⚠️ DETTE TECHNIQUE — Section Préférences Admin

**Date d'audit :** 18 février 2026
**Statut :** Données sauvegardées mais non consommées

| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse | ⚠️ Seulement `organization_name` (alt logo sidebar) | Non |
| Email | `email_from_name`, `email_from_address` | ✅ Confirmation réservation (Session 129) | Partiel |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |

### Fonctionnalités à construire pour activer ces sections
- [ ] Système d'envoi d'emails transactionnels (confirmation réservation, annulation)
- [ ] Affichage de `organization_name` dans les emails et le catalogue public
- [ ] Job planifié pour les rappels automatiques (Vercel Cron ou Supabase pg_cron)
- [ ] Job de purge RGPD automatique

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
