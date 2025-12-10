# Derviche Diffusion - Plateforme de Réservation Professionnelle

Application de gestion de réservations professionnelles pour spectacles vivants.

## 🎭 À propos

**Derviche Diffusion** est une société de diffusion de spectacles vivants qui représente des compagnies artistiques auprès des programmateurs de salles de théâtre.

Cette plateforme permet :
- Aux **programmateurs** de découvrir et réserver des places pour des spectacles
- Aux **administrateurs** de gérer la programmation et suivre les réservations
- Aux **compagnies** de consulter les statistiques de fréquentation

## 🚀 Stack Technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth |
| State Management | React Query + Context API |
| Formulaires | React Hook Form + Zod |
| Déploiement | Vercel |

## 📁 Structure du projet
```
src/
├── app/                 # Routes Next.js (App Router)
│   ├── (auth)/          # Routes authentification
│   ├── (public)/        # Routes publiques
│   ├── admin/           # Dashboard admin
│   ├── professional/    # Dashboard programmateurs
│   └── company/         # Dashboard compagnies
├── components/          # Composants React
│   ├── ui/              # Composants shadcn/ui
│   └── features/        # Composants métier
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires et configurations
│   └── supabase/        # Clients Supabase
├── types/               # Types TypeScript globaux
└── utils/               # Fonctions utilitaires
```

## 🛠️ Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Vercel (pour le déploiement)

### Étapes

1. **Cloner le repository**
```bash
   git clone https://github.com/stevenbergsbcom/derviche-pro.git
   cd derviche-pro
```

2. **Installer les dépendances**
```bash
   npm install
```

3. **Configurer les variables d'environnement**
```bash
   cp .env.example .env.local
```
   
   Puis remplir les valeurs dans `.env.local` :
```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Lancer le serveur de développement**
```bash
   npm run dev
```

5. **Ouvrir l'application**
   
   [http://localhost:3000](http://localhost:3000)

## 📜 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le build de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run test` | Lancer les tests (à configurer) |

## 🌿 Workflow Git

### Branches

- `main` → Production (déploiement automatique)
- `dev` → Développement (preview Vercel)

### Convention de commits
```
feat(scope): description    # Nouvelle fonctionnalité
fix(scope): description     # Correction de bug
docs(scope): description    # Documentation
refactor(scope): description # Refactorisation
test(scope): description    # Tests
chore(scope): description   # Maintenance
```

### Processus

1. Travailler sur la branche `dev`
2. Commit avec un message conventionnel
3. Push sur `dev`
4. Vérifier le déploiement preview
5. Merger sur `main` une fois validé

## 👥 Profils utilisateurs

| Rôle | Nombre | Accès |
|------|--------|-------|
| Super Admin | 2-3 | Gestion complète |
| Admin | 3-7 | Gestion spectacles et réservations |
| Externe DD | 10-20 | Check-in sur place |
| Programmateurs | 500-1000 | Réservation de places |
| Compagnies | 15-20 | Consultation statistiques |

## 🔗 Liens

- **Production** : [derviche-pro.vercel.app](https://derviche-pro.vercel.app)
- **Staging** : [derviche-pro-staging.vercel.app](https://derviche-pro-staging.vercel.app)

## 📄 Licence

Projet privé - Derviche Diffusion © 2025