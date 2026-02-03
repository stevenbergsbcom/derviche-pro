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

## Fichiers de référence du projet
- `ARCHITECTURE.md` : stack et structure détaillée
- `CONVENTIONS.md` : patterns et conventions de code
- `STATUT.md` : état actuel, à faire, points d'attention
- `DECISIONS.md` : historique des choix techniques

## Workflow de travail
1. Toujours consulter les fichiers de contexte avant de commencer
2. Proposer une approche avant d'implémenter
3. Suivre les patterns existants
4. Mettre à jour STATUT.md après changements significatifs
