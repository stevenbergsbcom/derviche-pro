# 📋 Cahier des Charges - Mise à jour V4

**Date** : 23 décembre 2025  
**Version** : 4.0  
**Statut** : À valider  
**Basé sur** : Version 3.0 du 27 novembre 2025 + Sessions 1-19

---

## 📑 SOMMAIRE

1. [Résumé des modifications](#1-résumé-des-modifications)
2. [Modifications par table](#2-modifications-par-table)
3. [Nouvelles tables](#3-nouvelles-tables)
4. [Types TypeScript mis à jour](#4-types-typescript-mis-à-jour)
5. [Impact sur les interfaces](#5-impact-sur-les-interfaces)
6. [Migrations SQL à créer](#6-migrations-sql-à-créer)

---

## 1. Résumé des modifications

### 1.1 Vue d'ensemble

| Table | Champs ajoutés | Champs modifiés | Champs supprimés |
|-------|---------------|-----------------|------------------|
| `venues` | +4 | 0 | 0 |
| `shows` | +8 | 0 | 0 |
| `companies` | +2 | 0 | 0 |
| `slots` | +1 | 0 | 0 |
| `reservations` | +5 | 0 | 0 |
| **NOUVELLE** `target_audiences` | Table complète | - | - |
| **NOUVELLE** `show_target_audience_mapping` | Table complète | - | - |

**Total** : +20 champs + 2 nouvelles tables

### 1.2 Raisons des modifications

Ces modifications ont été identifiées lors du développement des interfaces admin (sessions 11-19) :
- Besoins métier non anticipés dans la V3
- Amélioration de l'expérience utilisateur
- Conformité avec les pratiques de Derviche Diffusion

---

## 2. Modifications par table

### 2.1 Table `venues` (Lieux)

#### Champs à ajouter

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `capacity` | INTEGER | OUI | NULL | Capacité maximale de la salle |
| `pmr_accessible` | BOOLEAN | NON | false | Accessibilité PMR (Personnes à Mobilité Réduite) |
| `parking` | BOOLEAN | NON | false | Parking disponible à proximité |
| `transports` | TEXT | OUI | NULL | Informations sur les transports en commun |

#### SQL de migration

```sql
-- Migration: 009_update_venues_add_fields.sql

ALTER TABLE public.venues
  ADD COLUMN capacity INTEGER,
  ADD COLUMN pmr_accessible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN parking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN transports TEXT;

COMMENT ON COLUMN public.venues.capacity IS 'Capacité maximale de la salle';
COMMENT ON COLUMN public.venues.pmr_accessible IS 'Accessibilité PMR';
COMMENT ON COLUMN public.venues.parking IS 'Parking disponible à proximité';
COMMENT ON COLUMN public.venues.transports IS 'Informations transports en commun';
```

---

### 2.2 Table `shows` (Spectacles)

#### Champs à ajouter

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `period` | TEXT | OUI | NULL | Période de programmation (ex: "Automne 2025") |
| `derviche_manager_id` | UUID | OUI | NULL | FK vers profiles - Responsable Derviche |
| `invitation_policy` | TEXT | OUI | NULL | Politique d'invitation/détaxe |
| `closure_dates` | TEXT | OUI | NULL | Dates de relâche |
| `folder_url` | TEXT | OUI | NULL | URL du dossier de presse (Google Drive, Dropbox...) |
| `teaser_url` | TEXT | OUI | NULL | URL du teaser vidéo |
| `captation_available` | BOOLEAN | NON | false | Captation vidéo disponible |
| `captation_url` | TEXT | OUI | NULL | URL de la captation (si disponible) |

#### Note importante

Le champ `target_audience` n'est PAS ajouté directement à cette table. Il est géré via une relation N-N avec la nouvelle table `target_audiences` (voir section 3).

#### SQL de migration

```sql
-- Migration: 010_update_shows_add_fields.sql

ALTER TABLE public.shows
  ADD COLUMN period TEXT,
  ADD COLUMN derviche_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN invitation_policy TEXT,
  ADD COLUMN closure_dates TEXT,
  ADD COLUMN folder_url TEXT,
  ADD COLUMN teaser_url TEXT,
  ADD COLUMN captation_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN captation_url TEXT;

-- Index pour le responsable Derviche (filtrage fréquent)
CREATE INDEX idx_shows_derviche_manager ON public.shows(derviche_manager_id);

COMMENT ON COLUMN public.shows.period IS 'Période de programmation (ex: Automne 2025)';
COMMENT ON COLUMN public.shows.derviche_manager_id IS 'Responsable Derviche du spectacle';
COMMENT ON COLUMN public.shows.invitation_policy IS 'Politique invitation/détaxe';
COMMENT ON COLUMN public.shows.closure_dates IS 'Dates de relâche';
COMMENT ON COLUMN public.shows.folder_url IS 'URL dossier de presse';
COMMENT ON COLUMN public.shows.teaser_url IS 'URL teaser vidéo';
COMMENT ON COLUMN public.shows.captation_available IS 'Captation vidéo disponible';
COMMENT ON COLUMN public.shows.captation_url IS 'URL de la captation';
```

---

### 2.3 Table `companies` (Compagnies)

#### Champs à ajouter

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | TEXT | OUI | NULL | Ville du siège de la compagnie |
| `contact_name` | TEXT | OUI | NULL | Nom du contact principal |

#### SQL de migration

```sql
-- Migration: 011_update_companies_add_fields.sql

ALTER TABLE public.companies
  ADD COLUMN city TEXT,
  ADD COLUMN contact_name TEXT;

COMMENT ON COLUMN public.companies.city IS 'Ville du siège de la compagnie';
COMMENT ON COLUMN public.companies.contact_name IS 'Nom du contact principal';
```

---

### 2.4 Table `slots` (Représentations/Créneaux)

#### Champs à ajouter

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `hosted_by_id` | UUID | OUI | NULL | FK vers profiles - Qui assure l'accueil (uniquement si hosted_by = 'derviche') |

#### Règle métier

- Si `hosted_by = 'derviche'` → `hosted_by_id` peut contenir l'UUID du membre Derviche (admin, super-admin, ou externe-dd)
- Si `hosted_by = 'company'` → `hosted_by_id` doit être NULL (la compagnie est retrouvée via slot → show → company_id)

#### SQL de migration

```sql
-- Migration: 012_update_slots_add_hosted_by_id.sql

ALTER TABLE public.slots
  ADD COLUMN hosted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index pour le filtrage par personne d'accueil
CREATE INDEX idx_slots_hosted_by_id ON public.slots(hosted_by_id);

-- Contrainte : hosted_by_id doit être NULL si hosted_by = 'company'
ALTER TABLE public.slots
  ADD CONSTRAINT chk_hosted_by_id_consistency
  CHECK (
    (hosted_by = 'company' AND hosted_by_id IS NULL) OR
    (hosted_by = 'derviche')
  );

COMMENT ON COLUMN public.slots.hosted_by_id IS 'Membre Derviche assurant l''accueil (si hosted_by = derviche)';
```

---

### 2.5 Table `reservations` (Réservations)

#### Champs à ajouter (pour les guests/invités non connectés)

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `guest_email_secondary` | TEXT | OUI | NULL | Email secondaire du guest |
| `guest_phone_secondary` | TEXT | OUI | NULL | Téléphone secondaire du guest |
| `guest_address` | TEXT | OUI | NULL | Adresse du guest |
| `guest_postal_code` | TEXT | OUI | NULL | Code postal du guest |
| `guest_city` | TEXT | OUI | NULL | Ville du guest |

#### Note importante

Ces champs sont **optionnels** et concernent uniquement les réservations faites par des **guests** (non connectés). Les utilisateurs connectés ont déjà ces informations dans leur profil (`profiles.email2`, `profiles.phone2`, `profiles.address`).

#### SQL de migration

```sql
-- Migration: 013_update_reservations_add_guest_fields.sql

ALTER TABLE public.reservations
  ADD COLUMN guest_email_secondary TEXT,
  ADD COLUMN guest_phone_secondary TEXT,
  ADD COLUMN guest_address TEXT,
  ADD COLUMN guest_postal_code TEXT,
  ADD COLUMN guest_city TEXT;

COMMENT ON COLUMN public.reservations.guest_email_secondary IS 'Email secondaire (guest uniquement)';
COMMENT ON COLUMN public.reservations.guest_phone_secondary IS 'Téléphone secondaire (guest uniquement)';
COMMENT ON COLUMN public.reservations.guest_address IS 'Adresse (guest uniquement)';
COMMENT ON COLUMN public.reservations.guest_postal_code IS 'Code postal (guest uniquement)';
COMMENT ON COLUMN public.reservations.guest_city IS 'Ville (guest uniquement)';
```

---

## 3. Nouvelles tables

### 3.1 Table `target_audiences` (Publics cibles)

Structure identique à `show_categories` pour cohérence.

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | NON | gen_random_uuid() | Identifiant unique |
| `name` | TEXT | NON | - | Nom du public cible (unique) |
| `slug` | TEXT | NON | - | Slug pour URL (unique) |
| `description` | TEXT | OUI | NULL | Description |
| `display_order` | INTEGER | NON | 0 | Ordre d'affichage |
| `created_at` | TIMESTAMPTZ | NON | NOW() | Date de création |
| `updated_at` | TIMESTAMPTZ | NON | NOW() | Date de mise à jour |

#### Valeurs initiales

| name | slug | display_order |
|------|------|---------------|
| Tout public | tout-public | 1 |
| Adultes | adultes | 2 |
| Jeune public | jeune-public | 3 |
| Famille | famille | 4 |

#### SQL de création

```sql
-- Migration: 014_create_target_audiences.sql

CREATE TABLE public.target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour l'ordre d'affichage
CREATE INDEX idx_target_audiences_display_order ON public.target_audiences(display_order);

-- Trigger pour updated_at
CREATE TRIGGER update_target_audiences_updated_at
  BEFORE UPDATE ON public.target_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données initiales
INSERT INTO public.target_audiences (name, slug, display_order) VALUES
  ('Tout public', 'tout-public', 1),
  ('Adultes', 'adultes', 2),
  ('Jeune public', 'jeune-public', 3),
  ('Famille', 'famille', 4);

COMMENT ON TABLE public.target_audiences IS 'Publics cibles des spectacles';
```

---

### 3.2 Table `show_target_audience_mapping` (Liaison Spectacles-Publics)

Relation N-N entre `shows` et `target_audiences`.

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| `show_id` | UUID | NON | FK vers shows |
| `target_audience_id` | UUID | NON | FK vers target_audiences |

#### SQL de création

```sql
-- Migration: 015_create_show_target_audience_mapping.sql

CREATE TABLE public.show_target_audience_mapping (
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  target_audience_id UUID NOT NULL REFERENCES public.target_audiences(id) ON DELETE CASCADE,
  PRIMARY KEY (show_id, target_audience_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_show_target_audience_show ON public.show_target_audience_mapping(show_id);
CREATE INDEX idx_show_target_audience_audience ON public.show_target_audience_mapping(target_audience_id);

COMMENT ON TABLE public.show_target_audience_mapping IS 'Liaison N-N entre spectacles et publics cibles';
```

---

## 4. Types TypeScript mis à jour

### 4.1 Fichier `src/types/database.ts`

#### Nouveaux types à ajouter

```typescript
// ============================================
// TABLE : target_audiences
// ============================================

/** Public cible (données complètes depuis la BDD) */
export interface TargetAudienceRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Données pour créer un nouveau public cible */
export interface TargetAudienceInsert {
  name: string;
  slug: string;
  description?: string | null;
  display_order?: number;
}

/** Données pour mettre à jour un public cible */
export interface TargetAudienceUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  display_order?: number;
}

// ============================================
// TABLE : show_target_audience_mapping
// ============================================

/** Association spectacle-public cible */
export interface ShowTargetAudienceMappingRow {
  show_id: string;
  target_audience_id: string;
}
```

#### Types à modifier

```typescript
// VenueRow - Ajouter les champs
export interface VenueRow {
  // ... champs existants ...
  capacity: number | null;           // NOUVEAU
  pmr_accessible: boolean;           // NOUVEAU
  parking: boolean;                  // NOUVEAU
  transports: string | null;         // NOUVEAU
}

// VenueInsert - Ajouter les champs
export interface VenueInsert {
  // ... champs existants ...
  capacity?: number | null;
  pmr_accessible?: boolean;
  parking?: boolean;
  transports?: string | null;
}

// VenueUpdate - Ajouter les champs
export interface VenueUpdate {
  // ... champs existants ...
  capacity?: number | null;
  pmr_accessible?: boolean;
  parking?: boolean;
  transports?: string | null;
}

// ShowRow - Ajouter les champs
export interface ShowRow {
  // ... champs existants ...
  period: string | null;                    // NOUVEAU
  derviche_manager_id: string | null;       // NOUVEAU
  invitation_policy: string | null;         // NOUVEAU
  closure_dates: string | null;             // NOUVEAU
  folder_url: string | null;                // NOUVEAU
  teaser_url: string | null;                // NOUVEAU
  captation_available: boolean;             // NOUVEAU
  captation_url: string | null;             // NOUVEAU
}

// ShowInsert - Ajouter les champs
export interface ShowInsert {
  // ... champs existants ...
  period?: string | null;
  derviche_manager_id?: string | null;
  invitation_policy?: string | null;
  closure_dates?: string | null;
  folder_url?: string | null;
  teaser_url?: string | null;
  captation_available?: boolean;
  captation_url?: string | null;
}

// ShowUpdate - Ajouter les champs
export interface ShowUpdate {
  // ... champs existants ...
  period?: string | null;
  derviche_manager_id?: string | null;
  invitation_policy?: string | null;
  closure_dates?: string | null;
  folder_url?: string | null;
  teaser_url?: string | null;
  captation_available?: boolean;
  captation_url?: string | null;
}

// CompanyRow - Ajouter les champs
export interface CompanyRow {
  // ... champs existants ...
  city: string | null;           // NOUVEAU
  contact_name: string | null;   // NOUVEAU
}

// CompanyInsert - Ajouter les champs
export interface CompanyInsert {
  // ... champs existants ...
  city?: string | null;
  contact_name?: string | null;
}

// CompanyUpdate - Ajouter les champs
export interface CompanyUpdate {
  // ... champs existants ...
  city?: string | null;
  contact_name?: string | null;
}

// SlotRow - Ajouter le champ
export interface SlotRow {
  // ... champs existants ...
  hosted_by_id: string | null;   // NOUVEAU
}

// SlotInsert - Ajouter le champ
export interface SlotInsert {
  // ... champs existants ...
  hosted_by_id?: string | null;
}

// SlotUpdate - Ajouter le champ
export interface SlotUpdate {
  // ... champs existants ...
  hosted_by_id?: string | null;
}

// ReservationRow - Ajouter les champs
export interface ReservationRow {
  // ... champs existants ...
  guest_email_secondary: string | null;   // NOUVEAU
  guest_phone_secondary: string | null;   // NOUVEAU
  guest_address: string | null;           // NOUVEAU
  guest_postal_code: string | null;       // NOUVEAU
  guest_city: string | null;              // NOUVEAU
}

// ReservationInsert - Ajouter les champs
export interface ReservationInsert {
  // ... champs existants ...
  guest_email_secondary?: string | null;
  guest_phone_secondary?: string | null;
  guest_address?: string | null;
  guest_postal_code?: string | null;
  guest_city?: string | null;
}

// ReservationUpdate - Ajouter les champs
export interface ReservationUpdate {
  // ... champs existants ...
  guest_email_secondary?: string | null;
  guest_phone_secondary?: string | null;
  guest_address?: string | null;
  guest_postal_code?: string | null;
  guest_city?: string | null;
}
```

#### Type Database global - Ajouter les nouvelles tables

```typescript
export interface Database {
  public: {
    Tables: {
      // ... tables existantes ...
      target_audiences: {
        Row: TargetAudienceRow;
        Insert: TargetAudienceInsert;
        Update: TargetAudienceUpdate;
      };
      show_target_audience_mapping: {
        Row: ShowTargetAudienceMappingRow;
        Insert: ShowTargetAudienceMappingRow;
        Update: never;
      };
    };
  };
}
```

---

## 5. Impact sur les interfaces

### 5.1 Formulaire Admin Spectacles

| Modification | Description | Priorité |
|--------------|-------------|----------|
| **Responsable Derviche** | Remplacer le champ texte par un `<Select>` / `<Combobox>` listant les admins et super-admins | Haute |
| **Public cible** | Ajouter un `<MultiSelect>` pour les publics cibles (comme les catégories) | Haute |
| **Période** | Champ texte simple | Moyenne |
| **Politique invitation** | Champ textarea | Moyenne |
| **Dates relâche** | Champ texte | Basse |
| **URL Dossier** | Champ URL avec validation | Moyenne |
| **URL Teaser** | Champ URL avec validation | Moyenne |
| **Captation disponible** | Switch boolean | Moyenne |
| **URL Captation** | Champ URL conditionnel (visible si captation = true) | Moyenne |

### 5.2 Formulaire Admin Lieux

| Modification | Description | Priorité |
|--------------|-------------|----------|
| **Capacité** | Champ numérique | Haute |
| **Accessibilité PMR** | Switch boolean | Moyenne |
| **Parking** | Switch boolean | Moyenne |
| **Transports** | Champ textarea | Moyenne |

### 5.3 Formulaire Admin Compagnies

| Modification | Description | Priorité |
|--------------|-------------|----------|
| **Ville** | Champ texte | Moyenne |
| **Nom du contact** | Champ texte | Moyenne |

### 5.4 Formulaire Admin Représentations

| Modification | Description | Priorité |
|--------------|-------------|----------|
| **Personne d'accueil** | Si `hosted_by = 'derviche'`, ajouter un select pour choisir le membre Derviche | Haute |

### 5.5 Formulaire Réservation (Guest)

| Modification | Description | Priorité |
|--------------|-------------|----------|
| **Email secondaire** | Champ email optionnel | Basse |
| **Téléphone secondaire** | Champ tel optionnel | Basse |
| **Adresse** | Champ texte optionnel | Basse |
| **Code postal** | Champ texte optionnel | Basse |
| **Ville** | Champ texte optionnel | Basse |

---

## 6. Migrations SQL à créer

### 6.1 Ordre d'exécution

| # | Fichier | Description | Dépendances |
|---|---------|-------------|-------------|
| 009 | `009_update_venues_add_fields.sql` | Ajout champs venues | Aucune |
| 010 | `010_update_shows_add_fields.sql` | Ajout champs shows | Aucune |
| 011 | `011_update_companies_add_fields.sql` | Ajout champs companies | Aucune |
| 012 | `012_update_slots_add_hosted_by_id.sql` | Ajout hosted_by_id | Aucune |
| 013 | `013_update_reservations_add_guest_fields.sql` | Ajout champs guests | Aucune |
| 014 | `014_create_target_audiences.sql` | Nouvelle table + données | Aucune |
| 015 | `015_create_show_target_audience_mapping.sql` | Table de liaison N-N | 014 |

### 6.2 RLS (Row Level Security) pour les nouvelles tables

```sql
-- RLS pour target_audiences
ALTER TABLE public.target_audiences ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde
CREATE POLICY "target_audiences_select_all" ON public.target_audiences
  FOR SELECT USING (true);

-- Insert/Update/Delete : admins uniquement
CREATE POLICY "target_audiences_admin_all" ON public.target_audiences
  FOR ALL USING (is_admin_or_super());

-- RLS pour show_target_audience_mapping
ALTER TABLE public.show_target_audience_mapping ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde
CREATE POLICY "show_target_audience_mapping_select_all" ON public.show_target_audience_mapping
  FOR SELECT USING (true);

-- Insert/Update/Delete : admins uniquement
CREATE POLICY "show_target_audience_mapping_admin_all" ON public.show_target_audience_mapping
  FOR ALL USING (is_admin_or_super());
```

---

## 📊 Schéma relationnel mis à jour (ASCII)

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│   companies     │       │       shows          │       │     venues      │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id              │◄──────│ company_id           │       │ id              │
│ name            │       │ id                   │──────►│ name            │
│ city        NEW │       │ title                │       │ city            │
│ contact_name NEW│       │ slug                 │       │ capacity    NEW │
│ contact_email   │       │ period           NEW │       │ pmr_accessible  │
│ ...             │       │ derviche_manager_id  │───┐   │ parking     NEW │
└─────────────────┘       │ invitation_policy NEW│   │   │ transports  NEW │
                          │ closure_dates    NEW │   │   │ ...             │
┌─────────────────┐       │ folder_url       NEW │   │   └─────────────────┘
│ show_categories │       │ teaser_url       NEW │   │
├─────────────────┤       │ captation_avail  NEW │   │   ┌─────────────────┐
│ id              │       │ captation_url    NEW │   │   │    profiles     │
│ name            │       │ ...                  │   │   ├─────────────────┤
│ slug            │       └──────────────────────┘   └──►│ id              │
│ ...             │              │                       │ email           │
└─────────────────┘              │                       │ first_name      │
        │                        │                       │ last_name       │
        │ N-N                    │ N-N                   │ role            │
        ▼                        ▼                       │ ...             │
┌───────────────────────┐  ┌─────────────────────────┐   └─────────────────┘
│show_category_mapping  │  │show_target_audience_map │          ▲
├───────────────────────┤  ├─────────────────────────┤          │
│ show_id               │  │ show_id             NEW │          │
│ category_id           │  │ target_audience_id  NEW │          │
└───────────────────────┘  └─────────────────────────┘          │
                                      │                         │
                                      ▼                         │
                           ┌─────────────────┐                  │
                           │target_audiences │                  │
                           ├─────────────────┤                  │
                           │ id          NEW │                  │
                           │ name        NEW │                  │
                           │ slug        NEW │                  │
                           │ ...             │                  │
                           └─────────────────┘                  │
                                                                │
┌─────────────────┐       ┌──────────────────────┐              │
│     slots       │       │    reservations      │              │
├─────────────────┤       ├──────────────────────┤              │
│ id              │◄──────│ slot_id              │              │
│ show_id         │       │ id                   │              │
│ venue_id        │       │ user_id              │──────────────┘
│ hosted_by       │       │ guest_email_2nd  NEW │
│ hosted_by_id NEW│───────│ guest_phone_2nd  NEW │
│ ...             │       │ guest_address    NEW │
└─────────────────┘       │ guest_postal     NEW │
                          │ guest_city       NEW │
                          │ ...                  │
                          └──────────────────────┘
```

---

## ✅ Checklist de validation

- [ ] Relire toutes les modifications de ce document
- [ ] Valider les noms de champs (snake_case pour SQL)
- [ ] Valider les types de données
- [ ] Valider les contraintes (FK, CHECK, UNIQUE)
- [ ] Valider les valeurs par défaut
- [ ] Créer les fichiers de migration SQL
- [ ] Exécuter les migrations sur Supabase (dev d'abord)
- [ ] Mettre à jour `src/types/database.ts`
- [ ] Mettre à jour `src/lib/mock-data.ts`
- [ ] Mettre à jour les interfaces admin
- [ ] Tester toutes les fonctionnalités impactées

---

## 📝 Notes pour la prochaine session

1. **Priorité** : Créer les migrations SQL et les exécuter sur Supabase
2. **Puis** : Mettre à jour les types TypeScript
3. **Puis** : Mettre à jour mock-data.ts pour aligner les types
4. **Enfin** : Adapter les formulaires admin (spectacles d'abord)

---

**Document généré le 23 décembre 2025**  
**Auteur** : Session 20 - Claude + Steven  
**Prochaine étape** : Validation par Steven, puis création des migrations SQL
