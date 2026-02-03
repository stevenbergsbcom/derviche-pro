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
