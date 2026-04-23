-- ============================================
-- Migration 115: Admin peut VOIR les super-admin (mais pas les modifier)
-- Derviche Diffusion
-- Date: 2026-04-23
-- ============================================
-- CONTEXTE :
--   La policy `user_roles_select_admin` (migration 005 L92-95) filtrait
--   `role != 'super-admin'`, ce qui masquait les super-admin de la liste
--   /admin/utilisateurs pour les comptes admin.
--
-- DÉCISION PRODUIT :
--   Les admins doivent VOIR les comptes super-admin dans le tableau des
--   utilisateurs (transparence sur la chaîne d'autorité). Ils ne peuvent
--   toujours PAS les modifier / supprimer / désactiver — ces actions
--   sont bloquées :
--     - côté UI (helpers canEditUser/canDeleteUser/canToggleUserStatus)
--     - côté API (fix sécurité commit 72a66e9 : routes POST/PATCH/DELETE
--       refusent les mutations touchant un super-admin si acteur ≠ super-admin)
--     - côté RLS user_roles : la policy `user_roles_all_super_admin` reste
--       seule à autoriser INSERT/UPDATE/DELETE (super-admin uniquement)
--
-- CORRECTION :
--   Retirer le filtre `role != 'super-admin'` de `user_roles_select_admin`.
--   L'admin pourra lire la ligne `user_roles` des super-admins mais pas
--   la modifier.
--
-- EFFET DE BORD POSITIF :
--   Fixe aussi l'audit Cursor précédent (commit 3bc14be) : le
--   `deriveBookedBy` d'admin-reservations pourra maintenant lire le rôle
--   exact d'un super-admin au lieu de tomber sur le fallback 'back-office'.
-- ============================================

-- Remplacer la policy SELECT pour admin (retire le filtre role != 'super-admin')
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;

CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role('admin'));

COMMENT ON POLICY "user_roles_select_admin" ON public.user_roles IS
  'Admin peut voir TOUS les rôles (y compris super-admin). '
  'Les modifications restent réservées à super-admin via user_roles_all_super_admin. '
  'Migration 115 (2026-04-23).';
