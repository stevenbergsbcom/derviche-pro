# Architecture - Derviche Pro

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | Next.js (App Router) | 16.0.10 |
| | React | 19.2.1 |
| | TypeScript | ^5 (strict) |
| | Tailwind CSS | ^4 |
| | shadcn/ui + Radix UI | Composants UI |
| **Formulaires** | React Hook Form + Zod | ^4 |
| **State** | TanStack React Query | ^5.90.12 |
| **Backend / BDD** | Supabase | PostgreSQL + Auth + RLS + Storage |
| | @supabase/ssr | 0.8.0 |
| **Build** | Turbopack | next dev --turbopack |

> **Note** : Pas de serveur backend dédié. Logique métier dans Server Components, Route Handlers (`src/app/api/`) et services (`src/lib/services/`).

---

## Structure des dossiers

```
derviche-pro/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Login, register, forgot/reset password
│   │   ├── (public)/                 # Catalogue, spectacle/[slug], accueil
│   │   ├── (protected)/              # Mon-compte, checkin (layout protégé)
│   │   ├── accueil/                  # PWA check-in
│   │   ├── admin/                    # Dashboard admin complet
│   │   ├── api/                      # Route Handlers (auth, admin/users)
│   │   ├── auth/callback/            # Callback OAuth Supabase
│   │   └── company/                  # Dashboard compagnie
│   │
│   ├── components/
│   │   ├── ui/                       # Composants shadcn
│   │   ├── admin/                    # Composants admin
│   │   ├── accueil/                  # Check-in (drawers, cards)
│   │   ├── company/                  # Sidebar compagnie, stats
│   │   ├── shared-sidebar/           # Logo, user info, logout
│   │   └── shared/                   # AccessDenied, LoadingScreen
│   │
│   ├── hooks/                        # Hooks métier + utilitaires
│   │
│   ├── lib/
│   │   ├── supabase/                 # client.ts, server.ts, server-admin.ts
│   │   ├── services/                 # Couche métier par domaine
│   │   ├── auth/                     # get-user-role, redirect-utils
│   │   ├── constants/                # Constantes et validation
│   │   ├── theme/                    # Presets thèmes, logos
│   │   └── utils.ts                  # cn, formatage
│   │
│   └── types/                        # database.ts, reservation.ts, supabase
│
├── supabase/migrations/              # 40 migrations
├── public/                           # Static, manifest, sw.js
├── docs/                             # CDC
└── .cursor/rules/                    # Règles projet
```

---

## Clients Supabase

| Client | Fichier | Usage |
|--------|---------|-------|
| `createClient()` | `client.ts` | Navigateur (composants client) |
| `createClient()` | `server.ts` | Server Components, Route Handlers |
| `createAdminClient()` | `server-admin.ts` | API admin uniquement (users, status) |

---

## Dépendances principales

### Production
- next, react, react-dom
- @supabase/ssr, @supabase/supabase-js
- @tanstack/react-query, react-hook-form, zod
- @radix-ui/* (dialog, tabs, select, switch...)
- tailwind-merge, clsx, class-variance-authority
- lucide-react, sonner, next-themes
- dompurify, xlsx, @dnd-kit/*

### Dev
- typescript ^5, eslint ^9, prettier ^3
- tailwindcss ^4, tw-animate-css
