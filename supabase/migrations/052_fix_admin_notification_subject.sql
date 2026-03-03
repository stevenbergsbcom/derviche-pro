-- Migration 052 : Correction sujet admin_notification + ajout variables {{événement}} et {{nom}}
-- Contexte : migration 051 utilisait ON CONFLICT DO NOTHING, donc la valeur initiale
-- '[{{organisation}}] {{spectacle}}' a été insérée mais ne contenait pas les infos
-- d'événement et de nom du professionnel, critiques pour une notification admin utile.
-- Cette migration corrige le sujet du template admin_notification en DB.

UPDATE email_templates
SET
  subject    = '[{{organisation}}] {{événement}} — {{nom}} / {{spectacle}}',
  updated_at = now()
WHERE template_key = 'admin_notification';
