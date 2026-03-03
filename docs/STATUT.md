# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 134B-suite — 3 mars 2026

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
- Rapatriement réservations guest (GuestReservationsBanner)
- /professional/reservations : liste réservations à venir + historique
- Changement de créneau en self-service (ProChangeSlotDialog)

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations, statistiques, export
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

### ✅ Templates email dynamiques (100%) — S134A + S134B + S134B-suite
- Table `email_templates` (migration 051) avec 4 templates en DB
- Champs éditables : `subject`, `intro_text`, `body_text`, `info_text`, `header_title`, `salutation`, `cta_text`, `contact_block_title`
- Champs booléens : `show_contact_block`, `show_reservation_code`, `is_active`
- Service `email-templates.ts` : `getEmailTemplate()`, `resolveTemplateVariables()`, `textToHtml()`
- **Service email refactorisé → 8 modules** (`src/lib/services/email/`) — score audit 9/10
- **UI admin : onglet "Templates" dans /admin/preferences** ✅
- **⚠️ Relecture des templates en DB souhaitée** — voir section "À faire"

---

## Dernier travail (Session 134B-suite — 3 mars 2026)

### Corrections post-audit S134B

| Fichier | Bug | Fix |
|---------|-----|-----|
| `EmailPreviewModal.tsx` | Pas de timeout si iframe silencieuse | Timeout 10s + `role="alert"` |
| `EmailTemplateForm.tsx` | Double `register()` sur 4 champs RHF | Destructuration avant `return` |
| `EmailTemplateForm.tsx` | `focusProps` typé `string` | Typé `keyof TemplateFormValues` ✅ |
| `templates-section.tsx` | `res.json()` sans vérifier `res.ok` | Vérification `if (!res.ok)` |
| `preview/route.ts` | Regex `\$&` invalide → variables non substituées | `escapeRegExp()` avec callback arrow |
| `email-templates.ts` | `{{événement}}` absent des badges UI | Ajout dans `EMAIL_TEMPLATE_VARIABLES` |

### Refactoring `email.ts` → 8 modules (score audit 9/10)

```
src/lib/services/email/
├── index.ts              ← 4 fonctions send...() + re-exports types
├── types.ts              ← toutes les interfaces
├── config.ts             ← getEmailConfig() depuis app_settings
├── html-helpers.ts       ← escapeHtml, extractFirstName, build*Block
├── fallbacks.ts          ← getFallbackTemplate()
└── builders/
    ├── confirmation.ts
    ├── cancellation.ts
    ├── modification.ts
    └── admin-notification.ts
```

**Règle respectée :** imports depuis `@/lib/services/email` inchangés (résolution via `index.ts`).
**Build :** ✅ `type-check && lint && build` passent.

---

## À faire (prochaines sessions)

### ⚡ IMMÉDIAT — Début de S135

1. **Relecture des templates email en DB** — Après le refactoring des builders HTML,
   il faut vérifier que le contenu par défaut des 4 templates (`subject`, `intro_text`, etc.)
   est cohérent avec la nouvelle structure et les nouvelles variables disponibles.
   → Ouvrir `/admin/preferences` → onglet Templates → passer en revue les 4 templates.

2. **S135 : Rappels automatiques J-7/J-2** (Vercel Cron)

### Sessions planifiées

| Session | Objectif | Priorité |
|---------|----------|----------|
| **S135** | Rappels automatiques J-7/J-2 (Vercel Cron) | 🟠 Haute |
| **S136** | Système notifications admin (badge lu/non-lu) | 🟡 Moyenne |
| **S137** | RGPD suppression compte | 🟡 Basse |

---

## ⚠️ DETTE TECHNIQUE

| Élément | Fichier | Description | Priorité |
|---------|---------|-------------|----------|
| Zod sur query params | `preview/route.ts` | Pas de validation Zod sur les query params (admin uniquement, risque faible) | 🟡 Basse |
| `email_catalogue_url` en DB | `app_settings` | Pointe encore Vercel, pas `derviche-pro.fr/catalogue` | 🟠 À corriger |
| `organization_logo_url` | DB | Doublon à supprimer (remplacé par onglet Apparence migration 050) | 🟡 Basse |
| Rappels auto | — | `reminder_enabled_7d/2d/12h` stockés, aucun job planifié | 🟠 S135 |
| RGPD | — | Durées de conservation stockées, aucune purge automatique | 🟡 S137 |
| Relecture templates DB | `/admin/preferences` → Templates | Vérifier cohérence contenu après refactoring builders | 🟠 S135 |
| Factorisation builders | `src/lib/services/email/builders/` | Pattern résolution template dupliqué entre builders (acceptable, à factoriser si nouveaux types d'emails) | 🟡 Basse |
| Types variables sujet admin | `types/email-templates.ts` | Interface dédiée pour variables sujet `admin_notification` (actuellement `EmailTemplateVariables` générique) | 🟡 Basse |

---

## Points d'attention techniques

| Fichier | Description |
|---------|-------------|
| `src/components/ui/accordion.tsx` | `cursor-pointer` ajouté manuellement (shadcn ne l'inclut pas) |
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `lib/utils/export-professionals.ts` | Export CSV uniquement — xlsx/exceljs exclus (vulnérabilités sans fix) |
| `app_settings` (DB) | `email_catalogue_url` pointe Vercel → à corriger vers `derviche-pro.fr` |
| `src/lib/services/email/` | `index.ts` re-exporte tous les types de `types.ts` pour compatibilité imports existants |
