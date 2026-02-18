# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 123

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
- Vérification mot de passe (API)
- Confirmation email désactivée (Supabase Dashboard) — Session 122

### ✅ Public - Catalogue & Réservation (100%)
- Liste des spectacles (public)
- Détail spectacle par slug
- Formulaire réservation (guest ou connecté)
- Confirmation de réservation
- AuthDialog embarqué dans la page spectacle (sans router.push) — Session 123
- Pré-remplissage du formulaire après connexion/inscription — Session 123

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
| Utilisateurs | ✅ Liste, filtres, CRUD, rôle, statut, API |
| Préférences | ✅ Organisation, Apparence (thème + logos), Email, Rappels, RGPD |
| Mon compte | ✅ Connecté Supabase (profil + rôle, sauvegarde, changement mdp) |

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations
- Statistiques
- Export
- Mon compte

### 🟡 Professional (60%) — Session 122
- ✅ Middleware : protection `/professional`, redirect `/catalogue` si mauvais rôle
- ✅ Redirect post-login : rôle `professional` → `/professional`
- ✅ Layout + sidebar professionnelle
- ✅ Page "Mes réservations" (onglets À venir / Historique)
- ✅ Annulation de réservation avec dialog de confirmation
- ❌ Bug à corriger : statut `waitlist` inexistant en BDD (valeur réelle : `no_show`)
- ❌ Mon compte (session 124)
- ❌ Rapatriement réservations guest (session 124)

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export Excel/CSV (admin + company)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Sessions 121-122)

### Session 121
- Admin/mon-compte connecté à Supabase (profil + rôle en parallèle, vraie sauvegarde, changement mdp via `/api/auth/verify-password`)
- Suppression données mock
- Correction valeur rôle `professional` alignée sur contrainte SQL
- `useCurrentUserRole.ts` corrigé
- Merges dev → main OK

### Session 122
- Création espace `/professional` (layout, sidebar, mes réservations, annulation)
- Correction TypeScript `useProReservations` (`?? []`)
- Désactivation confirmation email Supabase (Dashboard → Auth → Sign In / Providers → Email)
- Planification session 123 : formulaires auth embarqués dans la page spectacle

**Commit session 122 :** `feat: espace /professional - layout, sidebar, mes réservations + annulation (session 122)`

---

## Dernier travail (Session 123)

**Auth embarquée dans la page spectacle — bug dialog corrigé :**
- Découverte : `LoginForm`, `RegisterForm`, `AuthDialog` et le barrel `index.ts` avaient déjà été créés (session non tracée)
- Découverte : `ProReservationStatus` contenait déjà `'no_show'` — bug statut était déjà corrigé
- **Fix principal :** remplacement de l'ancienne `<Dialog>` inline (avec `router.push('/login')` et `router.push('/register')`) par `<AuthDialog>` dans `src/app/(public)/spectacle/[slug]/page.tsx`
- Pré-remplissage du formulaire avec `firstName`, `lastName`, `email`, `phone` après connexion/inscription
- Passage automatique à l'étape `form` sans perdre le contexte (créneau, participants)
- Nettoyage des imports inutiles : `LogIn`, `UserPlus`

**Commits :**
- `fix(public): remplacer Dialog inline par AuthDialog dans page spectacle`

---

## Prochaines sessions

### Session 124 — Mon profil + rapatriement guest
- Page `/professional/mon-compte`
- Bannière de rapatriement des réservations guest (matching par `guest_email`)
- Bouton "Connexion" dans le Header public (Dialog auth)

### Session 125 — Polish UX professional
- Emails de confirmation d'annulation
- Amélioration mobile

---

## ⚠️ DETTE TECHNIQUE

### Section Préférences Admin
**Données sauvegardées mais non consommées :**

| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse | ⚠️ Seulement `organization_name` (alt logo sidebar) | Non |
| Email | `email_from_name`, `email_from_address` | ❌ Aucun système email existant | Oui |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |

**Fonctionnalités à construire pour activer ces sections :**
- [ ] Système d'envoi d'emails transactionnels (confirmation réservation, annulation)
- [ ] Affichage de `organization_name` dans les emails et le catalogue public
- [ ] Job planifié pour les rappels automatiques (Vercel Cron ou Supabase pg_cron)
- [ ] Job de purge RGPD automatique

### TODO dans le code
| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |

---

## Améliorations identifiées (Préférences Admin)

Liste de 20 améliorations documentées dans l'historique des sessions (prioriser après les features manquantes).
