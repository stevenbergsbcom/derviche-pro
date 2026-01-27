-- Migration 040: Fix fonction externe_has_access_to_show
-- Utiliser slots.hosted_by_id au lieu de user_show_assignments
-- Cohérent avec la logique de la PWA check-in

-- Remplacer la fonction pour utiliser hosted_by_id
CREATE OR REPLACE FUNCTION externe_has_access_to_show(p_show_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Un externe a accès à un spectacle s'il est assigné (hosted_by_id) 
  -- à au moins un slot de ce spectacle
  RETURN EXISTS (
    SELECT 1 FROM public.slots
    WHERE show_id = p_show_id
    AND hosted_by_id = auth.uid()
  );
END;
$$;
