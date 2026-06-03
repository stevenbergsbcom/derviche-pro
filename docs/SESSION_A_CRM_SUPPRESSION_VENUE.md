# Session A — Suppression de `venues.crm_id` et `venueUuid`

> **Type** : correction (suppression de code/colonnes issus d'un malentendu client)
> **Risque** : faible (on retire, aucune nouvelle donnée)
> **Prérequis** : lire aussi `docs/CONCEPTION_CRM_IDS.md` pour le contexte complet
> **À faire APRÈS** : Session B (`docs/SESSION_B_CRM_STRUCTURE.md`)

---

## Contexte (à lire avant de coder)

Une erreur de compréhension client a été identifiée après livraison de S174/S175.

**Ce qui avait été compris (FAUX)** : l'« ID CRM Lieu » correspondait aux salles
enregistrées sur la plateforme → stocké sur `venues.crm_id`.

**La réalité (CORRECT)** : l'« ID CRM Lieu » n'a rien à voir avec les salles. C'est
l'identifiant Zoho de la **structure pour laquelle travaille le professionnel**. Il
sera donc déplacé vers `profiles.crm_structure_id` + `reservations.crm_structure_id`
en **Session B**.

**Cette Session A se contente de SUPPRIMER** tout ce qui rattachait un ID CRM aux
salles (`venues.crm_id`), ainsi que la colonne d'export `venueUuid` (UUID technique
de salle) qui n'a plus de sens avec ce glissement conceptuel.

⚠️ Le champ `crm_id` du **pro** (`profiles.crm_id`) et de la **réservation guest**
(`reservations.crm_id`) NE DOIT PAS être touché — il reste valide (c'est l'ID du
contact, pas du lieu). On ne touche QUE ce qui concerne `venues` et `venueUuid`.

---

## Décisions verrouillées pour cette session

- `venues.crm_id` → **DROP** colonne + index (perte de données assumée par le client).
- `venueUuid` (colonne d'export = UUID de la salle) → **retiré de l'export**.
- `venue.id` (UUID de salle utilisé partout ailleurs dans l'app) → **CONSERVÉ**.
- `crmIdPro` et `userUuid` dans l'export → **CONSERVÉS** (concernent le pro, pas le lieu).

---

## Périmètre exact — fichiers à modifier

### A1 — Migration SQL (NE PAS appliquer automatiquement)

Créer le fichier `supabase/migrations/120_drop_crm_id_from_venues.sql` avec ce contenu :

```sql
-- ============================================
-- Migration 120 : Suppression de venues.crm_id
-- Derviche Diffusion — correction malentendu CRM "lieu"
-- ============================================
-- L'ID CRM "lieu" (migration 117) résultait d'une erreur de compréhension :
-- il ne concernait pas les salles (venues) mais la structure pour laquelle
-- travaille le professionnel. Cette information est déplacée vers
-- profiles.crm_structure_id + reservations.crm_structure_id (Session B).
-- On supprime donc proprement la colonne et son index unique partiel.
-- Perte de données assumée (champ récent issu du malentendu).
-- ============================================

DROP INDEX IF EXISTS venues_crm_id_unique;

ALTER TABLE public.venues
  DROP COLUMN IF EXISTS crm_id;
```

> ⚠️ Ne PAS exécuter cette migration. Steven l'appliquera manuellement dans le
> Supabase SQL Editor. Le code doit juste être cohérent avec son application.

### A2 — `src/types/database.ts`

Retirer `crm_id` des trois interfaces du type `venues` : `VenueRow`, `VenueInsert`,
`VenueUpdate`.

### A3 — `src/components/admin/lieux/venue-form-dialog.tsx`

Retirer **tout** ce qui concerne `crm_id` :
- l'import `import { CrmIdInput } from '@/components/admin/crm-id-input';`
- la clé `crm_id: null,` dans `defaultFormData`
- la clé `crm_id: editingVenue.crm_id ?? null,` dans le `setFormData` du mode édition
- le bloc JSX complet `<CrmIdInput ... />` avec son commentaire `{/* ID CRM Zoho ... */}`

### A4 — `src/hooks/user-preferences/types.ts`

Dans le type union `ReservationColumn`, retirer les deux membres `'crmIdVenue'` et
`'venueUuid'`. CONSERVER `'crmIdPro'` et `'userUuid'`.

### A5 — `src/hooks/user-preferences/constants.ts`

Retirer les entrées correspondant à `crmIdVenue` et `venueUuid` :
- de l'objet de configuration des colonnes (RESERVATION_COLUMNS_CONFIG ou équivalent)
- de tout tableau d'ordre par défaut où elles apparaissent

### A6 — `src/hooks/admin-reservations/constants.ts`

Dans `EXPORT_COLUMN_LABELS`, retirer les deux lignes :
- `crmIdVenue: 'ID CRM Zoho (lieu)',`
- `venueUuid: 'UUID lieu (technique)',`

CONSERVER `crmIdPro` et `userUuid`.

### A7 — `src/hooks/admin-reservations/helpers/formatters.ts`

Dans `getCellValue`, retirer les deux `case` :
- `case 'crmIdVenue': return r.slot?.venue?.crmId ?? '-';`
- `case 'venueUuid': return r.slot?.venue?.id ?? '-';`

CONSERVER `case 'crmIdPro'` et `case 'userUuid'`.

### A8 — `src/lib/services/admin-reservations/transformers.ts` + `types.ts`

Retirer le mapping du champ `crmId` sur l'objet venue (la propriété `crmId` rattachée
au lieu dans le type venue interne, et son affectation dans le transformer).

⚠️ CONSERVER absolument `venue.id` (l'UUID de salle utilisé dans toute l'application
pour identifier le lieu) — on ne retire QUE la propriété `crmId` du venue.

---

## Vérification finale (obligatoire)

Lancer une recherche globale sur le projet pour ces 3 chaînes et confirmer qu'il ne
reste **AUCUNE** référence (hors migrations historiques 117/118/119 qui sont immuables) :
- `crmIdVenue`
- `venueUuid`
- `venue.crmId` / `venue?.crmId` / `.crmId` sur un objet venue

Puis lancer la quality gate :
```
npm run type-check && npm run lint && npm run build
```
Corriger toute erreur jusqu'à ce que les trois passent.

---

## Tests manuels (après application de la migration 120)

1. Admin → Lieux → modifier un lieu → le champ « ID CRM » a disparu.
2. Admin → Réservations → exporter → les colonnes « ID CRM Zoho (lieu) » et
   « UUID lieu (technique) » ont disparu du fichier exporté.
3. La colonne « Lieu » (nom de la salle) fonctionne toujours normalement à l'écran
   et à l'export.
4. Aucune régression sur l'export (les autres colonnes restent correctes).

---

## Git (NE PAS exécuter automatiquement — Steven s'en charge)

Branche de travail : `dev`. Commit suggéré :
```
fix(SXXX): suppression venues.crm_id + venueUuid export (correction malentendu CRM lieu)
```
> Ne PAS merger sur `main` à la fin de la Session A : le merge se fera après la
> Session B, pour livrer la correction complète (suppression + remplacement) d'un
> seul bloc et éviter un état intermédiaire incohérent.
