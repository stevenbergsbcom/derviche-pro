# Conception — Intégration des IDs CRM (Zoho)

> **Statut** : ✅ **IMPLÉMENTÉ ET CORRIGÉ**
> **Sessions livrées** :
> - S174 + S175 (commits `dbc0ef6` + `6540a0c`) — implémentation initiale selon la compréhension erronée
> - Sessions A + B (commit merge `2941aa4`) — correction du malentendu client
> **Migrations appliquées** : 117 (venues.crm_id, supprimée par 120), 118 (profiles.crm_id), 119 (reservations.crm_id), **120 (drop venues.crm_id)**, **121 (profiles.crm_structure_id)**, **122 (reservations.crm_structure_id)**
> **Voir aussi** : `docs/STATUT.md` pour le récap des livrables et la dette technique consciente.
> **Origine** : demande client — synchroniser la plateforme avec leur CRM Zoho.

---

## ⚠️ Correction de compréhension (point de départ des sessions A et B)

**Ce qui avait été compris (FAUX) :**
> L'« ID CRM Lieu » correspondait aux lieux (salles) enregistrés sur la plateforme → stocké sur `venues.crm_id`.

**La réalité (CORRECT) :**
> L'« ID CRM Lieu » n'a **rien à voir** avec les salles de la plateforme. C'est l'identifiant Zoho de la **structure pour laquelle travaille le professionnel**. Il doit donc vivre **exactement aux mêmes endroits que l'ID CRM du pro** (fiche pro + réservation guest), et **jamais** sur `venues`.

**Conséquence :** un professionnel porte désormais **DEUX** identifiants CRM Zoho :
1. `crm_id` → identifiant du **contact** (la personne) dans Zoho. *(déjà implémenté, on garde)*
2. `crm_structure_id` → identifiant de la **structure / lieu** pour laquelle il travaille dans Zoho. *(nouveau)*

Les deux suivent **strictement la même logique** :
- Réservation **avec compte** (`user_id` renseigné) → valeur héritée de `profiles` en **lecture seule** dans la réservation (source de vérité = fiche pro).
- Réservation **sans compte** (`user_id IS NULL`) → valeur éditable directement sur `reservations`.

---

## Exemples réels d'IDs Zoho (17 chiffres)
- ID Lieu/structure : `70611000000487416`
- ID Contact (pro) : `70611000003153004`

---

## Décisions verrouillées

| Sujet | Décision |
|-------|----------|
| Type de colonne | `TEXT` (jamais INTEGER/BIGINT) |
| `venues.crm_id` | **SUPPRIMÉ** — DROP colonne + index (perte de données assumée, le champ résultait du malentendu) |
| `crm_id` (contact, sur profiles + reservations) | Conservé tel quel |
| `crm_structure_id` (nouveau, sur profiles + reservations) | Même logique que `crm_id` |
| Unicité `profiles.crm_id` | Stricte (index partiel) — conservée |
| Unicité `profiles.crm_structure_id` | **AUCUNE** — plusieurs pros peuvent dépendre de la même structure |
| Unicité `reservations.crm_id` et `reservations.crm_structure_id` | Aucune |
| Persistance sur réservation | UPDATE direct dans `mutations.ts` (PAS via RPC), avec garde `.is('user_id', null)` — pattern déjà en place pour `crm_id`, à répliquer |
| Validation format | Souple : numérique uniquement (composant `CrmIdInput` réutilisable) |
| Export — `crmIdVenue` | **SUPPRIMÉ** |
| Export — `venueUuid` (UUID salle) | **SUPPRIMÉ** (n'a plus de sens avec le glissement conceptuel du « lieu ») |
| Export — `crmIdStructure` | **AJOUTÉ** → label « ID CRM Zoho (structure) » |
| Export — `crmIdPro` + `userUuid` | Conservés |
| Affichage tableaux | Colonnes CRM configurables, masquées par défaut |
| Piège Excel | Forçage format texte conservé pour les IDs 17 chiffres |

---

## Cartographie du code existant (vérifiée)

- **Migrations CRM** : `117` (venues.crm_id), `118` (profiles.crm_id), `119` (reservations.crm_id). Dernière migration du projet = `119`.
- **Composant réutilisable** : `src/components/admin/crm-id-input.tsx` (`CrmIdInput`, label + helpText paramétrables) → réutilisable tel quel pour `crm_structure_id`.
- **Persistance réservation** : `src/lib/services/admin-reservations/mutations.ts` — `crm_id` écrit via UPDATE direct (blocage en édition / non-blocage en création), pas via RPC. → pas de nouvelle migration RPC nécessaire pour `crm_structure_id`.
- **Export** : type `ReservationColumn` (`src/hooks/user-preferences/types.ts`) + config (`.../constants.ts`) + labels (`src/hooks/admin-reservations/constants.ts` → `EXPORT_COLUMN_LABELS`) + valeurs (`src/hooks/admin-reservations/helpers/formatters.ts` → `getCellValue`).
- **Transformer** : `src/lib/services/admin-reservations/transformers.ts` — résout `crmId` (héritage `booked_by` pour les résas avec compte). À répliquer pour `crmStructureId`.

---

## Plan — SESSION A : Suppression de `venues.crm_id` et `venueUuid`

Opération isolée et à faible risque (pas de nouvelle donnée, on retire).

| # | Fichier | Action |
|---|---------|--------|
| A1 | `supabase/migrations/120_drop_crm_id_from_venues.sql` (nouveau) | `DROP INDEX IF EXISTS venues_crm_id_unique;` + `ALTER TABLE venues DROP COLUMN IF EXISTS crm_id;` |
| A2 | `src/types/database.ts` | Retirer `crm_id` de `VenueRow` / `VenueInsert` / `VenueUpdate` |
| A3 | `src/components/admin/lieux/venue-form-dialog.tsx` | Retirer : import `CrmIdInput`, `crm_id` de `defaultFormData`, `crm_id` du `setFormData` mode édition, le bloc JSX `<CrmIdInput>` |
| A4 | `src/hooks/user-preferences/types.ts` | Retirer `crmIdVenue` ET `venueUuid` du type `ReservationColumn` |
| A5 | `src/hooks/user-preferences/constants.ts` | Retirer les 2 colonnes de la config + de l'ordre par défaut |
| A6 | `src/hooks/admin-reservations/constants.ts` | Retirer `crmIdVenue` + `venueUuid` de `EXPORT_COLUMN_LABELS` |
| A7 | `src/hooks/admin-reservations/helpers/formatters.ts` | Retirer les `case 'crmIdVenue'` et `case 'venueUuid'` |
| A8 | `src/lib/services/admin-reservations/transformers.ts` + `types.ts` | Retirer le mapping `venue.crmId` (garder `venue.id`, utilisé ailleurs) |

Vérifier qu'aucun autre fichier ne référence `crmIdVenue` / `venueUuid` / `venue.crmId` (recherche globale).

---

## Plan — SESSION B : Ajout de `crm_structure_id`

Réplique du travail `crm_id` (profiles + reservations), sans toucher `venues`.

| # | Fichier | Action |
|---|---------|--------|
| B1 | `supabase/migrations/121_add_crm_structure_id_to_profiles.sql` | `ADD COLUMN crm_structure_id TEXT` — **sans index unique** |
| B2 | `supabase/migrations/122_add_crm_structure_id_to_reservations.sql` | `ADD COLUMN crm_structure_id TEXT` — sans unicité |
| B3 | `src/types/database.ts` | Ajouter `crm_structure_id` à `Profile*` + `Reservation*` |
| B4 | `src/components/admin/professionnels/ProfessionalEditForm.tsx` | 2ᵉ `<CrmIdInput>` (label « ID CRM structure ») + Zod + `defaultValues` + `normalizeFormValues` |
| B5 | `src/app/admin/professionnels/types.ts` | `crm_structure_id` dans `Professional` + `UpdateProfessionalData` |
| B6 | route API update profil pro | Ajouter `crm_structure_id` à la whitelist |
| B7 | `.../edit-reservation-dialog/.../ProfessionalInfoSection.tsx` + types + hook | 2ᵉ champ (éditable guest / lecture seule compte), comme `crmId` |
| B8 | `add-reservation-drawer` / `create-reservation-dialog` | Champ guest `crm_structure_id` |
| B9 | `src/lib/services/admin-reservations/mutations.ts` | UPDATE direct `crm_structure_id` dans `updateReservation` (bloquant) ET `createAdminReservation` (non-bloquant) — même pattern + garde `.is('user_id', null)` |
| B10 | `src/lib/services/admin-reservations/transformers.ts` + `types.ts` | Résoudre `crmStructureId` (guest → reservation ; compte → `booked_by.crm_structure_id`) |
| B11 | `src/hooks/user-preferences/types.ts` + `constants.ts` | Ajouter colonne `crmIdStructure` (config + ordre) |
| B12 | `src/hooks/admin-reservations/constants.ts` | `crmIdStructure` → « ID CRM Zoho (structure) » dans `EXPORT_COLUMN_LABELS` |
| B13 | `src/hooks/admin-reservations/helpers/formatters.ts` | `case 'crmIdStructure'` → valeur résolue |

---

## Rappel méthodo

- Fichiers via MCP Filesystem uniquement (`create_directory` avant `write_file`).
- Migrations appliquées via Supabase Dashboard SQL Editor ; migrations appliquées = immuables.
- Qualité gate avant commit : `npm run type-check && npm run lint && npm run build`.
- Audit Cursor en fin de chaque session (cible ≥ 9/10).
- Commits préfixés selon la session, sur `dev` puis merge `main --no-ff`.

---

*Fiche mise à jour après identification de l'erreur de compréhension client. Sessions A et B à implémenter.*
