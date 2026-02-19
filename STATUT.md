# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 127

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
- Vérification mot de passe (API)
- Confirmation email désactivée (Supabase Dashboard)

### ✅ Public - Catalogue & Réservation (100%)
- Liste des spectacles (public)
- Détail spectacle par slug
- Formulaire réservation (guest ou connecté)
- Confirmation de réservation
- AuthDialog embarqué dans la page spectacle (sans router.push)
- Pré-remplissage formulaire depuis profil (Option C) — Session 125
- Enrichissement profil post-réservation (Option C) — Session 125
- Détection connexion pro → bypass modale auth — Session 125
- Champs Pays et Numéro AFC dans le formulaire — Session 125

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
| Utilisateurs | ✅ Liste, filtres, CRUD, rôle, statut, API |
| Préférences | ✅ Organisation, Apparence (thème + logos), Email, Rappels, RGPD |
| Mon compte | ✅ Connecté Supabase (profil + rôle, sauvegarde, changement mdp) |

### ✅ Company (100%)
- Dashboard, liste/filtres réservations, stats, export, mon compte

### 🟡 Professional (80%) — Sessions 122-126
- ✅ Middleware, layout, sidebar
- ✅ Redirect post-login → `/professional`
- ✅ Page "Mes réservations" (onglets À venir / Historique)
- ✅ Annulation réservation avec dialog confirmation
- ✅ UX desktop : layout horizontal avec colonnes — Session 125
- ✅ Rapatriement réservations guest — Session 126
- ✅ Mon compte (édition profil complet) — Session 127

### 🟡 RGPD (0%) — à planifier
- Consent utilisateur, droit à l'effacement, purge automatique
- Reporté après Session 127

### ✅ Autres (100%)
- Thème & logos dynamiques, PWA, export Excel/CSV, sidebar partagée

---

## Dernier travail (Session 126)

### Rapatriement des réservations guest
Quand un professionnel réservait en guest (user_id IS NULL) avant d'avoir un compte,
ses réservations n'apparaissaient pas dans son dashboard. Désormais :

**Architecture retenue : Hybride détection automatique + sélection manuelle**
- Détection silencieuse au montage (une seule fois via `useRef hasDetected`)
- Bannière amber dismissible si des réservations orphelines existent
- L'utilisateur choisit lesquelles récupérer (tout coché par défaut)
- Toast de confirmation, refresh automatique de la liste principale
- `guest_email` conservé après rapatriement (historique/audit)

**Fichiers créés/modifiés :**
- `supabase/migrations/046_claim_guest_reservations.sql` — RPC `get_guest_reservations` + `claim_selected_reservations`
- `supabase/migrations/047_fix_get_guest_reservations.sql` — correctif ambiguïté colonne `id` → `reservation_id` (DROP + CREATE)
- `src/lib/services/pro-reservations/index.ts` — `getGuestReservations()` + `claimSelectedReservations()` + types
- `src/hooks/useGuestReservationsClaim.ts` — hook dédié (détection, sélection, claim, dismiss)
- `src/app/professional/reservations/components/GuestReservationsBanner.tsx` — composant bannière
- `src/app/professional/reservations/components/index.ts` — export GuestReservationsBanner
- `src/app/professional/reservations/page.tsx` — intégration bannière
- `src/hooks/index.ts` — export useGuestReservationsClaim

**Commits :**
- `feat(pro): rapatriement réservations guest — migrations 046/047, service, hook, bannière`
- `fix(pro): corrections audit — formatTime, aria-labels, doc onClaimSuccess`

**Audit : 8,8/10** — corrections appliquées (formatTime, aria-labels, doc stabilité onClaimSuccess)

### Leçons SQL apprises
- Ne jamais nommer `id` une colonne dans un `RETURNS TABLE` avec des JOINs → ambiguïté PostgreSQL garantie
- PostgreSQL interdit `CREATE OR REPLACE` si le type de retour change → toujours `DROP` d'abord
- Ne jamais modifier un fichier de migration déjà appliqué en base → créer une nouvelle migration

### Config Git
- `git config --global merge.ff false` appliqué → merge toujours avec commit de merge (pas de fast-forward)

---

## Dernier travail (Session 127)

### Étape A — Correction bug `country` pré-remplissage ✅
**Fichier :** `src/app/(public)/spectacle/[slug]/page.tsx` ligne ~319
**Bug :** `country: prev.country || profile.country || 'France'` → `prev.country` valant `'France'`
(défaut initial, truthy), le pays du profil n'était jamais lu.
**Fix :** `country: profile.country || prev.country || 'France'` — le profil est maintenant prioritaire.

### Étape B — Page `/professional/mon-compte` ✅
Création de la page Mon compte pour l'espace professionnel.

**Fichier créé :** `src/app/professional/mon-compte/page.tsx`

**4 sections indépendantes :**
- Informations personnelles : prénom, nom, téléphone, téléphone secondaire, email secondaire (éditable)
- Informations professionnelles : structure, fonction, numéro AFC
- Adresse : adresse, code postal, ville, pays
- Compte & sécurité : email principal (lecture seule), date inscription, changement mot de passe

**Décisions :**
- Email secondaire (`email2`) placé dans "Informations personnelles" (modifiable, pas lié à Supabase Auth)
- Email principal non modifiable (lié à l'auth Supabase)
- RGPD reporté à une session dédiée ultérieure
- Pattern identique à admin/mon-compte (single-file, pas de hook séparé)

---

## Points d'accessibilité à traiter (dette technique légère)
- `src/app/(public)/spectacle/[slug]/page.tsx` :
  - `aria-label` sur boutons "mois précédant" / "mois suivant"
  - `aria-expanded` sur bouton "Lire la suite"
  - `role="grid"` + `aria-selected` sur le calendrier
- `ProReservationCard.tsx` : `aria-label` sur le bouton "Annuler"

## Refactoring à planifier
- `src/app/(public)/spectacle/[slug]/page.tsx` (~860 lignes) → extraire sous-composants et hooks

---

## ⚠️ DETTE TECHNIQUE

### Section Préférences Admin
| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse | ⚠️ Seulement `organization_name` | Non |
| Email | `email_from_name`, `email_from_address` | ❌ Aucun système email | Oui |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |

**Fonctionnalités à construire :**
- [ ] Emails transactionnels (confirmation, annulation)
- [ ] Job rappels automatiques (Vercel Cron ou pg_cron)
- [ ] Job purge RGPD automatique

### TODO dans le code
| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `app/(public)/spectacle/[slug]/page.tsx` (~319) | ✅ Bug pré-remplissage country corrigé (Session 127) |
