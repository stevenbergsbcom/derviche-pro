-- ============================================
-- MIGRATION 005 : Politiques RLS (Row Level Security)
-- Derviche Diffusion - Plateforme de réservation
-- VERSION CORRIGÉE
-- ============================================

-- ============================================
-- ACTIVATION RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_show_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rgpd_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================

-- Utilisateurs : voir leur propre profil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

-- Utilisateurs : modifier leur propre profil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid() AND deleted_at IS NULL);

-- Super-admin et admin : voir tous les profils non supprimés
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super() AND deleted_at IS NULL);

-- Super-admin et admin : modifier tous les profils (pour check-in, etc.)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super() AND deleted_at IS NULL)
  WITH CHECK (public.is_admin_or_super());

-- Super-admin : créer des profils
CREATE POLICY "profiles_insert_super_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Externe-DD : voir les profils (pour check-in de leurs spectacles)
CREATE POLICY "profiles_select_externe_dd"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role('externe-dd') AND deleted_at IS NULL);

-- Externe-DD : modifier les profils (pour check-in) - R-EXT-03
CREATE POLICY "profiles_update_externe_dd"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role('externe-dd') AND deleted_at IS NULL);

-- ============================================
-- USER_ROLES
-- ============================================

-- Utilisateurs : voir leur propre rôle
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super-admin : tout gérer (R-ROLE-02)
CREATE POLICY "user_roles_all_super_admin"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Admin : voir tous les rôles (sauf super-admin)
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role('admin') AND role != 'super-admin');

-- ============================================
-- USER_SHOW_ASSIGNMENTS
-- ============================================

-- Super-admin : tout gérer (R-ROLE-04)
CREATE POLICY "user_show_assignments_all_super_admin"
  ON public.user_show_assignments FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Externe-DD : voir ses propres assignations
CREATE POLICY "user_show_assignments_select_own"
  ON public.user_show_assignments FOR SELECT
  TO authenticated
  USING (public.has_role('externe-dd') AND user_id = auth.uid());

-- Admin : voir toutes les assignations
CREATE POLICY "user_show_assignments_select_admin"
  ON public.user_show_assignments FOR SELECT
  TO authenticated
  USING (public.has_role('admin'));

-- ============================================
-- COMPANIES
-- ============================================

-- Public : voir les compagnies non supprimées (pour affichage catalogue)
CREATE POLICY "companies_select_public"
  ON public.companies FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);

-- Admin et super-admin : tout gérer
CREATE POLICY "companies_all_admin"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- ============================================
-- VENUES
-- ============================================

-- Public : voir les salles non supprimées
CREATE POLICY "venues_select_public"
  ON public.venues FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);

-- Admin et super-admin : tout gérer
CREATE POLICY "venues_all_admin"
  ON public.venues FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- ============================================
-- SHOW_CATEGORIES
-- ============================================

-- Public : voir toutes les catégories
CREATE POLICY "show_categories_select_public"
  ON public.show_categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin et super-admin : tout gérer
CREATE POLICY "show_categories_all_admin"
  ON public.show_categories FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- ============================================
-- SHOWS
-- ============================================

-- Public : voir les spectacles publiés non supprimés (R-SHOW-06, R-SHOW-07)
CREATE POLICY "shows_select_public"
  ON public.shows FOR SELECT
  TO authenticated, anon
  USING (status = 'published' AND deleted_at IS NULL);

-- Admin et super-admin : tout voir et gérer
CREATE POLICY "shows_all_admin"
  ON public.shows FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- Externe-DD : voir les spectacles assignés (R-EXT-01)
CREATE POLICY "shows_select_externe_dd"
  ON public.shows FOR SELECT
  TO authenticated
  USING (
    public.has_role('externe-dd') 
    AND public.externe_has_access_to_show(id)
    AND deleted_at IS NULL
  );

-- Compagnies : voir leurs propres spectacles
CREATE POLICY "shows_select_company"
  ON public.shows FOR SELECT
  TO authenticated
  USING (
    public.has_role('company')
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- ============================================
-- SHOW_CATEGORY_MAPPING
-- ============================================

-- Public : voir les associations
CREATE POLICY "show_category_mapping_select_public"
  ON public.show_category_mapping FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin et super-admin : gérer les associations
CREATE POLICY "show_category_mapping_all_admin"
  ON public.show_category_mapping FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- ============================================
-- SLOTS
-- ============================================

-- Public : voir les créneaux des spectacles publiés
CREATE POLICY "slots_select_public"
  ON public.slots FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.shows
      WHERE shows.id = slots.show_id
      AND shows.status = 'published'
      AND shows.deleted_at IS NULL
    )
  );

-- Admin et super-admin : tout voir et gérer
CREATE POLICY "slots_all_admin"
  ON public.slots FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- Externe-DD : voir les créneaux de leurs spectacles assignés
CREATE POLICY "slots_select_externe_dd"
  ON public.slots FOR SELECT
  TO authenticated
  USING (
    public.has_role('externe-dd')
    AND public.externe_has_access_to_show(show_id)
  );

-- Compagnies : voir les créneaux de leurs spectacles
CREATE POLICY "slots_select_company"
  ON public.slots FOR SELECT
  TO authenticated
  USING (
    public.has_role('company')
    AND EXISTS (
      SELECT 1 FROM public.shows
      WHERE shows.id = slots.show_id
      AND shows.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- RESERVATIONS
-- ============================================

-- Public (connecté ou non) : créer une réservation
CREATE POLICY "reservations_insert_public"
  ON public.reservations FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Utilisateurs : voir leurs propres réservations
CREATE POLICY "reservations_select_own"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Utilisateurs : modifier leurs propres réservations
CREATE POLICY "reservations_update_own"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin et super-admin : tout voir et gérer
CREATE POLICY "reservations_all_admin"
  ON public.reservations FOR ALL
  TO authenticated
  USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- Externe-DD : voir les réservations de leurs spectacles assignés (R-EXT-04)
CREATE POLICY "reservations_select_externe_dd"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    public.has_role('externe-dd')
    AND EXISTS (
      SELECT 1 FROM public.slots
      WHERE slots.id = reservations.slot_id
      AND public.externe_has_access_to_show(slots.show_id)
    )
  );

-- Externe-DD : créer des réservations sur leurs spectacles assignés (R-EXT-04)
CREATE POLICY "reservations_insert_externe_dd"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role('externe-dd')
    AND EXISTS (
      SELECT 1 FROM public.slots
      WHERE slots.id = slot_id
      AND public.externe_has_access_to_show(slots.show_id)
    )
  );

-- Externe-DD : modifier les réservations de leurs spectacles assignés (R-EXT-04)
CREATE POLICY "reservations_update_externe_dd"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    public.has_role('externe-dd')
    AND EXISTS (
      SELECT 1 FROM public.slots
      WHERE slots.id = reservations.slot_id
      AND public.externe_has_access_to_show(slots.show_id)
    )
  );

-- Externe-DD : supprimer (annuler) les réservations de leurs spectacles assignés (R-EXT-04)
CREATE POLICY "reservations_delete_externe_dd"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (
    public.has_role('externe-dd')
    AND EXISTS (
      SELECT 1 FROM public.slots
      WHERE slots.id = reservations.slot_id
      AND public.externe_has_access_to_show(slots.show_id)
    )
  );

-- Compagnies : voir les réservations de leurs spectacles
CREATE POLICY "reservations_select_company"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    public.has_role('company')
    AND EXISTS (
      SELECT 1 FROM public.slots
      JOIN public.shows ON slots.show_id = shows.id
      WHERE slots.id = reservations.slot_id
      AND shows.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Compagnies : modifier check-in SI hosted_by = 'company' (R-CHECKIN-03)
CREATE POLICY "reservations_checkin_company"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    public.has_role('company')
    AND EXISTS (
      SELECT 1 FROM public.slots
      JOIN public.shows ON slots.show_id = shows.id
      WHERE slots.id = reservations.slot_id
      AND shows.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND slots.hosted_by = 'company'
    )
  );

-- ============================================
-- APP_SETTINGS
-- ============================================

-- Super-admin : tout gérer
CREATE POLICY "app_settings_all_super_admin"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Admin : lecture seule
CREATE POLICY "app_settings_select_admin"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (public.has_role('admin'));

-- ============================================
-- SENT_NOTIFICATIONS
-- ============================================

-- Admin et super-admin : tout voir
CREATE POLICY "sent_notifications_select_admin"
  ON public.sent_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super());

-- Système : insertion (via fonctions SECURITY DEFINER)
CREATE POLICY "sent_notifications_insert_system"
  ON public.sent_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_super());

-- ============================================
-- AUDIT_LOGS
-- ============================================

-- Super-admin : tout voir
CREATE POLICY "audit_logs_select_super_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Système : insertion (ouvert car géré par fonction SECURITY DEFINER)
CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- RGPD_REQUESTS
-- ============================================

-- Utilisateurs : voir leurs propres demandes
CREATE POLICY "rgpd_requests_select_own"
  ON public.rgpd_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Utilisateurs : créer une demande
CREATE POLICY "rgpd_requests_insert_own"
  ON public.rgpd_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Super-admin : tout gérer
CREATE POLICY "rgpd_requests_all_super_admin"
  ON public.rgpd_requests FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());