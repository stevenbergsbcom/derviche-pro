# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 125

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

### 🟡 Professional (70%) — Sessions 122-125
- ✅ Middleware, layout, sidebar
- ✅ Redirect post-login → `/professional`
- ✅ Page "Mes réservations" (onglets À venir / Historique)
- ✅ Annulation réservation avec dialog confirmation
- ✅ UX desktop : layout horizontal avec colonnes — Session 125
- ❌ Mon compte (édition profil pro)
- ❌ Rapatriement réservations guest (matching par `guest_email`) → Session 126

### ✅ Autres (100%)
- Thème & logos dynamiques, PWA, export Excel/CSV, sidebar partagée

---

## Dernier travail (Session 125)

### Corrections critiques
- **Migration 042** : RPC `create_public_reservation` fixée → `user_id = auth.uid()` (réservations visibles dans le dashboard pro)
- **Migration 043** : Trigger `handle_new_user` corrigé → `first_name`, `last_name`, `phone` copiés depuis `raw_user_meta_data`
- **Migration 044** : Ajout `postal_code`, `city`, `country` dans `profiles` + `guest_afc_number`, `guest_country` dans `reservations`
- **Migration 045** : RPC définitive — réintègre TOUTES les validations perdues (R-RESA-04 unicité email/slot, bloc admin/externe, validation champs obligatoires, format email, longueurs, nombre de places) + `user_id`, `country`, `afc_number`

### Nouvelles fonctionnalités
- **Option C** : pré-remplissage formulaire réservation depuis profil Supabase (useEffect sur `currentStep === 'form'`)
- **Enrichissement profil** : après réservation, les champs NULL du profil sont remplis avec les données du formulaire (non-bloquant, `void`)
- **Détection connexion** : `handleContinueToForm()` → si connecté, bypass modale auth
- **Champs formulaire** : ajout `country` (défaut "France") et `afcNumber` dans le formulaire et dans la RPC
- **UX desktop réservations pro** : layout horizontal avec colonnes (barre statut colorée, colonnes fixes, en-tête)

### Types mis à jour
- `src/types/database.ts` : `ProfileRow`, `ProfileInsert`, `ProfileUpdate` → ajout `postal_code`, `city`, `country`
- `src/types/supabase.ts` : régénéré depuis Supabase après migration 044

---

## Prochaine session : 126 — Rapatriement réservations guest

### Objectif
Quand un guest (non connecté) fait une réservation avec son email, puis crée un compte ou se connecte avec ce même email → ses réservations guest doivent apparaître dans son dashboard `/professional/reservations`.

### Approche recommandée
**Option A — Rapatriement automatique en base (trigger ou RPC)**
Au moment de la connexion / création de compte, une RPC ou un trigger `handle_new_user` fait :
```sql
UPDATE reservations
SET user_id = auth.uid()
WHERE guest_email = LOWER(user.email)
  AND user_id IS NULL
  AND status != 'cancelled';
```

**Option B — Rapatriement côté client au chargement du dashboard**
Dans `useProReservations`, si l'utilisateur est connecté, appeler une RPC qui rapatrie d'abord, puis fetch les réservations.

**Option C — Bannière de rapatriement manuel**
Afficher une bannière dans le dashboard pro avec un bouton "Retrouver mes réservations" qui déclenche le rapatriement à la demande.

### Réflexion à faire avec Steven
- Option A (trigger) : automatique, invisible, mais moins contrôlable
- Option B (hook) : transparent, mais appel à chaque chargement
- Option C (bannière) : UX explicite mais friction

### Fichiers concernés
- `supabase/migrations/046_claim_guest_reservations.sql` (nouvelle RPC)
- `src/hooks/useProReservations.ts` (appel RPC avant fetch)
- `src/app/professional/reservations/page.tsx` (bannière éventuelle)

---

## Points d'accessibilité à traiter (dette technique légère)
- `src/app/(public)/spectacle/[slug]/page.tsx` :
  - `aria-label` sur boutons "mois précédant" / "mois suivant"
  - `aria-expanded` sur bouton "Lire la suite"
  - `role="grid"` + `aria-selected` sur le calendrier
- `ProReservationCard.tsx` : `aria-label` sur le bouton "Annuler"
- `professional/reservations/page.tsx` : `aria-label` sur bouton "Réessayer"

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
