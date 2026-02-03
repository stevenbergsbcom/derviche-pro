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
