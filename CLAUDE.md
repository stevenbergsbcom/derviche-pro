# CLAUDE.md - Derviche Pro

## Vue d'ensemble

**Derviche Diffusion** est une plateforme professionnelle de réservation pour le spectacle vivant. Elle permet aux professionnels (directeurs de salles) de découvrir et réserver des spectacles, aux administrateurs de gérer la programmation, et aux compagnies de consulter leurs statistiques de fréquentation.

### Stack technique
- **Framework** : Next.js 16 (App Router + Turbopack)
- **Langage** : TypeScript (mode strict)
- **Base de données** : Supabase (PostgreSQL + RLS)
- **Auth** : Supabase Auth
- **UI** : shadcn/ui + Radix UI
- **Styling** : Tailwind CSS 4
- **État** : React Query + Context API
- **Formulaires** : React Hook Form + Zod

## Commandes

```bash
npm run dev              # Serveur dev (Turbopack)
npm run build            # Build production
npm run lint             # ESLint (--max-warnings 0)
npm run lint:fix         # Auto-fix ESLint
npm run format           # Prettier
npm run format:check     # Vérifier formatage
npm run type-check       # Vérification TypeScript
```

## Architecture

### Structure des dossiers
```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Routes auth (login, register, forgot-password)
│   ├── (public)/             # Routes publiques (catalogue, spectacle/[slug])
│   ├── (protected)/          # Routes protégées (mon-compte)
│   ├── accueil/              # Interface check-in PWA (staff)
│   │   ├── [showSlug]/       # Détail spectacle
│   │   └── [showSlug]/[slotId]/ # Réservations d'un créneau
│   ├── admin/                # Dashboard admin
│   │   ├── reservations/     # Gestion réservations
│   │   ├── spectacles/       # Gestion spectacles
│   │   │   └── [id]/representations/ # Créneaux d'un spectacle
│   │   ├── utilisateurs/     # Gestion utilisateurs
│   │   ├── compagnies/       # Gestion compagnies
│   │   └── lieux/            # Gestion salles
│   └── company/              # Dashboard compagnie (statistiques)
├── components/
│   ├── ui/                   # Composants shadcn/ui (30+)
│   ├── admin/                # Composants admin (sidebar, dialogs, tables)
│   ├── accueil/              # Composants check-in PWA
│   ├── company/              # Composants dashboard compagnie
│   └── shared/               # Composants partagés
├── hooks/                    # Hooks React personnalisés (25+)
├── lib/
│   ├── supabase/             # Clients Supabase (client, server, server-admin)
│   ├── services/             # Couche métier (admin-reservations/, shows/, etc.)
│   ├── auth/                 # Utilitaires auth (redirect, get-user-role)
│   ├── constants/            # Constantes et validation
│   └── utils.ts              # Utilitaires (cn, formatage)
├── types/
│   └── database.ts           # Types Supabase (Row, Insert, Update)
└── middleware.ts             # Protection routes et rôles
```

### Pattern de colocation par feature
```
src/app/admin/reservations/
├── page.tsx                    # Page orchestrateur ('use client')
├── components/                 # Composants locaux extraits
│   ├── stats-cards.tsx
│   ├── filters-section.tsx
│   ├── reservations-content.tsx
│   └── index.ts               # Barrel export
└── hooks/                     # Hooks locaux
    └── use-reservation-filters.ts
```

### Pattern Service Layer
```
lib/services/admin-reservations/
├── index.ts           # Exports publics
├── types.ts           # Interfaces spécifiques
├── constants.ts       # Constantes métier
├── list.ts            # Requêtes liste/recherche
├── detail.ts          # Requête détail
├── mutations.ts       # Create/Update/Delete
├── stats.ts           # Statistiques
├── filters.ts         # Logique de filtrage
└── transformers.ts    # Transformation données
```

## Rôles utilisateurs

| Rôle | Accès | Population |
|------|-------|------------|
| **super-admin** | Accès complet système | 2-3 |
| **admin** | Gestion spectacles/réservations/salles | 3-7 |
| **externe** | Check-in sur spectacles assignés | 10-20 |
| **professional** | Découverte et réservation | 500-1000 |
| **company** | Statistiques de ses spectacles | 15-20 |

### Middleware et protection
```typescript
// Routes protégées par rôle
ADMIN_ROLES = ['super-admin', 'admin', 'externe']
FULL_ADMIN_ROLES = ['super-admin', 'admin']  // Accès complet admin
RESTRICTED_ADMIN_ROUTES = ['/admin/lieux', '/admin/compagnies', '/admin/utilisateurs']
```

## Base de données

### Tables principales
```
companies (Compagnies)
  └── shows (Spectacles)
      ├── slots (Créneaux/Représentations)
      │   └── reservations (Réservations)
      ├── show_target_audience_mapping [N-N] → target_audiences
      └── show_category_mapping [N-N] → show_categories

profiles (Utilisateurs)
  ├── user_roles (Rôle unique par user)
  └── user_show_assignments (Assignations externes)

venues (Salles)
  └── slots (Créneaux)
```

### Statuts et enums
```typescript
UserRole = 'super-admin' | 'admin' | 'professional' | 'company' | 'externe'
ShowStatus = 'draft' | 'published' | 'archived'
ReservationStatus = 'confirmed' | 'cancelled' | 'no_show'
CheckinStatus = 'present_loved' | 'present_press' | 'present_neutral' | 'absent'
SlotHostedBy = 'derviche' | 'company' | 'externe'
ReservationSource = 'public' | 'admin'
```

### Champs CDC V4 (récents)
- **venues** : capacity, pmr_accessible, parking, transports
- **shows** : period, derviche_manager_id, invitation_policy, folder_url, teaser_url, captation_available, captation_url
- **companies** : city, contact_name
- **slots** : hosted_by_id (personne assurant l'accueil)
- **reservations** : guest_email_secondary, guest_phone_secondary, guest_address, guest_postal_code, guest_city, guest_country
- **profiles** : disabled_at (désactivation temporaire)

### Champs IDs CRM Zoho (S174 + S175)
- **venues.crm_id** : TEXT, index unique partiel `WHERE crm_id IS NOT NULL`. Saisie sur la fiche lieu.
- **profiles.crm_id** : TEXT, index unique partiel. Saisie sur la fiche pro. **Source de vérité** pour les résa avec compte.
- **reservations.crm_id** : TEXT, pas d'unicité. Renseigné uniquement pour les résa guest (`user_id IS NULL`). Pour les résa pro, lire `profiles.crm_id` via la jointure `booked_by:user_id (crm_id)`.

Format : ~17 chiffres (IDs Zoho actuels), mais le TEXT absorbe tout futur changement de format CRM. Validation côté UI : sanitization numérique-uniquement à la frappe (`CrmIdInput`).

### Politiques RLS clés
- **profiles** : Chacun voit son profil, admin voit tous
- **shows** : Public voit publiés, admin voit tous, externe voit assignés, company voit les siens
- **reservations** : Propriétaire + Admin + Externe (si assigné) + Company (check-in si hosted_by='company')

## Patterns de code

### Server vs Client Components
```typescript
// Server Component (par défaut) - Pas de directive
export default async function Page() {
  const data = await fetchData(); // Côté serveur
  return <div>{data}</div>;
}

// Client Component - Avec directive
'use client';
export default function InteractivePage() {
  const [state, setState] = useState(); // Hooks React
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### Clients Supabase
```typescript
// Client navigateur (singleton)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server Component / Route Handler
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Admin (bypass RLS) - Server uniquement
import { createAdminClient } from '@/lib/supabase/server-admin';
const supabase = createAdminClient();
```

### Formulaires avec Zod
```typescript
const schema = z.object({
  email: z.string().email('Email invalide'),
  num_places: z.number().min(1).max(10),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { email: '', num_places: 1 },
});
```

### Pattern ApiResult
```typescript
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

// Usage dans les services
export async function updateReservation(id: string, data: UpdateData): Promise<ApiResult<Reservation>> {
  try {
    // ... logique
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Erreur de mise à jour' };
  }
}
```

### Hook personnalisé type
```typescript
export function useAdminReservations(pageSize = 50) {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async (filters: Filters) => {
    setIsLoading(true);
    const result = await getAdminReservations(filters, { page: 1, pageSize });
    if (result.success) setReservations(result.data.reservations);
    else setError(result.error);
    setIsLoading(false);
  }, [pageSize]);

  return { reservations, isLoading, error, loadReservations };
}
```

## Fichiers importants

| Fichier | Description |
|---------|-------------|
| `src/types/database.ts` | Types Supabase (source de vérité) |
| `src/middleware.ts` | Protection routes par rôle |
| `src/lib/services/admin-reservations/` | Logique métier réservations |
| `src/lib/services/shows/` | Logique métier spectacles |
| `src/hooks/useAdminReservations.ts` | Hook principal réservations admin |
| `supabase/migrations/` | Évolution schéma DB |
| `docs/CDC_MISE_A_JOUR_V4.md` | Spécifications V4 |

## Conventions de style

- **Path alias** : `@/*` → `./src/*`
- **Quotes** : Single quotes
- **Semicolons** : Oui
- **Indentation** : 2 espaces
- **Print width** : 100 caractères
- **Tri classes** : prettier-plugin-tailwindcss
- **Icons** : lucide-react
- **Toasts** : sonner
- **Langue code** : Anglais (variables, fonctions)
- **Langue UI** : Français

## Règles métier importantes

### Réservations
- `max_reservations_per_booking` : 1 à 10 places par réservation
- Réservation guest : `user_id = NULL`, champs `guest_*` obligatoires
- Réservation admin : `source = 'admin'`, `created_by_user_id` renseigné
- Check-in : met à jour `checkin_status`, `checkin_at`, `checkin_by`

### Gestion accueil (hosted_by)
- `derviche` : Admin/externe Derviche assure le check-in
- `company` : La compagnie assure le check-in
- `externe` : Externe assigné assure le check-in
- **Contrainte** : Si `hosted_by = 'company'` alors `hosted_by_id` DOIT être NULL

### Rôle company
- Un utilisateur `company` DOIT avoir un `company_id` renseigné
- Trigger empêche la suppression du `company_id` si rôle = company

### Soft delete
- Tables avec `deleted_at` : companies, profiles, venues, shows
- Compte désactivé : `profiles.disabled_at` (temporaire, pas supprimé)

## Anti-patterns à éviter

1. **Ne pas mélanger Server/Client** sans `'use client'` explicite
2. **Ne pas fetch dans useEffect** → utiliser Server Components ou React Query
3. **Ne pas hardcoder** les strings magiques → utiliser `lib/constants/`
4. **Ne pas ignorer RLS** → vérifier les politiques correspondent aux rôles
5. **Ne pas commit les env vars** → `.env.example` + `.env.local`
6. **Ne pas utiliser `createAdminClient`** côté client (service_role = danger)
7. **Ne pas oublier la pagination** pour les listes volumineuses
8. **Ne pas ignorer `deleted_at`** dans les requêtes (soft delete)

## Workflows principaux

### Réservation publique
1. Professionnel consulte catalogue (`/spectacle/[slug]`)
2. Sélectionne un créneau disponible
3. Remplit formulaire (guest ou connecté)
4. Confirmation + email

### Check-in (PWA)
1. Staff accède `/accueil`
2. Sélectionne spectacle puis créneau
3. Recherche réservation (nom, email)
4. Coche présent (loved/press/neutral) ou absent
5. Capacité mise à jour automatiquement

### Gestion admin
1. Création spectacle (draft)
2. Ajout créneaux (représentations)
3. Publication (status = published)
4. Suivi réservations + export Excel/CSV

---

## 📚 Documentation utilisateur — Règle absolue

**Avant tout merge sur `main`** qui touche à une fonctionnalité visible pour les utilisateurs admin, super-admin, externe ou company (ou toute zone publique impactée), la documentation correspondante dans `src/app/admin/aide/content/` doit être **mise à jour ou créée**.

### Critère de déclenchement

Si le commit modifie un fichier dans l'un de ces dossiers :
- `src/app/admin/**`
- `src/app/accueil/**`
- `src/app/(public)/**` (si comportement visible)
- `src/components/admin/**`
- `src/components/accueil/**`

→ vérifier que le ou les articles MDX correspondants sont à jour (titre, contenu, keywords du frontmatter).

### Checklist obligatoire avant merge main

- [ ] L'article MDX impacté a été mis à jour dans le même commit/PR
- [ ] Les `keywords` du frontmatter couvrent les nouveaux termes de la feature
- [ ] Si nouvelle fonctionnalité : **nouvel article créé** + lien dans la sidebar via `category` + `order`
- [ ] L'index de recherche `public/help-index.json` sera régénéré au build (automatique via `prebuild`)
- [ ] Les liens internes entre articles (`[…](/admin/aide/…)`) restent valides

### Exemple

Session qui ajoute un toggle sur un template email → mettre à jour :
- `content/emails/vue-ensemble.mdx` (liste des options visibles)
- `content/preferences/templates.mdx` si édition concernée (V2)
- Potentiellement `content/checkin-pwa/emails-post-accueil.mdx` si impact utilisateur final

### Pour localiser les articles à toucher

- Rechercher des mots-clés dans `src/app/admin/aide/content/` avec votre éditeur
- Consulter la sidebar en live (`/admin/aide`) pour voir où se placerait le nouvel article
- En cas de doute, privilégier la mise à jour plutôt que l'omission
