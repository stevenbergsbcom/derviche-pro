-- ============================================
-- MIGRATION 004 : Tables Système
-- Derviche Diffusion - Plateforme de réservation
-- ============================================

-- ============================================
-- TABLE : app_settings (Configuration globale)
-- ============================================

CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_app_settings_key ON public.app_settings(key);

COMMENT ON TABLE public.app_settings IS 'Configuration globale de l''application (clé-valeur JSON)';

-- Valeurs par défaut
INSERT INTO public.app_settings (key, value, description) VALUES
  -- Informations organisation
  ('organization_name', '"Derviche Diffusion"', 'Nom de l''organisation'),
  ('organization_logo_url', 'null', 'URL du logo'),
  ('organization_contact_email', 'null', 'Email de contact principal'),
  ('organization_contact_phone', 'null', 'Téléphone de contact'),
  ('organization_website', 'null', 'Site web'),
  
  -- Configuration emails
  ('email_from_name', '"Derviche Diffusion"', 'Nom expéditeur des emails'),
  ('email_from_address', 'null', 'Adresse email expéditeur'),
  
  -- Configuration rappels automatiques
  ('reminder_enabled_7d', 'true', 'Activer rappel 7 jours avant'),
  ('reminder_enabled_2d', 'true', 'Activer rappel 2 jours avant'),
  ('reminder_enabled_12h', 'true', 'Activer rappel 12 heures avant'),
  
  -- RGPD
  ('rgpd_data_retention_months', '36', 'Durée de conservation des données en mois'),
  ('rgpd_inactive_account_months', '24', 'Suppression des comptes inactifs après X mois'),
  
  -- Rate limiting (par heure)
  ('rate_limit_auth_login', '10', 'Tentatives de connexion par heure'),
  ('rate_limit_auth_magic_link', '6', 'Demandes de magic link par heure'),
  ('rate_limit_auth_password_reset', '6', 'Demandes de reset password par heure'),
  ('rate_limit_reservations_create', '20', 'Créations de réservation par heure'),
  ('rate_limit_reservations_update', '40', 'Modifications de réservation par heure'),
  ('rate_limit_reservations_delete', '40', 'Suppressions de réservation par heure'),
  ('rate_limit_emails_manual', '100', 'Envois d''emails manuels par heure'),
  ('rate_limit_catalog_api', '200', 'Appels API catalogue par heure'),
  ('rate_limit_catalog_pages', '400', 'Pages catalogue par heure'),
  ('rate_limit_admin_operations', '100', 'Opérations admin par heure'),
  ('rate_limit_admin_exports', '20', 'Exports CSV par heure');

-- Trigger updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE : sent_notifications (Historique des emails)
-- ============================================

CREATE TABLE public.sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  
  -- Type de notification
  type TEXT NOT NULL CHECK (type IN (
    'confirmation',
    'modification', 
    'cancellation',
    'reminder_7d',
    'reminder_2d',
    'reminder_12h',
    'checkin_update',
    'welcome',
    'password_reset'
  )),
  
  -- Destinataire
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Statut d'envoi
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email_provider_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error TEXT,
  
  -- Métadonnées
  metadata JSONB
);

-- Index
CREATE INDEX idx_sent_notifications_reservation ON public.sent_notifications(reservation_id);
CREATE INDEX idx_sent_notifications_type ON public.sent_notifications(type);
CREATE INDEX idx_sent_notifications_sent_at ON public.sent_notifications(sent_at);
CREATE INDEX idx_sent_notifications_recipient ON public.sent_notifications(recipient_email);
CREATE INDEX idx_sent_notifications_status ON public.sent_notifications(status);

COMMENT ON TABLE public.sent_notifications IS 'Historique de tous les emails envoyés';
COMMENT ON COLUMN public.sent_notifications.type IS 'Type de notification (confirmation, rappel, etc.)';
COMMENT ON COLUMN public.sent_notifications.email_provider_id IS 'ID retourné par le provider email (Resend)';

-- ============================================
-- TABLE : audit_logs (Journal d'audit)
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a fait l'action
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- Quelle action
  action TEXT NOT NULL CHECK (action IN (
    'create',
    'update', 
    'delete',
    'login',
    'logout',
    'login_failed',
    'checkin',
    'export',
    'bulk_action',
    'settings_change'
  )),
  
  -- Sur quelle entité
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'show',
    'slot',
    'reservation',
    'user',
    'company',
    'venue',
    'category',
    'settings',
    'auth'
  )),
  entity_id UUID,
  
  -- Détails de l'action
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  
  -- Informations de contexte
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Index partiel pour les actions sensibles (login, delete, settings)
CREATE INDEX idx_audit_logs_sensitive ON public.audit_logs(created_at) 
  WHERE action IN ('login', 'login_failed', 'delete', 'settings_change');

COMMENT ON TABLE public.audit_logs IS 'Journal d''audit de toutes les actions importantes';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Valeurs avant modification (pour UPDATE/DELETE)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'Valeurs après modification (pour CREATE/UPDATE)';

-- ============================================
-- TABLE : rgpd_requests (Demandes RGPD)
-- ============================================

CREATE TABLE public.rgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Utilisateur concerné
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  
  -- Type de demande
  request_type TEXT NOT NULL CHECK (request_type IN (
    'data_export',
    'data_deletion',
    'consent_withdrawal',
    'data_rectification'
  )),
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'rejected'
  )),
  
  -- Traitement
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT
);

-- Index
CREATE INDEX idx_rgpd_requests_user ON public.rgpd_requests(user_id);
CREATE INDEX idx_rgpd_requests_status ON public.rgpd_requests(status);
CREATE INDEX idx_rgpd_requests_type ON public.rgpd_requests(request_type);
CREATE INDEX idx_rgpd_requests_requested_at ON public.rgpd_requests(requested_at);

COMMENT ON TABLE public.rgpd_requests IS 'Demandes RGPD des utilisateurs (export, suppression, etc.)';

-- ============================================
-- FONCTION : Enregistrer une action dans l'audit log
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_audit_id UUID;
BEGIN
  -- Récupérer les infos de l'utilisateur connecté
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
    SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = v_user_id;
  END IF;
  
  -- Insérer l'entrée d'audit
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    details,
    old_values,
    new_values
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_old_values,
    p_new_values
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_audit IS 'Enregistre une action dans le journal d''audit';