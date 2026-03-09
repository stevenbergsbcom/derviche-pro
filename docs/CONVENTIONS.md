# Conventions & Patterns - Derviche Pro

## Patterns de code

### Server vs Client
- **Par défaut** : pas de `'use client'`
- **`'use client'`** : uniquement si hooks, événements ou APIs navigateur

### Résultats métier
Pattern `ApiResult<T>` / `AppSettingResult<T>` :
```typescript
{ data, error }
// ou
{ success, data?, error? }
```

### Services
Un dossier par domaine sous `lib/services/` :
```
lib/services/
├── admin-reservations/
│   ├── index.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── list.ts
│   ├── detail.ts
│   ├── mutations.ts
│   ├── filters.ts
│   └── transformers.ts
├── shows/
├── checkin/
├── app-settings/
└── ...
```

### Formulaires
- React Hook Form + `zodResolver(schema)`
- Schémas Zod dans le composant ou fichier dédié

### Colocation par feature
```
app/<zone>/<feature>/
├── page.tsx
├── components/
├── hooks/
├── constants/
├── types.ts
└── index.ts (barrel)
```

### Préférences (unsaved changes)
- État "dirty" par section
- `onDirtyChange` avec ref (`onDirtyChangeRef`)
- `isInitialized` pour éviter faux positifs au chargement
- Dialog de confirmation + `useUnsavedChangesWarning` (beforeunload)

---

## Conventions de nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Dossiers | kebab-case | `admin-reservations`, `shared-sidebar` |
| Composants | PascalCase | `SidebarLogo.tsx`, `ReservationCard.tsx` |
| Hooks | use + PascalCase | `useAdminReservations.ts` |
| Utils / services | camelCase | `formatDate`, `getThemeSettings` |
| Types | PascalCase | `UserRole`, `AdminReservationRow` |

---

## Structure des composants

1. Directive `'use client'` (si besoin)
2. Imports
3. Types / Props
4. Composant principal (export nommé)
5. Sous-composants ou helpers

### Sections de préférences
Interface commune :
```typescript
{ canEdit: boolean, onDirtyChange?: (dirty: boolean) => void }
```
Pattern : `isInitialized` + ref pour notifier le parent

### Barrels
`index.ts` par dossier pour réexporter

### Ordre des imports
1. React
2. Externes
3. Composants
4. Hooks
5. Lib
6. Types

Alias : `@/` → `./src/*`

---

## Pièges connus & leçons retenues

### ⚠️ Timezone — ne jamais utiliser `.toISOString()` pour des dates locales

**Problème** : `.toISOString()` convertit en UTC avant d'extraire la date. Pour un utilisateur en UTC+1 ou UTC+2, cette ligne retourne la date de la veille après 23h :
```typescript
// ❌ FAUX — peut retourner la mauvaise date en timezone non-UTC
const today = new Date().toISOString().split('T')[0];
```

**Solution** : toujours utiliser les méthodes locales :
```typescript
// ✅ CORRECT — date locale garantie quel que soit le fuseau
function toLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

**Fichiers corrigés (S154)** : `period.ts`, `admin-dashboard/helpers.ts`, `checkin/helpers.ts`, `slots-24h.ts`

**Exception** : pour les bornes de requêtes Supabase (comparaison avec des timestamps UTC en base), utiliser `Date.UTC()` explicitement — voir `startOfTodayUTC()` dans `rate-limit-widget.tsx`.

### ⚠️ Race condition — `setState` + appel async immédiat

**Problème** : `setState` est asynchrone. Appeler une fonction qui dépend du nouveau state juste après `setState` utilise l'ancienne valeur (closure stale) :
```typescript
// ❌ FAUX — refresh() voit l'ancienne valeur de period
onChange={(p) => { setPeriod(p); void refresh(); }}
```

**Solution** : si la fonction est dans un `useEffect` avec la variable en dépendance, le changement de state déclenchera automatiquement le rechargement :
```typescript
// ✅ CORRECT — l'effet se re-exécute quand period change
onChange={(p) => { setPeriod(p); }}
// ... dans le hook :
useEffect(() => { void loadDashboard(); }, [loadDashboard, period]);
```

### ⚠️ `flex-row` direct sur `CardHeader` shadcn — texte invisible

**Problème** : appliquer `flex flex-row` directement sur le composant `CardHeader` de shadcn/ui entre en conflit avec ses pseudo-sélecteurs CSS internes. Le `CardTitle` enfant hérite d'une couleur transparente et devient invisible sur fond blanc.

**Solution** : ne jamais mettre `flex-row` sur `CardHeader`. Wrapper le contenu dans un `div` si layout flex nécessaire :
```tsx
// ❌ FAUX
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>Titre</CardTitle>
  <Button>Action</Button>
</CardHeader>

// ✅ CORRECT
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>Titre</CardTitle>
    <Button>Action</Button>
  </div>
</CardHeader>
```

### ⚠️ `setAppSettings` / `upsert` pour les nouvelles clés

**Problème** : `setAppSettings` utilise `.update()` qui échoue silencieusement si la clé n'existe pas en base (0 lignes mises à jour, pas d'erreur Supabase).

**Solution** : utiliser `.upsert({ key, value }, { onConflict: 'key' })` pour les paramètres qui pourraient ne pas encore exister (ex : nouvelles migrations).
