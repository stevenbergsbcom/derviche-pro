# Conception — Intégration des IDs CRM (Zoho)

> **Statut** : ✅ **IMPLÉMENTÉ** — S174 mergé sur `main` (commit `dbc0ef6`), S175 mergé sur `main` (commit `6540a0c`).
> **Sessions livrées** : S174 (backend + saisie + héritage lecture seule) + S175 (colonnes configurables + exports + piège Excel)
> **Voir** : `docs/STATUT.md` pour le récap des livrables et la dette technique consciente.
> **Origine** : demande client — synchroniser la plateforme avec leur CRM Zoho

---

## Contexte et besoin

Le client travaille avec un CRM **Zoho**. Chaque lieu et chaque contact (professionnel)
y possède un identifiant unique. Le client veut pouvoir saisir ces identifiants dans
la plateforme et les retrouver dans les exports, pour faire le lien entre les données
de la plateforme et celles de son CRM.

Exemples réels d'IDs Zoho (17 chiffres) :
- ID Lieu : `70611000000487416`
- ID Contact : `70611000003153004`

---

## Décisions verrouillées

| Sujet | Décision | Justification |
|-------|----------|---------------|
| Type de colonne | `TEXT` (jamais INTEGER/BIGINT) | ID = identifiant, pas un nombre. Évite perte de zéros en tête, notation scientifique, et absorbe un futur changement de format CRM |
| ID pro dans réservation (avec compte) | Lecture seule, hérité de `profiles.crm_id` | Source de vérité unique = fiche pro. Évite la divergence des données |
| ID pro dans réservation (sans compte) | Éditable sur `reservations.crm_id` | Pas de fiche pro centrale → l'ID doit vivre sur la réservation |
| Unicité `venues.crm_id` | Stricte — index unique partiel `WHERE crm_id IS NOT NULL` | Évite les doublons de rattachement. Partiel car plusieurs lignes NULL doivent rester autorisées |
| Unicité `profiles.crm_id` | Stricte — index unique partiel `WHERE crm_id IS NOT NULL` | Idem |
| Unicité `reservations.crm_id` | **Aucune contrainte** | Un même pro sans compte peut réserver plusieurs spectacles → même ID légitimement répété |
| Validation format | Souple : numérique uniquement (`/^\d*$/`) + avertissement non bloquant | On évite les fautes de frappe évidentes sans imposer une longueur rigide qui bloquerait un cas légitime |
| Séparation adresse/CP/ville | À l'export UNIQUEMENT (tableaux inchangés) | C'est une préoccupation d'export, pas d'affichage. Limite la surface de modification |
| ID CRM dans les tableaux | Colonne configurable, masquée par défaut | Donnée métier lisible, l'admin l'active s'il le souhaite |
| UUID technique (Supabase) | Export UNIQUEMENT, jamais dans les tableaux | 36 caractères illisibles. Seule utilité = pont technique support, satisfaite par l'export |
| Piège Excel | Forcer le format texte dans le CSV pour les IDs 17 chiffres | Sinon Excel convertit en `7,06E+16` et corrompt la donnée à l'ouverture |

---

## Faits vérifiés dans le code

- **`venues`** : colonnes `address` / `city` / `postal_code` / `country` déjà séparées en base.
  La séparation adresse à l'export n'est donc PAS une migration — uniquement la génération CSV.
- **`profiles`** : table des professionnels. Colonnes adresse également séparées.
- **Réservation sans compte** : `reservations.user_id === null`. Infos du pro dans les
  colonnes `guest_*` (`guest_first_name`, `guest_email`, `guest_structure`, `guest_address`,
  `guest_postal_code`, `guest_city`, etc.).
- **Système de colonnes d'export** : type union `ReservationColumn`
  (`src/hooks/user-preferences/types.ts`) + config centralisée `RESERVATION_COLUMNS_CONFIG`
  (`src/hooks/user-preferences/constants.ts`), partagée entre liste admin, dialog d'export
  et liste compagnie (`CompanyReservationColumn`).
- **Adresse concaténée uniquement à l'affichage** : la concaténation se fait dans
  `getCellValue` (`src/components/admin/export-dialog/utils.ts`), via
  `[r.address, r.postalCode, r.city].filter(Boolean).join(' ')`. Les données sous-jacentes
  restent séparées.
- **Export réel** : situé dans `useAdminReservations.ts` (~15 KB) — à lire en ouverture
  de S175 (le fichier `export-dialog/utils.ts` ne gère que l'aperçu tronqué).

### ⚠️ Point d'attention repéré au passage
`src/types/database.ts` annonce en en-tête « Migrations : 001-072 » alors que la prod est
à 084+. L'en-tête de ce fichier est en retard sur la réalité — à corriger lors de la
cascade de typage (sans impact fonctionnel, mais source de confusion).

---

## Plan d'implémentation

### S174 — Backend (BDD + types + saisie)

1. **Migrations** (numéros à confirmer selon l'état réel post-084) :
   - `085_add_crm_id_to_venues.sql` : `ALTER TABLE venues ADD COLUMN crm_id TEXT;`
     + `CREATE UNIQUE INDEX venues_crm_id_unique ON venues (crm_id) WHERE crm_id IS NOT NULL;`
   - `086_add_crm_id_to_profiles.sql` : idem sur `profiles`
   - `087_add_crm_id_to_reservations.sql` : `ALTER TABLE reservations ADD COLUMN crm_id TEXT;`
     (PAS d'index unique)
2. **Cascade de typage** dans `database.ts` :
   - `VenueRow` / `VenueInsert` / `VenueUpdate` → `crm_id`
   - `ProfileRow` / `ProfileInsert` / `ProfileUpdate` → `crm_id`
   - `ReservationRow` / `ReservationInsert` / `ReservationUpdate` → `crm_id`
   - Corriger l'en-tête « Migrations : 001-072 »
3. **Champ de saisie `crm_id`** dans le formulaire lieu + formulaire pro
   (validation souple numérique + message d'avertissement).
4. **Champ `crm_id` éditable** dans la réservation sans compte (`user_id === null`).

### S175 — Affichage hérité + exports

5. **Affichage lecture seule** de `profiles.crm_id` dans la réservation avec compte
   (jointure, non éditable).
6. **Colonne CRM configurable** dans les tableaux (masquée par défaut) :
   ajout au type `ReservationColumn`, à `RESERVATION_COLUMNS_CONFIG`, à l'ordre par défaut.
7. **Export réservations** (`useAdminReservations.ts`) : ajouter
   - ID CRM pro (manuel)
   - ID CRM lieu (manuel)
   - UUID pro (technique)
   - UUID lieu (technique)
   - séparation adresse / CP / ville en 3 colonnes
8. **Export professionnels** : mêmes ajouts pertinents.
9. **Format texte CSV** forcé pour les IDs 17 chiffres (piège Excel).

---

## Rappel méthodo (pour l'implémentation)

- Fichiers via MCP Filesystem uniquement (`create_directory` avant `write_file` pour tout
  nouveau répertoire ; `edit_file` avec `oldText`/`newText` exacts).
- Migrations appliquées via Supabase Dashboard SQL Editor.
- Migrations appliquées = immuables → tout correctif = nouvelle migration.
- Qualité gate avant commit : `npm run type-check && npm run lint && npm run build`.
- Audit Cursor en fin de chaque session de code (cible ≥ 9/10).
- Commits préfixés `feat(S174):` / `feat(S175):`, sur `dev` puis merge `main --no-ff`.

---

*Fiche de conception rédigée en session de réflexion préalable. Aucune ligne de code écrite à ce stade.*
