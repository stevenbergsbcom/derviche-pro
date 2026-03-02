# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 133 (en cours)

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé/supprimé
- Service role key pour bypasser RLS `deleted_at IS NULL`
- `.maybeSingle()` partout sur les appels `profiles`
- `checkAccountStatus` Server Action (`src/lib/actions/auth.ts`)
- Fix flash "Accès refusé" à la déconnexion — Session 130

### ✅ Public - Catalogue & Réservation (100%)
- Liste des spectacles, détail par slug, formulaire réservation, confirmation
- AuthDialog embarqué, pré-remplissage profil, enrichissement post-résa
- Champs Pays et Numéro AFC dans le formulaire

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
| Préférences | ✅ Organisation (+ website), Apparence (thème + logos), Email (7 champs complets), Notifications, Rappels, RGPD |
| Mon compte | ✅ Connecté Supabase (profil + rôle, sauvegarde, changement mdp) |

### ✅ Company (100%)
- Dashboard, liste/filtres réservations, stats, export, mon compte

### ✅ Professional (100%)
- Middleware, layout, sidebar
- Redirect post-login → `/professional`
- Page "Mes réservations" (onglets À venir / Historique)
- Annulation réservation avec dialog confirmation
- UX desktop : layout horizontal avec colonnes
- Rapatriement réservations guest (GuestReservationsBanner)
- Mon compte (édition profil complet)
- UX modale refonte (avatar, InfoRow, cards résa) — S128

### ✅ Emails transactionnels — Sessions 129-131
- Service Resend, domaine derviche-pro.fr vérifié (DKIM/SPF/DMARC O2switch)
- Expéditeur : `reservations@derviche-pro.fr`
- Template HTML branding Derviche dans `src/lib/services/email.ts`
- Route API `POST /api/emails/send-confirmation` — confirmation pro
- Route API `POST /api/emails/send-cancellation` — annulation pro + notif manager DD du spectacle
- Route API `POST /api/emails/send-confirmation` — confirmation pro + notif manager DD du spectacle
- Notif envoyée **uniquement au manager Derviche assigné au spectacle** (`derviche_manager_id`)
- Motif d'annulation inclus dans la notif manager
- Section "Notifications" dans admin/préférences : 3 toggles (nouvelle résa / annulation / modification)
- Toggles modifiables super-admin uniquement, persistance `app_settings` en JSONB bool
- Config lue depuis `app_settings` (from_name, from_address, reply_to, subjects, catalogue_url)
- `escapeHtml()` appliqué à toutes les interpolations utilisateur dans les 3 templates HTML
- `isBooleanSettingTrue()` utilitaire dans les routes email
- Migrations `048_add_email_settings.sql` + `049_add_notification_settings.sql` ✅
- Bug fix : rollback null guard dans `useNotificationSettings`
- Bug fix : JSONB bool corrigé en DB (`'true'` string → `true` bool)
- ⚠️ URL catalogue hardcodée : `https://derviche-pro.vercel.app/catalogue` (clé `email_catalogue_url` en DB) — **à mettre à jour lors du custom domaine derviche-pro.fr**

### 🟡 RGPD (0%) — à planifier
- Consent utilisateur, droit à l'effacement, purge automatique

### ✅ Autres (100%)
- Thème & logos dynamiques, PWA, export Excel/CSV, sidebar partagée
- Export CSV natif (sans xlsx/exceljs — vulnérabilités)
- Deep-link réservations, colonnes configurables avec persistance Supabase

---

## Dernier travail (Session 133)

### Audit app_settings + nettoyage préférences

**Bannière email obsolète supprimée**
- `email-section.tsx` : retrait `<InactiveSectionBanner>` + import nettoyé (Resend actif depuis S129)

**Migration 050 — 4 clés manquantes ajoutées en DB**
- `theme_preset`, `logo_white_url`, `logo_dark_url` : consommées par `getThemeSettings()` et la sidebar mais jamais migrées
- `organization_address` : utilisée dans le code depuis S129 mais absente de la DB

**Section Email — 7 champs désormais éditables (était 2)**
- Ajout : `email_reply_to`, `email_confirmation_subject`, `email_cancellation_subject`, `email_signature`, `email_footer_text`
- UI organisée en 3 groupes visuels : Expéditeur / Objets des emails / Contenu commun
- Valeurs par défaut cohérentes avec les fallbacks dans `email.ts`

**Section Organisation — champ `organization_website` ajouté**
- Clé existait en DB (migration 004) mais aucune UI ne permettait de la modifier
- Validation Zod URL avec message d'erreur explicite

**Service `app-settings.ts` étendu**
- `EmailSettingKey` : 2 → 7 clés
- `OrganizationSettingKey` : 5 → 6 clés
- `EmailSettings` interface étendue
- `OrganizationSettings` interface étendue
- `SETTING_LABELS` complété
- `getEmailSettings()` et `getOrganizationSettings()` retournent les nouveaux champs

---

## Travail précédent (Session 132)

### Changement de créneau pro self-service
- `ProChangeSlotDialog` : dialog de changement créneau depuis l'espace pro
- Route API `POST /api/emails/send-modification` + email de modification (ancien barré / nouveau bleu)
- UX mobile réservations pro : boutons empilés pleine largeur
- Fix : `load()` retourne boolean
- Audit 8.7/10, merge main ✅

---

## Travail précédent (Session 131)

### Emails — Notif manager uniquement
- Annulation et nouvelle réservation : notif envoyée au `derviche_manager_id` du spectacle uniquement
- Motif d'annulation transmis dans la notif manager
- Fix bug double email : suppression appel parasite dans `mutations.ts`

### Section Notifications dans admin/préférences
- 3 toggles : nouvelle résa (ON) / annulation (ON) / modification (OFF)
- Persistance Supabase en JSONB bool
- Accessible super-admin uniquement
- Hook `useNotificationSettings` + service `getNotificationSettings()`

### Sécurité & qualité
- `escapeHtml()` sur toutes les interpolations utilisateur dans les 3 templates email
- `isBooleanSettingTrue()` utilitaire dans les 2 routes email
- Fix JSONB : valeurs `'true'` string corrigées en `true` bool en DB (SQL UPDATE)
- Fix rollback null guard dans `useNotificationSettings`
- Build propre : 0 erreur TypeScript, 0 warning ESLint
- **Audit Cursor : 8.7/10**
- Merge `dev` → `main` ✅

---

## Travail précédent (Session 130)

### Tâche 1 — Migration 049
**Non nécessaire.** Vérification en base confirmée : les valeurs `app_settings` email sont correctes.
Le format `'"valeur"'` dans le SQL de la migration 048 est du JSONB string valide.

### Tâche 2 — Fix flash "Accès refusé" à la déconnexion

**Cause identifiée :** Lors du `signOut()`, `useCurrentUserRole` détectait `isAuthenticated = false`
et le layout rendait `<AccessDenied title="Accès refusé">` pendant ~200ms, avant que
`window.location.href` navigue vers `/login`.

**Fichiers modifiés :**

`src/components/auth/logout-button.tsx`
- `router.push('/login')` → `window.location.href = '/login'` (navigation dure, évite re-validation de route)
- Ajout ref `isMounted` : `setIsLoading`/`toast` ne sont appelés qu'si composant encore monté
- `error as Error` → `err instanceof Error ? err : new Error(String(err))` dans catch

`src/app/professional/layout.tsx` + `src/app/company/layout.tsx`
- `!isAuthenticated` → `<LoadingScreen />` au lieu de `<AccessDenied>` (redirection en cours)
- Timeout 4 secondes : si navigation SPA échoue → `<AccessDenied>` avec lien "Aller à la page de connexion"
- `AccessDenied` réservé aux utilisateurs **connectés** avec mauvais rôle

**Commits :**
- `fix(auth): suppression flash Accès refusé à la déconnexion`
- `fix(auth): corrections post-audit S130`
- `merge(S130): fix flash logout + corrections post-audit` → **main**

**Audit : 8/10**

---

## Travail précédent (Session 129)

**Emails transactionnels + corrections sécurité auth :**
- Resend configuré, DNS O2switch, domaine vérifié
- `.single()` → `.maybeSingle()` (middleware, login, LoginForm, useSidebarUserData)
- Service role key dans middleware pour bypasser RLS `deleted_at IS NULL`
- `checkAccountStatus` Server Action dans `src/lib/actions/auth.ts`
- API email sécurisée : vérif résa en base + correspondance email
- `confirmation/page.tsx` : suppression fallbacks de démo
- Fix double envoi email (suppression envoi parasite dans confirmation/page.tsx)
- Audit estimé 8,5/10

---

## À faire (prochaines sessions)

### Priorité haute
- [x] Email d'annulation de réservation ✅ Session 131
- [x] Notif manager nouvelles réservations ✅ Session 131
- [x] Préférences notifications admin ✅ Session 131
- [ ] Rappels automatiques (Vercel Cron ou Supabase pg_cron)

### Priorité moyenne
- [ ] Affichage `organization_name` dans les emails et le catalogue public
- [ ] Amélioration template email (logo Derviche, footer légal, lien désabonnement)
- [ ] RGPD : suppression complète compte — `supabase.auth.admin.deleteUser(userId)` quand `deleted_at` est posé

### Priorité basse
- [ ] Refactoring `src/app/(public)/spectacle/[slug]/page.tsx` (~860 lignes)
- [ ] Accessibilité : aria-labels calendrier, boutons navigation

---

## ⚠️ DETTE TECHNIQUE

### Section Préférences Admin
| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse, website | ⚠️ Seulement `organization_name` (alt logo sidebar) | Non |
| Email | 7 champs (from, reply-to, subjects, signature, footer) | ✅ Tous consommés par `email.ts` | Non |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |

### Audit onglet Organisation — champs non consommés (S133)
| Champ | Utilisé ? | Endroit |
|-------|-----------|--------|
| `organization_name` | ✅ Oui | `SidebarLogo.tsx` → attribut `alt` du logo uniquement |
| `organization_logo_url` | ❌ Non | Doublon inutile — remplacé par les logos de l'onglet Apparence |
| `organization_contact_email` | ❌ Non | Footer hardcodé, absent des emails |
| `organization_contact_phone` | ❌ Non | Jamais affiché |
| `organization_address` | ❌ Non | Jamais affiché |
| `organization_website` | ❌ Non | Jamais affiché |

**Actions prévues (session future) :**
- Rendre le footer public dynamique (email, phone, address depuis la DB)
- Injecter `organization_name` dans les templates email (en-tête, pied de page)
- Supprimer `organization_logo_url` du formulaire UI (doublon avec onglet Apparence)
- Utiliser `organization_website` dans le footer ou les emails

### TODO dans le code
| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `app/(public)/spectacle/[slug]/page.tsx` | Refactoring prévu (860 lignes) |
| `admin/preferences/.../email-section.tsx` | ✅ Bannière supprimée en S133 |
| `organization_logo_url` | Champ UI + DB présent mais jamais utilisé — doublon avec onglet Apparence — à supprimer |
