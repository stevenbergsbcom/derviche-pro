# Statut du projet - Derviche Pro

> Dernière mise à jour : Session 121

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
| Préférences | ✅ Organisation, Apparence (thème + logos), Email, Rappels, RGPD + badges statut |

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

## Dernier travail (Session 121)

**Préférences admin — indicateurs de statut :**
- Badges de statut (Actif / Partiel / Non connecté) sur chaque onglet
- Composant `InactiveSectionBanner` créé et intégré dans Email, Rappels, RGPD
- Dette documentée dans STATUT.md

**Admin mon-compte — suppression des données mock :**
- Page connectée à Supabase (profil + rôle chargés en parallèle)
- Sauvegarde réelle en base de données
- Changement de mot de passe fonctionnel via `/api/auth/verify-password`
- Skeleton de chargement + gestion des erreurs

**Commit :** `fix(admin): connecter mon-compte à Supabase, suppression données mock`

---

## Travail précédent (Session 120)

**Nettoyage technique :**
- Regénération types Supabase
- Ajout exports manquants dans `lib/services/index.ts` (app-settings, storage)
- Ajout exports manquants dans `hooks/index.ts` (useAppSettings, useUnsavedChangesWarning)
- Complétion barrel `storage/index.ts` (logoStorage)
- Nettoyage middleware (suppression routes fantômes /admin-reservations, /checkin)
- Ajout toast notifications dans mon-compte (profil + mot de passe)
- Correction rôles UserRole dans mon-compte (externe, professional, company)

**Commit :** `chore: nettoyage technique Session 120`

---

## À faire

### Améliorations possibles (Préférences)
Liste de 20 améliorations identifiées (à prioriser)

🚀 AMÉLIORATIONS DE FONCTIONNALITÉS
1. Confirmation avant de quitter avec des changements non sauvegardés
Actuellement, si l'utilisateur change d'onglet ou quitte la page avec des modifications non enregistrées, il perd tout sans avertissement.
Proposition :

Ajouter un useBeforeUnload pour bloquer la fermeture du navigateur
Ajouter une confirmation lors du changement d'onglet si hasChanges === true


2. Bouton "Annuler les modifications"
L'utilisateur peut modifier des champs mais n'a pas de moyen de revenir à l'état initial sans recharger la page.
Proposition :

Ajouter un bouton "Annuler" à côté de "Enregistrer" dans SettingsCard
Appeler reset() de React Hook Form ou refresh() du hook


3. Historique des modifications (audit log)
Pour la traçabilité RGPD et la gestion d'équipe, savoir qui a modifié quoi et quand.
Proposition :

Afficher "Dernière modification : [date] par [user]" sous chaque section
Stocker updated_by et updated_at dans app_settings


4. Test d'envoi d'email
Dans la section Email, permettre de tester la configuration.
Proposition :

Bouton "Envoyer un email de test" qui envoie à l'utilisateur connecté
Feedback visuel : succès/échec


5. Preview du thème en temps réel
Actuellement le thème est appliqué seulement après sauvegarde.
Proposition :

Appliquer le thème temporairement au survol ou à la sélection
Rollback si l'utilisateur annule ou change d'onglet


6. Import/Export des paramètres
Pour faciliter la migration ou le backup.
Proposition :

Bouton "Exporter en JSON" (super-admin uniquement)
Bouton "Importer" avec validation


7. Notifications par section
Savoir quelles sections ont été modifiées récemment.
Proposition :

Badge "Modifié" ou pastille sur l'onglet si modification < 24h
Utile quand plusieurs super-admins travaillent


🎨 AMÉLIORATIONS DE STYLE / UX
8. Indicateur visuel des changements non sauvegardés
L'utilisateur ne voit pas clairement qu'il a des modifications en attente.
Proposition :

Point rouge ou badge sur le bouton "Enregistrer"
Bordure colorée sur la card modifiée
Message sticky en haut : "Vous avez des modifications non enregistrées"


9. Animation de sauvegarde
Feedback plus satisfaisant lors de l'enregistrement.
Proposition :

Animation de check (✓) qui apparaît après succès
Transition douce sur le bouton (gris → vert → retour)


10. Mode sombre pour la preview de thème
La preview ne montre que le mode light actuellement.
Proposition :

Toggle "Light / Dark" dans la preview de chaque thème
Ou afficher les deux côte à côte


11. Meilleure hiérarchie visuelle des sections
Les 5 onglets sont au même niveau visuellement.
Proposition :

Grouper : "Identité" (Organisation, Apparence) et "Technique" (Email, Rappels, RGPD)
Ou ajouter des icônes de couleurs différentes par catégorie


12. Skeleton plus réaliste
Le skeleton actuel est générique.
Proposition :

Skeleton qui imite la vraie structure de chaque section
Par exemple pour Rappels : 3 rectangles avec switch à droite


13. Tooltips d'aide
Certains paramètres peuvent être confus (RGPD notamment).
Proposition :

Icône (?) à côté des labels complexes
Tooltip au survol avec explication détaillée


14. Responsive amélioré pour les onglets
Sur mobile, 2 colonnes avec icônes seules peut être confus.
Proposition :

Sur mobile : liste verticale avec icône + label
Ou menu déroulant "Section : Organisation ▼"


⚡ AMÉLIORATIONS DE PERFORMANCE
15. Éviter le re-fetch à chaque changement d'onglet
Actuellement chaque section fait son propre fetch au montage.
Proposition :

Créer un useAllAppSettings() qui charge tout en une requête
Ou utiliser un cache global (React Context ou Zustand)
Les sections reçoivent les données en props


16. Debounce sur la détection des changements
useEffect sur isDirty se déclenche à chaque frappe.
Proposition :

Debounce de 300ms pour éviter les re-renders inutiles
Surtout utile si on ajoute des indicateurs visuels


17. Lazy loading des sections
Charger uniquement la section active.
Proposition :
tsxconst OrganizationSection = dynamic(() => import('./sections/organization-section'), {
  loading: () => <SectionSkeleton />
});

Réduit le bundle initial
Charge les autres sections à la demande


18. Optimistic UI pour le thème
Déjà partiellement fait, mais peut être amélioré.
Proposition :

Appliquer le thème immédiatement au clic (pas au submit)
Rollback seulement si erreur serveur
UX plus fluide


19. Batch des updates dans setAppSettings
Actuellement les updates se font en boucle séquentielle.
Proposition :

Utiliser une transaction Supabase ou une RPC
CALL update_app_settings_batch(jsonb)
Une seule requête au lieu de N


20. Mémoïsation des composants
Les sections se re-rendent même si leurs données n'ont pas changé.
Proposition :

React.memo() sur les sections
useMemo pour les valeurs dérivées (ex: displayUrl)


📋 RÉCAPITULATIF PAR PRIORITÉ
PrioritéAméliorationEffortImpact🔴 Haute#1 Confirmation avant quitterFaibleÉlevé🔴 Haute#8 Indicateur changementsFaibleÉlevé🔴 Haute#15 Cache global settingsMoyenÉlevé🟠 Moyenne#2 Bouton AnnulerFaibleMoyen🟠 Moyenne#4 Test emailMoyenMoyen🟠 Moyenne#13 Tooltips d'aideFaibleMoyen🟠 Moyenne#19 Batch updatesMoyenMoyen🟢 Basse#5 Preview thème temps réelMoyenFaible🟢 Basse#17 Lazy loadingFaibleFaible🟢 Future#3 Historique auditÉlevéMoyen🟢 Future#6 Import/ExportMoyenFaible

---

## ⚠️ DETTE TECHNIQUE — Section Préférences Admin

**Date d'audit :** 18 février 2026  
**Statut :** Données sauvegardées mais non consommées

### Sections et leur état réel

| Section | Données stockées | Utilisées | Bloquant |
|---|---|---|---|
| Apparence | Thème + logos | ✅ Sidebar admin | Non |
| Organisation | Nom, email, tél, adresse | ⚠️ Seulement `organization_name` (alt logo sidebar) | Non |
| Email | `email_from_name`, `email_from_address` | ❌ Aucun système email existant | Oui |
| Rappels | `reminder_enabled_7d/2d/12h` | ❌ Aucun job planifié | Oui |
| RGPD | Durées de conservation | ❌ Aucune purge automatique | Oui |

### Fonctionnalités à construire pour activer ces sections
- [ ] Système d'envoi d'emails transactionnels (confirmation réservation, annulation)
- [ ] Affichage de `organization_name` dans les emails et le catalogue public
- [ ] Job planifié pour les rappels automatiques (Vercel Cron ou Supabase pg_cron)
- [ ] Job de purge RGPD automatique

---

## Points d'attention techniques

### TODO dans le code
| Fichier | Description |
|---------|-------------|
| `hooks/useRepresentationForm.ts` (~148) | Champ à rendre obligatoire quand `useDervisheUsers` implémenté |
| `app/admin/mon-compte/page.tsx` | ✅ Connecté à Supabase (Session 121) |
