# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 119

---

## Fonctionnalités par zone

### ✅ Auth & Rôles (100%)
- Login, register, forgot/reset password
- Callback OAuth Supabase
- Middleware : protection par rôle, redirection, compte désactivé
- Vérification mot de passe (API)

### ✅ Public - Catalogue & Réservation (100%)
- Liste des spectacles (public)
- Détail spectacle par slug
- Formulaire réservation (guest ou connecté)
- Confirmation de réservation

### ✅ Check-in PWA (100%)
- Flux : spectacles → créneaux → liste réservations
- Recherche
- Check-in (présent/absent)
- Annulation
- Transfert

### ✅ Admin (100%)
| Module | État |
|--------|------|
| Dashboard | ✅ Stats, liens rapides, résas récentes, créneaux à venir |
| Réservations | ✅ Liste, filtres, pagination, détail, CRUD, check-in, export |
| Spectacles | ✅ Liste, filtres, CRUD, catégories, publics cibles, médias |
| Représentations | ✅ Créneaux par spectacle, CRUD, série de dates, capacité |
| Lieux | ✅ CRUD salles (venues) |
| Compagnies | ✅ CRUD, liaison utilisateur |
| Utilisateurs | ✅ Liste, filtres, CRUD, rôle, statut, API |
| Préférences | ✅ Organisation, Apparence (thème + logos), Email, Rappels, RGPD |

### ✅ Company (100%)
- Dashboard compagnie
- Liste/filtres réservations
- Statistiques
- Export
- Mon compte

### ✅ Autres (100%)
- Thème & logos dynamiques (presets, upload Supabase)
- PWA : service worker, manifest
- Export Excel/CSV (admin + company)
- Sidebar partagée (logo dynamique, logout)

---

## Dernier travail (Session 118)

**Page /admin/preferences complète :**
- 5 sections : Organisation, Apparence, Email, Rappels, RGPD
- Accès restreint aux super-admins
- Dialog de confirmation avant quitter avec modifications non sauvegardées
- Pattern `isInitialized` + `onDirtyChangeRef` appliqué partout

**Commit :** `feat(preferences): ajout confirmation avant quitter avec modifications non sauvegardées`

---

## À faire

### Priorité immédiate
- [ ] Merger dev → main

### Améliorations possibles (Préférences)
Liste de 20 améliorations identifiées (à prioriser)

---

## Points d'attention techniques

### TODO dans le code
| Fichier | Description |
|---------|-------------|
| `lib/services/user-preferences.ts` | Regénérer types Supabase après changement schéma |
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `app/admin/mon-compte/page.tsx` (~148) | Afficher notification de succès |

### Exports manquants (optionnel)
- `lib/services/index.ts` : n'exporte pas `app-settings` ni `storage`
- `hooks/index.ts` : n'exporte pas `useAppSettings` ni `useUnsavedChangesWarning`

### À vérifier
- Routes "maquettes" dans le middleware (`/admin-dashboard`, `/admin-reservations`, `/checkin`) : clarifier si anciennes routes ou alias
