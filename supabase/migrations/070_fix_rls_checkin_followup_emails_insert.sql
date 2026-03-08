-- ============================================
-- Migration 070 : Renforcer RLS INSERT checkin_followup_emails
-- Derviche Diffusion - Session S147 (correctif post-audit)
-- ============================================
-- La migration 068 avait WITH CHECK (true) trop permissive.
-- Ce correctif restreint l'INSERT aux rôles autorisés.
-- L'écriture reste principalement effectuée via service role (API),
-- qui bypass le RLS. Cette policy protège l'accès direct client.
-- ============================================

DROP POLICY IF EXISTS "checkin_followup_emails_insert" ON public.checkin_followup_emails;

CREATE POLICY "checkin_followup_emails_insert"
  ON public.checkin_followup_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin', 'externe', 'company')
    )
  );

COMMENT ON POLICY "checkin_followup_emails_insert" ON public.checkin_followup_emails
  IS 'INSERT restreint aux rôles autorisés. L''écriture métier passe par le service role (API /send-checkin-followup).';
