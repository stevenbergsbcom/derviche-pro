# Décisions techniques - Derviche Pro

Ce document trace les choix architecturaux et techniques du projet.

---

## Architecture globale

### Pas de backend séparé
**Décision** : Utiliser Supabase comme backend complet (PostgreSQL + Auth + RLS + Storage)

**Justification** :
- Simplification de l'infrastructure
- RLS (Row Level Security) pour la sécurité des données
- Auth intégrée avec OAuth
- Storage pour les médias et logos

**Conséquence** : Logique métier répartie entre Server Components, Route Handlers et services côté client.

---

### Next.js App Router
**Décision** : Utiliser l'App Router (et non Pages Router)

**Justification** :
- Server Components par défaut
- Layouts imbriqués
- Groupes de routes `(auth)`, `(public)`, `(protected)`

---

### Structure par zones
**Décision** : Organiser les routes par "zone" utilisateur

```
app/
├── (auth)/        # Non connecté
├── (public)/      # Tout le monde
├── (protected)/   # Connecté
├── admin/         # Admin seulement
├── company/       # Compagnie seulement
└── accueil/       # Check-in PWA
```

**Justification** : Séparation claire des responsabilités et des layouts.

---

## Patterns de code

### Pattern ApiResult
**Décision** : Standardiser les retours de fonctions métier

```typescript
type ApiResult<T> = { data: T; error: null } | { data: null; error: string }
```

**Justification** : Gestion d'erreurs explicite, pas d'exceptions à catch partout.

---

### Services par domaine
**Décision** : Un dossier par domaine métier dans `lib/services/`

**Justification** :
- Colocation du code lié
- Facilite les imports
- Évite les fichiers géants

---

### Formulaires RHF + Zod
**Décision** : React Hook Form avec validation Zod

**Justification** :
- Performance (uncontrolled)
- Validation type-safe
- Intégration native avec `zodResolver`

---

### Unsaved changes pattern
**Décision** : Pattern `isInitialized` + `onDirtyChangeRef` pour les sections de préférences

**Justification** :
- Éviter les faux positifs au chargement initial
- Permettre la confirmation avant navigation
- Cohérence entre toutes les sections

---

## UI / UX

### shadcn/ui + Radix
**Décision** : Utiliser shadcn/ui basé sur Radix UI

**Justification** :
- Composants accessibles
- Personnalisables (copie du code)
- Cohérence visuelle

---

### Thèmes dynamiques
**Décision** : Presets de thèmes (classic, ocean, night...) + logos personnalisés

**Justification** :
- Personnalisation par organisation
- Stockage des logos dans Supabase Storage
- Application via CSS variables

---

### PWA pour le check-in
**Décision** : Application check-in en PWA

**Justification** :
- Utilisable sur mobile sans installation
- Mode offline potentiel
- Interface optimisée tactile

---

## Sécurité

### RLS Supabase
**Décision** : Toutes les tables protégées par Row Level Security

**Justification** : Sécurité au niveau de la base de données, pas seulement de l'application.

---

### Middleware de protection
**Décision** : Middleware Next.js pour la protection des routes par rôle

**Justification** :
- Vérification côté serveur avant rendu
- Redirection automatique selon le rôle
- Gestion des comptes désactivés

---

### Admin client séparé
**Décision** : `createAdminClient()` uniquement dans les Route Handlers admin

**Justification** : Le service role key ne doit jamais être exposé côté client.

---

## Recherche réservations (07-06)

### RPC de recherche → `.in('id', ids)` plutôt que `.or()` natif
**Décision** : la recherche textuelle des réservations (admin + compagnie) passe par une RPC PostgreSQL (`search_reservation_ids` / `search_company_reservation_ids`) qui renvoie les IDs matchants, puis le service applique `query.in('id', ids)`.

**Justification** :
- Le `.or()` natif Supabase JS ne peut pas traverser une jointure (`profiles` via `user_id`) → impossible de chercher dans l'identité des pros connectés, qui vit dans `profiles`. C'était le bug remonté par le client.
- La RPC fait le `OR` multi-colonnes + multi-tokens côté SQL, applique le filtre par rôle (externe = shows assignés ; compagnie = `company_id`), puis rend juste des IDs. Le service garde sa query classique (pagination + autres filtres inchangés).
- Alternative écartée : colonne dénormalisée `reservations.search_text`. Nécessiterait un trigger de sync `profiles → reservations` (l'identité d'un pro connecté peut changer après création de la résa). Reporté tant que le besoin ne le justifie pas.

### Plafond 200 résultats (`SEARCH_RESULT_CAP` / `v_cap`)
**Décision** : les RPC plafonnent à 200 IDs (les plus récents, `created_at DESC`). Le front exige ≥2 caractères et affiche « affinez » quand le plafond est atteint.

**Justification** :
- `.in('id', ids)` part en **GET** → les UUIDs sont dans l'URL (~37 car./UUID). Le gateway Supabase plafonne l'URL vers 8–16 KB → au-delà de ~200–400 IDs la requête casse.
- 200 borne l'URL à ~7,5 KB et couvre l'usage réel (recherche par nom précis).
- ⚠ La constante TS (`SEARCH_RESULT_CAP`) et le `v_cap` SQL doivent rester synchros.
- **Si ça repique** (recherches larges tronquées) : basculer sur une RPC paginée (filtre + pagination + lignes complètes) ou la dénormalisation ci-dessus. Voir mémoire projet `recherche-in-url-limit`.

### Recherche = toutes périodes
**Décision** : dès qu'une recherche est active, le filtre Période (défaut « À venir ») est neutralisé — la recherche couvre à venir + passées.

**Justification** : la recherche est une intention « retrouver quelqu'un », pas « naviguer ». Borner au défaut « À venir » masquait les résas passées → le client croyait la recherche incomplète. Implémentation stateless : `getEffectiveDateFilters` renvoie `{}` si `search` actif ; la valeur `period` stockée est préservée (redevient active à l'effacement). Les dates personnalisées explicites (Du/Au) restent respectées.
