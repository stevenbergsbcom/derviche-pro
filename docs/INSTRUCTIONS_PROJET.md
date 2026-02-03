# Instructions Projet - Derviche Pro

## Contexte
Plateforme de gestion de spectacles et réservations pour compagnies de danse/théâtre.
- **Frontend** : Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + RLS + Storage) — pas de serveur dédié
- **État** : React Query pour le cache, React Hook Form + Zod pour les formulaires

## Rôles utilisateur
- `super-admin` : accès total (préférences incluses)
- `admin` : gestion spectacles, réservations, lieux, compagnies
- `company` : vue limitée à sa compagnie
- `user` : réservation publique uniquement

## Structure du code
```
src/
├── app/           # Routes Next.js (groupes : auth, public, protected, admin, company)
├── components/    # UI par domaine (ui/, admin/, company/, shared/)
├── hooks/         # Hooks métier (useAdminReservations, useAppSettings...)
├── lib/services/  # Couche métier par domaine (un dossier = un domaine)
└── types/         # Types Supabase et métier
```

## Patterns obligatoires
1. **Server vs Client** : pas de `'use client'` par défaut, uniquement si nécessaire
2. **Résultats** : pattern `{ data, error }` ou `{ success, data?, error? }`
3. **Formulaires** : RHF + zodResolver, schémas Zod
4. **Nommage** : dossiers kebab-case, composants PascalCase, hooks use+PascalCase

## Clients Supabase
- `createClient()` (client.ts) → navigateur
- `createClient()` (server.ts) → Server Components
- `createAdminClient()` → Route Handlers admin uniquement (service role)

## Règles de développement
- TypeScript strict, pas de `any`
- Imports avec alias `@/`
- Barrel exports (`index.ts`) par dossier
- Pas de logique métier dans les composants UI
- Validation Zod côté client ET RLS côté Supabase

---

## ⚠️ IMPORTANT — Début de chaque conversation

**Avant de répondre à toute demande, consulte systématiquement les fichiers du projet :**

| Fichier | Quand le consulter |
|---------|-------------------|
| `STATUT.md` | **TOUJOURS** — pour connaître l'état actuel, les derniers travaux, les TODO |
| `ARCHITECTURE.md` | Si la demande concerne la structure, la stack, ou l'organisation du code |
| `CONVENTIONS.md` | Si la demande implique d'écrire du code |
| `DECISIONS.md` | En cas de doute sur un choix technique passé |

**Règles :**
- Ne jamais dire "je ne sais pas où on en est" — l'information est dans les fichiers
- Ne jamais proposer une approche sans vérifier qu'elle respecte les conventions
- Ne jamais supposer l'état du projet — vérifier dans STATUT.md
- Si un fichier n'est pas à jour, le signaler et proposer une mise à jour

---

## Workflow de travail

1. **Consulter** les fichiers de contexte (voir ci-dessus)
2. **Proposer** une approche avant d'implémenter
3. **Suivre** les patterns existants du projet
4. **Mettre à jour** STATUT.md après changements significatifs (me fournir le contenu mis à jour)