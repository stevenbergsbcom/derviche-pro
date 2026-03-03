# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 134B — 3 mars 2026

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
| Préférences | ✅ Organisation, Apparence, Email, Notifications, Rappels, **Templates** ✅ S134B, RGPD |

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

### ✅ Templates email dynamiques (100%) — S134A + S134B
- Table `email_templates` (migration 051) avec 4 templates en DB
- Champs éditables : `subject`, `intro_text`, `body_text`, `info_text`, `header_title`, `salutation`, `cta_text`, `contact_block_title`
- Champs booléens : `show_contact_block`, `show_reservation_code`, `is_active`
- Service `email-templates.ts` : `getEmailTemplate()`, `resolveTemplateVariables()`, `textToHtml()`
- Service `email.ts` : refonte complète — tous les builders lisent les champs depuis DB
- **UI admin : onglet "Templates" dans /admin/preferences — S134B** ✅
- **Score audit S134A : 10/10**
- **⚠️ Audit S134B : NON ENCORE FAIT — à faire en priorité en début de session suivante**

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export CSV natif pour professionnels (sans dépendance xlsx/exceljs)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Session 134B)

**UI admin édition templates email :**

### Nouveaux fichiers créés
- `src/app/admin/preferences/components/EmailPreviewModal.tsx` — Dialog avec iframe pour aperçu HTML live du template via route API
- `src/app/admin/preferences/components/EmailTemplateForm.tsx` — Formulaire Zod/RHF complet : objet, en-tête, intro, corps, info, CTA, toggles, salutation (en dernier = avant signature). Badges variables cliquables avec insertion au curseur.
- `src/app/admin/preferences/components/sections/templates-section.tsx` — 4 accordéons dépliables (1 par template), badge "Non sauvegardé", chargement parallèle via Promise.all

### Fichiers modifiés
- `src/app/admin/preferences/components/preferences-tabs.tsx` — Ajout onglet "Templates" (FileText icon, statut Actif) positionné **après Email** (4ème), 7 onglets total, grille `lg:grid-cols-7`, `h-auto` sur TabsList, `cursor-pointer` sur triggers
- `src/app/admin/preferences/components/preferences-content.tsx` — Import + rendu `EmailTemplatesSection`, callback `handleTemplatesDirty`
- `src/app/admin/preferences/components/sections/index.ts` — Export `EmailTemplatesSection`
- `src/components/ui/accordion.tsx` — Ajout `cursor-pointer` sur `AccordionTrigger` (Radix UI écrasait cursor-default sinon)
- `src/app/api/admin/email-templates/[key]/route.ts` — Fix Zod `.issues` (pas `.errors`)
- `src/lib/services/email-templates.ts` — Ajout champ `événement?` dans `EmailTemplateVariables` + `resolveTemplateVariables`
- `src/app/api/admin/email-templates/[key]/preview/route.ts` — Suppression import `NextResponse` inutilisé, ajout `{{événement}}` dans PREVIEW_VARS, salutation rendue **juste avant la signature** (pas avant l'intro)

### Routes API (créées en S134B Tâche 1)
- `GET /api/admin/email-templates/[key]` — Lecture d'un template par clé
- `PATCH /api/admin/email-templates/[key]` — Mise à jour des champs éditables
- `GET /api/admin/email-templates/[key]/preview` — Génération HTML avec données fictives (query params pour preview live)

### Composants installés
- `shadcn/ui accordion` — installé via `npx shadcn@latest add accordion`

### Bugs UX corrigés
- Onglet Templates déplacé après Email (était après Notifications)
- `cursor-pointer` sur accordéons (fix dans `accordion.tsx` shadcn)
- Dernier accordéon sans border-b → `last:!border-b` (écrase `last:border-b-0` de shadcn)
- `h-auto` sur TabsList pour éviter le clipping des triggers sur 2 lignes
- 2 croix de fermeture dans EmailPreviewModal → supprimé le bouton X manuel (DialogContent en fournit un natif)
- Salutation placée en dernier dans le formulaire ET dans le HTML preview (juste avant signature)

**Commits mergés sur main :**
- `feat(S134B): UI admin édition templates email`

---

## Travail précédent (Session 134A)

**Templates email dynamiques depuis DB :**
- Migration 051, service `email-templates.ts`, refonte `email.ts`, module `format-date.ts`
- **Score audit : 10/10**

---

## Travail précédent (Session 133)

**Audit app_settings + nettoyage préférences :**
- Migration 050 : `theme_preset`, `logo_white_url`, `logo_dark_url`, `organization_address`
- Section Email : 7 champs
- **Score audit : 8.3/10**

---

## À faire (prochaines sessions)

### ⚡ IMMÉDIAT — Début de prochaine session

1. **Faire l'audit Cursor** sur le travail S134B (UI Templates) — pas encore fait
2. **Refactoring `email.ts`** — fichier de **46 Ko / ~850 lignes** à découper en modules

### Plan de refactoring `email.ts` (décidé en S134B)

Le fichier `src/lib/services/email.ts` est trop volumineux. Structure cible :

```
src/lib/services/email/
├── index.ts                    ← point d'entrée, exporte les 4 fonctions send...()
├── types.ts                    ← toutes les interfaces (ReservationConfirmationEmailData, etc.)
├── config.ts                   ← getEmailConfig() — lecture app_settings
├── html-helpers.ts             ← escapeHtml, extractFirstName, build*Block (blocs partagés)
├── fallbacks.ts                ← getFallbackTemplate() pour les 4 templates
└── builders/
    ├── confirmation.ts         ← buildConfirmationHtml()
    ├── cancellation.ts         ← buildCancellationHtml()
    ├── modification.ts         ← buildModificationHtml()
    └── admin-notification.ts   ← buildAdminNotificationHtml()
```

**Règles du refactoring :**
- Zéro changement fonctionnel — uniquement découpage
- Les imports depuis `@/lib/services/email` doivent continuer à fonctionner (via `index.ts`)
- Vérifier `npm run type-check && npm run lint && npm run build` après
- Merger sur main après validation

### Sessions planifiées (après refactoring)

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S135** | Rappels automatiques J-7/J-2 (Vercel Cron ou Supabase pg_cron) | 🟠 Moyenne |
| **S136** | Système notifications admin (badge lu/non-lu, table `admin_notifications`) | 🟡 Basse |
| **S137** | RGPD suppression compte | 🟡 Basse |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Description | Priorité |
|---------|-------------|----------|
| `email.ts` | Fichier 46 Ko / ~850 lignes — refactoring en modules planifié (prochaine session) | 🔴 Haute |
| `email_catalogue_url` en DB | Pointe encore Vercel, pas `derviche-pro.fr/catalogue` | 🟠 À corriger |
| `organization_logo_url` | Doublon à supprimer (remplacé par onglet Apparence migration 050) | 🟡 Basse |
| Rappels admin | `reminder_enabled_7d/2d/12h` stockés mais aucun job planifié | 🟠 S135 |
| RGPD | Durées de conservation stockées mais aucune purge automatique | 🟡 S137 |
| **Audit S134B** | UI Templates — audit Cursor pas encore fait | 🔴 À faire immédiatement |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/lib/services/email.ts` | 46 Ko — à refactoriser en `src/lib/services/email/` (plan ci-dessus) |
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement (shadcn ne l'inclut pas par défaut) |
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `app_settings` (DB) | `email_catalogue_url` pointe Vercel → à corriger vers `derviche-pro.fr` |
