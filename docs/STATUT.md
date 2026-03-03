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



# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 134 (en cours) — branch dev

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

### Sessions planifiées

| Session | Objectif | Priorité | Statut |
|---------|----------|----------|--------|
| **S134A** | Table SQL `email_templates` + service + injection Organisation dans emails + footer dynamique | 🔴 Haute | 🟡 En cours |
| **S134B** | UI onglet "Templates" dans préférences admin + édition texte complet par template | 🔴 Haute | ⏳ Planifié |
| **S135** | Rappels automatiques J-7/J-2 (Vercel Cron) + templates rappel en DB | 🟠 Moyenne | ⏳ Planifié |
| **S136** | Système notifications admin (badge lu/non-lu, table `admin_notifications`) | 🟡 Basse | ⏳ Planifié |
| **S137** | RGPD suppression compte (`supabase.auth.admin.deleteUser` quand `deleted_at`) | 🟡 Basse | ⏳ Planifié |

### Priorité haute
- [x] Email d'annulation de réservation ✅ Session 131
- [x] Notif manager nouvelles réservations ✅ Session 131
- [x] Préférences notifications admin ✅ Session 131
- [ ] **S134A** — Table `email_templates` + données Organisation dynamiques (emails + footer)
- [ ] **S134B** — UI admin gestion templates (Option C : texte intégral éditable, structure HTML fixe)

### Priorité moyenne
- [ ] Rappels automatiques (Vercel Cron) — S135
- [ ] RGPD : suppression complète compte — S137

### Priorité basse
- [ ] Notifications admin (badge lu/non-lu) — S136
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
| `organization_logo_url` | Champ UI + DB présent mais jamais utilisé — doublon avec onglet Apparence — à supprimer en S134B |

---

## 📚 Décisions d'architecture (S134)

### Gestion des templates email — Option C retenue

**Principe :** Structure HTML fixe dans le code (maintenue par développeur) + contenu textuel éditable par l'admin via une table dédiée.

**Table `email_templates` (migration SQL à créer en S134A) :**
```
email_templates (
  id            uuid PRIMARY KEY,
  template_key  varchar UNIQUE NOT NULL,  -- ex: 'reservation_confirmation'
  name          varchar NOT NULL,          -- ex: "Confirmation de réservation"
  subject       varchar NOT NULL,          -- objet du mail (éditable)
  intro_text    text,                      -- texte d'introduction (éditable)
  body_text     text,                      -- corps principal (éditable)
  signature_text text,                     -- signature (éditable)
  is_active     boolean DEFAULT true,
  created_at    timestamptz,
  updated_at    timestamptz
)
```

**Templates prévus (lignes initiales en DB) :**
| `template_key` | Nom affiché | Session |
|----------------|-------------|----------|
| `reservation_confirmation` | Confirmation de réservation | S134A |
| `reservation_cancellation` | Annulation de réservation | S134A |
| `reservation_modification` | Modification de créneau | S134A |
| `reminder_7d` | Rappel J-7 | S135 |
| `reminder_2d` | Rappel J-2 | S135 |

**Règle :** Les sujets actuellement dans `app_settings` (`email_confirmation_subject`, etc.) sont migrés dans la table `email_templates` et supprimés de `app_settings`.

**Nouveaux fichiers à créer :**
- `src/lib/services/email-templates.ts` — CRUD lecture/écriture DB
- `src/lib/types/email-templates.ts` — types TypeScript (`EmailTemplate`, `TemplateKey`)

**Onglet UI (S134B) :** Nouvel onglet "Templates" dans `/admin/settings/preferences`
- Liste des templates avec bouton [Modifier]
- Formulaire : subject, intro_text, body_text, signature_text
- Badge variables disponibles par template (`{{prénom}}`, `{{spectacle}}`, etc.)
- Apercu reporté à une session ultérieure
