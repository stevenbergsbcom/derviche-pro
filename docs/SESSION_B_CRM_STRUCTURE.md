# Session B — Ajout de `crm_structure_id` (structure du pro)

> **Type** : ajout de fonctionnalité (réplique du pattern `crm_id` existant)
> **Risque** : moyen (touche profiles + reservations + export + 3 formulaires)
> **Prérequis** : Session A (`docs/SESSION_A_CRM_SUPPRESSION_VENUE.md`) doit être faite d'abord
> **Référence** : `docs/CONCEPTION_CRM_IDS.md` pour le contexte complet

---

## Contexte (à lire avant de coder)

Suite à la correction du malentendu client (cf. Session A), un professionnel porte
désormais **DEUX** identifiants CRM Zoho :

1. `crm_id` → identifiant du **contact** (la personne) dans Zoho. **DÉJÀ IMPLÉMENTÉ**
   (migrations 117-119, S174/S175). On ne le retouche pas.
2. `crm_structure_id` → identifiant de la **structure / lieu** pour laquelle travaille
   le pro dans Zoho. **C'EST L'OBJET DE CETTE SESSION B.**

Le nouveau champ `crm_structure_id` doit se comporter **exactement comme `crm_id`** :
- même composant de saisie réutilisable `CrmIdInput`
- mêmes emplacements (fiche pro, dialog édition résa, dialog création résa)
- même logique d'héritage : réservation **avec compte** → valeur héritée de `profiles`
  en **lecture seule** ; réservation **sans compte** (`user_id IS NULL`) → éditable sur
  `reservations`
- même persistance : UPDATE direct dans `mutations.ts` (PAS via RPC), avec garde
  `.is('user_id', null)`

**La meilleure méthode : repérer chaque endroit où `crm_id` / `crmId` est utilisé
pour le pro, et ajouter le pendant `crm_structure_id` / `crmStructureId` juste à côté.**

---

## Décisions verrouillées pour cette session

- Colonne `profiles.crm_structure_id` TEXT — **SANS index unique** (plusieurs pros
  peuvent dépendre de la même structure → l'ID se répète légitimement).
- Colonne `reservations.crm_structure_id` TEXT — sans unicité.
- Validation format : souple, numérique uniquement → réutiliser le composant
  `CrmIdInput` existant (`src/components/admin/crm-id-input.tsx`) avec un `label` et
  `helpText` adaptés à la « structure ».
- Export : nouvelle colonne `crmIdStructure` → label « ID CRM Zoho (structure) ».
- Colonnes CRM dans les tableaux : configurables, masquées par défaut.

---

## Périmètre exact — fichiers à modifier

### B1 — Migration profiles (NE PAS appliquer automatiquement)

Créer `supabase/migrations/121_add_crm_structure_id_to_profiles.sql` :

```sql
-- ============================================
-- Migration 121 : Ajout profiles.crm_structure_id
-- Derviche Diffusion — structure CRM du professionnel
-- ============================================
-- Second identifiant Zoho porté par le pro : l'ID de la STRUCTURE pour
-- laquelle il travaille (distinct de crm_id qui identifie le contact).
--   • Type TEXT (cohérent avec crm_id).
--   • AUCUNE contrainte d'unicité : plusieurs professionnels peuvent
--     dépendre de la même structure → le même ID se répétera. Attendu.
--   • Validation format côté UI uniquement (souple, numérique).
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crm_structure_id TEXT;

COMMENT ON COLUMN public.profiles.crm_structure_id
  IS 'Identifiant de la structure du professionnel dans le CRM Zoho (~17 chiffres). TEXT, pas d''unicité (plusieurs pros peuvent partager une structure). Source de vérité pour les réservations liées à un compte.';
```

### B2 — Migration reservations (NE PAS appliquer automatiquement)

Créer `supabase/migrations/122_add_crm_structure_id_to_reservations.sql` :

```sql
-- ============================================
-- Migration 122 : Ajout reservations.crm_structure_id
-- Derviche Diffusion — structure CRM (réservations guest)
-- ============================================
-- Pendant de reservations.crm_id (migration 119) pour la structure.
-- Utilisé uniquement pour les réservations sans compte (user_id IS NULL) ;
-- pour les résas avec compte, lire profiles.crm_structure_id via jointure.
--   • Type TEXT, aucune contrainte d'unicité.
-- ============================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS crm_structure_id TEXT;

COMMENT ON COLUMN public.reservations.crm_structure_id
  IS 'Identifiant CRM Zoho de la structure du pro, pour les réservations guest (user_id IS NULL). Pas d''unicité. Pour les résas avec compte, lire profiles.crm_structure_id via jointure.';
```

> ⚠️ Ne PAS exécuter ces migrations. Steven les appliquera manuellement dans le
> Supabase SQL Editor.

### B3 — `src/types/database.ts`

Ajouter `crm_structure_id: string | null` (ou la forme cohérente avec les autres
colonnes nullable du fichier) à :
- `ProfileRow`, `ProfileInsert`, `ProfileUpdate`
- `ReservationRow`, `ReservationInsert`, `ReservationUpdate`

Modèle : faire exactement comme `crm_id` existe déjà sur ces interfaces, et ajouter
`crm_structure_id` juste en dessous.

### B4 — `src/components/admin/professionnels/ProfessionalEditForm.tsx`

Le champ `crm_id` y existe déjà via `<CrmIdInput>`. Ajouter le pendant
`crm_structure_id` juste après :
- ajouter `crm_structure_id` au schéma Zod (même regex `^\d*$`, optional, nullable)
- ajouter `crm_structure_id` dans `defaultValues` (`professional.crm_structure_id ?? ''`)
- ajouter `crm_structure_id` dans `normalizeFormValues`
- ajouter un second `<FormField name="crm_structure_id">` avec `<CrmIdInput>` :
  - `label="ID CRM structure (Zoho)"`
  - `helpText="Identifiant de la structure pour laquelle travaille le professionnel dans votre CRM Zoho (~17 chiffres). Optionnel."`

### B5 — `src/app/admin/professionnels/types.ts`

Ajouter `crm_structure_id: string | null` à l'interface du professionnel
(`Professional` ou équivalent) ET à `UpdateProfessionalData`. Repérer où `crm_id`
est déclaré et ajouter à côté.

### B6 — Route API de mise à jour du profil pro

Repérer la route handler qui met à jour le profil (probablement
`src/app/api/admin/professionals/[id]/route.ts` ou équivalent). Ajouter
`crm_structure_id` à la whitelist des champs autorisés en update, exactement comme
`crm_id` y figure déjà.

### B7 — Dialog d'édition de réservation : `ProfessionalInfoSection.tsx`

Fichier : `src/components/admin/reservations/edit-reservation-dialog/components/ProfessionalInfoSection.tsx`

Le champ `crmId` y a déjà la logique éditable (guest) / lecture seule (compte).
Ajouter `crmStructureId` avec **exactement la même logique** :
- nouvelle prop `crmStructureId` dans `ProfessionalInfoSectionProps` (types.ts du dialog)
- bloc identique à celui de `crmId` :
  - si `isGuest` → `<CrmIdInput value={crmStructureId} onChange={(v) => onChange('crmStructureId', v)} label="ID CRM structure (Zoho)" />`
  - sinon → champ lecture seule (Lock + Info), label « ID CRM structure (Zoho) »,
    texte « Hérité de la fiche du professionnel. »
- propager `crmStructureId` dans le hook `useEditReservation.ts` (état + onChange +
  valeur initiale issue de la réservation) et dans les types du dialog.

### B8 — Dialog de création de réservation (walk-in + admin)

Repérer où `crmId` est saisi pour une résa guest dans le flux de création
(`add-reservation-drawer` côté PWA et/ou `create-reservation-dialog` côté admin).
Ajouter le champ `crm_structure_id` guest au même endroit, avec `<CrmIdInput>` et le
label structure. Propager dans le type `CreateAdminReservationData`.

### B9 — `src/lib/services/admin-reservations/mutations.ts`

Le fichier contient déjà un UPDATE direct de `crm_id` dans `updateReservation`
(bloquant) et `createAdminReservation` (non-bloquant), avec la garde
`.is('user_id', null)`. **Répliquer ce pattern pour `crm_structure_id`** :
- dans `updateReservation` : si `data.crmStructureId !== undefined`, faire l'UPDATE
  direct de `crm_structure_id` avec la même garde `.is('user_id', null)` et le même
  traitement d'erreur bloquant. Idéalement, combiner avec l'UPDATE crm_id existant en
  un seul `.update({ crm_id, crm_structure_id })` quand les deux sont présents, pour
  éviter deux requêtes.
- dans `createAdminReservation` : même logique non-bloquante que `crm_id`.
- propager `crmStructureId` dans les types `UpdateReservationData` et
  `CreateAdminReservationData` (`src/lib/services/admin-reservations/types.ts`).

### B10 — `src/lib/services/admin-reservations/transformers.ts` + `types.ts`

Le transformer résout déjà `crmId` (héritage : résa guest → `reservations.crm_id` ;
résa avec compte → `booked_by.crm_id` via la jointure profil). **Répliquer pour
`crmStructureId`** :
- ajouter `crmStructureId` au type `AdminReservation`
- dans le transformer, résoudre `crmStructureId` exactement comme `crmId` :
  `reservation.crm_structure_id ?? bookedByProfile?.crm_structure_id ?? null`
  (reprendre la formule exacte utilisée pour crmId).
- s'assurer que la jointure `booked_by` (ou équivalent) sélectionne bien
  `crm_structure_id` en plus de `crm_id` (vérifier le SELECT dans list.ts / detail.ts).

⚠️ Point d'attention : si le SELECT du profil joint ne récupère pas
`crm_structure_id`, l'héritage renverra toujours null. Vérifier les `select(...)`
dans `list.ts` et `detail.ts` et y ajouter `crm_structure_id`.

### B11 — `src/hooks/user-preferences/types.ts` + `constants.ts`

- types.ts : ajouter `'crmIdStructure'` au type union `ReservationColumn`.
- constants.ts : ajouter la config de la colonne `crmIdStructure` (masquée par défaut,
  comme `crmIdPro`) et l'inclure dans l'ordre par défaut au bon endroit (à côté de
  `crmIdPro`).

### B12 — `src/hooks/admin-reservations/constants.ts`

Dans `EXPORT_COLUMN_LABELS`, ajouter :
```
crmIdStructure: 'ID CRM Zoho (structure)',
```
à placer logiquement à côté de `crmIdPro`.

### B13 — `src/hooks/admin-reservations/helpers/formatters.ts`

Dans `getCellValue`, ajouter :
```
case 'crmIdStructure':
  return r.crmStructureId ?? '-';
```
(en cohérence avec `case 'crmIdPro': return r.crmId ?? '-';`)

---

## Vérification finale (obligatoire)

Recherche globale pour confirmer la cohérence — `crm_structure_id` et
`crmStructureId` doivent apparaître dans : database.ts, ProfessionalEditForm,
professionnels/types, route API pro, ProfessionalInfoSection + types/hook du dialog
édition, dialog création + son type, mutations.ts, transformers.ts + types,
user-preferences types + constants, admin-reservations constants + formatters.

Quality gate :
```
npm run type-check && npm run lint && npm run build
```
Corriger jusqu'à ce que les trois passent.

---

## Tests manuels (après application des migrations 121 + 122)

1. **Fiche pro** : Admin → Professionnels → éditer un pro → les DEUX champs CRM sont
   présents (« ID CRM (Zoho) » contact + « ID CRM structure (Zoho) »). Saisir une
   valeur structure, enregistrer, rouvrir → valeur persistée.
2. **Réservation AVEC compte** : ouvrir une résa d'un pro connecté → les deux IDs CRM
   s'affichent en **lecture seule**, hérités de la fiche pro (cadenas + texte d'aide).
3. **Réservation SANS compte (guest)** : ouvrir/éditer une résa guest → les deux IDs
   CRM sont **éditables**. Saisir une valeur structure, enregistrer → persistée.
4. **Création guest** : créer une résa guest avec un ID CRM structure → présent ensuite
   dans le dialog d'édition.
5. **Export** : exporter les réservations → colonne « ID CRM Zoho (structure) » présente
   et correctement remplie (héritée pour les comptes, directe pour les guests).
6. Vérifier que l'ID structure n'est PAS bloqué par une unicité (créer deux pros avec
   le même `crm_structure_id` doit fonctionner).

---

## Git (NE PAS exécuter automatiquement — Steven s'en charge)

Branche `dev`. Commit suggéré :
```
feat(SXXX): ajout crm_structure_id (ID CRM structure du pro) sur profils, réservations et exports
```
Après validation des tests des DEUX sessions (A + B), merge `dev` → `main --no-ff`
pour livrer la correction complète d'un seul bloc.
