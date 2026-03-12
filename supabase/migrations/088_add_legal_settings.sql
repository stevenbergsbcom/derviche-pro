-- ============================================
-- MIGRATION 088 : Paramètres pages légales (Mentions, Confidentialité, CGU)
-- Derviche Diffusion
-- ============================================
-- Ajoute 3 clés dans app_settings pour stocker le contenu des pages
-- légales, éditable depuis Admin > Préférences > Légal.
-- Le contenu est du texte brut (pas de HTML).
-- ============================================

-- Insertion des 3 paramètres légaux avec contenu par défaut
INSERT INTO public.app_settings (key, value, description)
VALUES
  (
    'legal_mentions',
    '"MENTIONS LÉGALES\n\nÉditeur du site\nDerviche Diffusion\n13, rue de Cotte - 75012 Paris\nSIRET : [À compléter]\nRCS Paris : [À compléter]\nDirecteur de la publication : [À compléter]\nEmail : derviche@dervichediffusion.com\n\nHébergement\nCe site est hébergé par Vercel Inc.\n440 N Barranca Ave #4133, Covina, CA 91723, États-Unis\nhttps://vercel.com\n\nPropriété intellectuelle\nL''ensemble du contenu de ce site (textes, images, vidéos, logos, éléments graphiques) est protégé par le droit d''auteur et le droit des marques. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable de Derviche Diffusion.\n\nResponsabilité\nDerviche Diffusion s''efforce d''assurer l''exactitude des informations diffusées sur ce site mais ne saurait être tenue responsable des erreurs, omissions ou résultats qui pourraient être obtenus par un mauvais usage de ces informations.\n\nCrédits photographiques\nLes photographies et visuels utilisés sur ce site sont la propriété de leurs auteurs respectifs et de Derviche Diffusion. Toute utilisation non autorisée est interdite."'::jsonb,
    'Contenu de la page Mentions légales (texte brut)'
  ),
  (
    'legal_privacy',
    '"POLITIQUE DE CONFIDENTIALITÉ\n\nDernière mise à jour : mars 2026\n\nResponsable du traitement\nDerviche Diffusion\n13, rue de Cotte - 75012 Paris\nEmail : derviche@dervichediffusion.com\n\nDonnées collectées\nDans le cadre de l''utilisation de notre plateforme, nous collectons les données suivantes :\n- Données d''identification : nom, prénom, adresse email, téléphone\n- Données professionnelles : structure, fonction, adresse postale\n- Données de réservation : spectacles réservés, historique des réservations\n- Données de connexion : logs de connexion, adresse IP\n\nFinalités du traitement\nVos données sont collectées pour les finalités suivantes :\n- Gestion de votre compte utilisateur\n- Traitement de vos réservations de spectacles\n- Communication relative à vos réservations (confirmations, rappels)\n- Amélioration de nos services et statistiques anonymisées\n\nBase légale\nLe traitement de vos données repose sur :\n- L''exécution du contrat (gestion des réservations)\n- Votre consentement (newsletter, communications commerciales)\n- Notre intérêt légitime (amélioration du service, sécurité)\n\nDurée de conservation\nVos données personnelles sont conservées pendant la durée de votre inscription, puis archivées conformément aux obligations légales. Les comptes inactifs sont supprimés après 24 mois d''inactivité.\n\nVos droits (RGPD)\nConformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :\n- Droit d''accès à vos données\n- Droit de rectification\n- Droit à l''effacement (droit à l''oubli)\n- Droit à la limitation du traitement\n- Droit à la portabilité\n- Droit d''opposition\n\nPour exercer ces droits, contactez-nous à : derviche@dervichediffusion.com\n\nCookies\nCe site utilise des cookies techniques nécessaires au bon fonctionnement de la plateforme. Aucun cookie publicitaire ou de suivi n''est utilisé.\n\nRéclamation\nVous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l''Informatique et des Libertés) : www.cnil.fr"'::jsonb,
    'Contenu de la page Politique de confidentialité (texte brut)'
  ),
  (
    'legal_cgu',
    '"CONDITIONS GÉNÉRALES D''UTILISATION\n\nDernière mise à jour : mars 2026\n\nArticle 1 — Objet\nLes présentes Conditions Générales d''Utilisation (CGU) régissent l''accès et l''utilisation de la plateforme Derviche Diffusion. Cette plateforme permet aux professionnels du spectacle vivant (programmateurs, directeurs de salles) de consulter le catalogue de spectacles et d''effectuer des réservations.\n\nArticle 2 — Inscription\nL''accès à la plateforme de réservation nécessite la création d''un compte. L''utilisateur s''engage à fournir des informations exactes et à jour. Chaque compte est personnel et ne peut être partagé.\n\nArticle 3 — Réservations\nLes réservations effectuées via la plateforme sont soumises à la disponibilité des créneaux. Une confirmation par email est envoyée pour chaque réservation validée. L''annulation d''une réservation est possible selon les conditions communiquées lors de la réservation.\n\nArticle 4 — Responsabilités de l''utilisateur\nL''utilisateur s''engage à :\n- Utiliser la plateforme conformément à sa destination\n- Ne pas diffuser de contenu illicite ou inapproprié\n- Maintenir la confidentialité de ses identifiants de connexion\n- Signaler toute utilisation non autorisée de son compte\n\nArticle 5 — Propriété intellectuelle\nL''ensemble des éléments de la plateforme (design, textes, images, logos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.\n\nArticle 6 — Limitation de responsabilité\nDerviche Diffusion met tout en œuvre pour assurer la disponibilité et le bon fonctionnement de la plateforme. Toutefois, Derviche Diffusion ne saurait être tenue responsable des interruptions temporaires de service, des erreurs techniques ou des dommages indirects liés à l''utilisation de la plateforme.\n\nArticle 7 — Modification des CGU\nDerviche Diffusion se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. L''utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.\n\nArticle 8 — Droit applicable\nLes présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux de Paris.\n\nContact\nPour toute question relative aux présentes CGU :\nDerviche Diffusion\n13, rue de Cotte - 75012 Paris\nEmail : derviche@dervichediffusion.com"'::jsonb,
    'Contenu de la page CGU (texte brut)'
  )
ON CONFLICT (key) DO NOTHING;

-- Lecture publique (anon + authenticated) des paramètres légaux
-- Ces données sont affichées publiquement sur le site
CREATE POLICY "app_settings_select_public_legal"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'legal_mentions',
      'legal_privacy',
      'legal_cgu'
    )
  );
