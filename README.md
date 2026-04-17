# Derviche Diffusion — Plateforme de réservation pour le spectacle vivant

Application Next.js 16 / Supabase de gestion de réservations professionnelles pour **Derviche Diffusion**, société de diffusion de spectacles vivants représentant des compagnies artistiques auprès des programmateurs de salles.

## 🎭 À propos

La plateforme s'adresse à 5 publics :

- **Programmateurs** (500–1000) — découverte du catalogue, réservation en ligne
- **Administrateurs & super-admins Derviche** (5–10) — gestion complète (spectacles, créneaux, réservations, emails, préférences, classement éditorial, statistiques)
- **Externes Derviche** (10–20) — check-in sur place via PWA
- **Compagnies** (15–20) — consultation des statistiques de fréquentation de leurs spectacles
- **Public non connecté** — consultation du catalogue, réservation en guest

## ✨ Fonctionnalités principales

- **Catalogue public** filtrable (genre, mois, lieu, ville, disponibilité, recherche) avec détail spectacle enrichi (teaser vidéo en modale, bloc pro avec contact manager, badges catégories / publics cibles)
- **Réservation publique** guest ou pro, confirmation par email (Resend) + notification admin enrichie
- **Check-in PWA** (`/accueil`) — recherche pro, check-in avec statuts (présent / coup de cœur / presse / absent), emails post-checkin personnalisables
- **Admin complet** — dashboard, réservations avec filtres et export, spectacles avec médias, représentations (créneaux en série), lieux, compagnies, professionnels, utilisateurs, logs système
- **Classement éditorial** — drag&drop pour piloter les vedettes homepage et l'ordre global du catalogue
- **Page de statistiques** dédiée avec drill-down, comparaison entre périodes, export PDF
- **12 templates email** éditables depuis l'admin (toggles de liens optionnels, variables substituables, preview live)
- **Intégration Google Calendar** — ajout automatique aux agendas des programmateurs, monitoring santé
- **Rate limiting** Upstash Redis sur les routes sensibles (auth, emails, réservations)
- **RLS Supabase** sur toutes les tables — isolation stricte par rôle

## 🚀 Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1 |
| Runtime | React | 19.2 |
| Langage | TypeScript (strict mode) | 5.x |
| Styling | Tailwind CSS + shadcn/ui + Radix UI | 4.x |
| Base de données | Supabase (PostgreSQL + RLS) | — |
| Auth | Supabase Auth (email/password, magic link, OAuth) | — |
| Formulaires | React Hook Form + Zod | 7.68 / 4.1 |
| Drag & Drop | @dnd-kit (core + sortable) | 6.3 / 10.0 |
| Graphes | Recharts | 2.15 |
| Emails transactionnels | Resend | 6.9 |
| Rate limiting | Upstash Redis + Ratelimit | — |
| Google Calendar | googleapis (service account) | 171.x |
| Mobile drawers | vaul | 1.1 |
| Toasts | sonner | 2.0 |
| Icônes | lucide-react | 0.559 |
| Déploiement | Vercel | — |

## 📚 Documentation

| Fichier | Rôle |
|---|---|
| **[`CLAUDE.md`](CLAUDE.md)** | Règles de code, patterns, architecture, conventions — **à lire en premier** pour contribuer |
| **[`docs/STATUT.md`](docs/STATUT.md)** | Historique complet des sessions de dev, décisions techniques, migrations |
| `docs/CDC_MISE_A_JOUR_V4.md` | Cahier des charges V4 (spécifications fonctionnelles) |

## 🛠️ Installation

### Prérequis

- **Node.js** ≥ 20.x
- **npm** (le projet utilise `package-lock.json`)
- Compte **Supabase** avec un projet créé
- Compte **Vercel** (pour le déploiement)
- Optionnel pour dev local : [Supabase CLI](https://supabase.com/docs/guides/cli) pour appliquer les migrations

### Étapes

**1. Cloner le dépôt**

```bash
git clone https://github.com/stevenbergsbcom/derviche-pro.git
cd derviche-pro
```

**2. Installer les dépendances**

```bash
npm install
```

**3. Configurer les variables d'environnement**

```bash
cp .env.example .env.local
```

Remplir `.env.local` :

```env
# Supabase — obligatoire
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...   # bypass RLS côté serveur (admin)

# App — obligatoire
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend — emails transactionnels
RESEND_API_KEY=re_xxx

# Upstash Redis — rate limiting
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Cron jobs (GitHub Actions → /api/cron/*)
CRON_SECRET=votre-secret-aléatoire

# Google Calendar — intégration optionnelle
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projet.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=xxx@group.calendar.google.com
```

**4. Appliquer les migrations Supabase**

```bash
supabase db push
```

112 migrations sont présentes dans [`supabase/migrations/`](supabase/migrations). Elles couvrent le schéma complet, les RLS, les RPCs de statistiques, les triggers et les seeds de templates email.

**5. Lancer le serveur de développement**

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de dev avec Turbopack |
| `npm run build` | Build production |
| `npm run start` | Démarrer le build production |
| `npm run lint` | ESLint (`--max-warnings 0`) |
| `npm run lint:fix` | ESLint avec auto-fix |
| `npm run type-check` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check only) |

## 📁 Structure du projet

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login, register, forgot-password
│   ├── (public)/                 # catalogue, spectacle/[slug], confirmation
│   ├── (protected)/              # professional/mon-compte, /reservations
│   ├── accueil/                  # PWA check-in (staff sur place)
│   ├── admin/                    # Dashboard admin (13 modules)
│   │   ├── reservations/
│   │   ├── spectacles/
│   │   ├── statistiques/
│   │   ├── lieux/
│   │   ├── compagnies/
│   │   ├── professionnels/
│   │   ├── utilisateurs/
│   │   ├── preferences/          # 12 onglets (sous-menu sidebar)
│   │   └── systeme/              # Logs + monitoring
│   ├── company/                  # Espace compagnie (stats de leurs spectacles)
│   └── api/                      # Route handlers (emails, admin, cron, auth)
├── components/
│   ├── ui/                       # shadcn/ui (30+ composants Radix)
│   ├── admin/                    # sidebar, notifications, spectacles, préférences
│   ├── accueil/                  # PWA check-in drawer, add-reservation
│   ├── company/                  # sidebar, stats
│   ├── layout/                   # Header public, Footer
│   ├── spectacles/               # SpectacleCard partagée
│   └── shared/
├── hooks/                        # 25+ hooks custom (useAdminReservations, etc.)
├── lib/
│   ├── supabase/                 # client (browser), server, server-admin
│   ├── services/                 # Couche métier — voir "Architecture"
│   ├── api/                      # admin-guard, responses, errors
│   ├── auth/                     # redirect, get-user-role
│   ├── constants/                # reservations, shows, etc.
│   ├── utils.ts                  # cn, searchMatch, …
│   └── utils/                    # format-date, shows, etc.
├── types/
│   ├── database.ts               # Source de vérité (interfaces manuelles)
│   ├── supabase.ts               # Types auto-générés (supabase gen types)
│   └── email-templates.ts
└── middleware.ts                 # Protection par rôle
```

## 🏗️ Architecture

### Pattern 1 — Service layer (`lib/services/*`)

Toute la logique métier vit dans `src/lib/services/`. Chaque domaine est un sous-module avec cette structure :

```
lib/services/admin-reservations/
├── index.ts           # Exports publics (barrel)
├── types.ts           # Interfaces
├── constants.ts       # Constantes métier
├── list.ts            # Requêtes liste/recherche
├── detail.ts          # Requête détail
├── mutations.ts       # Create / Update / Delete
├── stats.ts           # Statistiques
├── filters.ts         # Logique de filtrage
└── transformers.ts    # Transformation données
```

Principaux domaines : `admin-reservations`, `shows`, `public-catalog`, `email`, `logs`, `stats`, `checkin`, `companies`, `venues`, `app-settings`.

Toutes les mutations retournent un `ApiResult<T>` standardisé (`{ success, data?, error? }`).

### Pattern 2 — Colocation par feature (dans `app/*`)

Chaque feature complexe dans `app/` a sa propre structure colocale :

```
src/app/admin/reservations/
├── page.tsx                      # Orchestrateur ('use client')
├── components/                   # Composants locaux
│   ├── stats-cards.tsx
│   ├── filters-section.tsx
│   ├── reservations-content.tsx
│   └── index.ts                  # Barrel
└── hooks/                        # Hooks locaux
    └── use-reservation-filters.ts
```

### Pattern 3 — RLS & sécurité Supabase

**Toutes les tables** sont protégées par RLS (Row Level Security). Les policies sont définies dans les migrations `supabase/migrations/*.sql`.

- 3 clients Supabase distincts : [`client.ts`](src/lib/supabase/client.ts) (browser), [`server.ts`](src/lib/supabase/server.ts) (RSC & route handlers), [`server-admin.ts`](src/lib/supabase/server-admin.ts) (service_role, bypass RLS — usage restreint).
- Le middleware ([`src/middleware.ts`](src/middleware.ts)) protège les routes selon le rôle de l'utilisateur.
- Les routes API admin passent par `requireAuth()` de [`lib/api/admin-guard.ts`](src/lib/api/admin-guard.ts).

### Pattern 4 — Rate limiting

Trois limiters Upstash Redis (sliding window, fail-open) protègent les routes publiques :

- `auth` — 5 req / 15 min
- `emails` — 20 req / 1 h
- `reservations` — 10 req / 10 min

Voir [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts).

## 🔐 Rôles & accès

| Rôle | Nombre | Accès principaux |
|---|---|---|
| `super-admin` | 2–3 | Accès complet + `/admin/preferences`, `/admin/systeme`, `/admin/utilisateurs` |
| `admin` | 3–7 | Gestion spectacles / réservations / créneaux / emails — sauf utilisateurs, préférences, système |
| `externe` | 10–20 | PWA check-in sur les spectacles qui leur sont assignés |
| `professional` | 500–1000 | Catalogue, réservation, espace `/professional/mon-compte` |
| `company` | 15–20 | Consultation statistiques de leurs spectacles, peut check-in si `hosted_by = 'company'` |

Le middleware applique :

- `SUPER_ADMIN_ONLY_ROUTES` = `/admin/preferences`, `/admin/systeme`, `/admin/utilisateurs`
- `ADMIN_ROLES` = `['super-admin', 'admin']` pour la majorité des routes admin
- `STAFF_ROLES` = `['super-admin', 'admin', 'externe', 'company']` pour l'accueil PWA

## 🌿 Workflow Git

### Branches

- `main` → production (déploiement automatique Vercel)
- `dev` → développement (preview Vercel)
- `feature/*` → branches courtes si nécessaire (peu utilisées, la plupart du travail se fait directement sur `dev`)

### Convention de commits

```
feat(scope): description       # Nouvelle fonctionnalité
fix(scope): description        # Correction de bug
docs(scope): description       # Documentation
refactor(scope): description   # Refactorisation
perf(scope): description       # Optimisation
test(scope): description       # Tests
chore(scope): description      # Maintenance
security(scope): description   # Sécurité / hardening
```

### Processus de livraison

1. Travailler sur `dev`
2. Commit conventionnel
3. `npm run lint && npm run type-check && npm run build` en local
4. Push sur `dev` → preview Vercel déclenchée
5. **Audit Cursor** (ou équivalent) sur le diff `dev..main`
6. Corrections des points 🔴 / 🟠 avant merge
7. Merge sur `main` **avec `--no-ff`** pour garder l'historique de branche lisible :
   ```bash
   git checkout main && git pull
   git merge --no-ff dev -m "Merge branch 'dev' — description feature"
   git push origin main
   git checkout dev
   ```
8. Mettre à jour [`docs/STATUT.md`](docs/STATUT.md) en fin de session

## 🔗 Liens

- **Production** : [derviche-pro.vercel.app](https://derviche-pro.vercel.app)
- **Site vitrine** : [dervichediffusion.com](https://dervichediffusion.com)
- **Issues** : [GitHub Issues](https://github.com/stevenbergsbcom/derviche-pro/issues)

## 📄 Licence

Projet privé — Derviche Diffusion © 2026
