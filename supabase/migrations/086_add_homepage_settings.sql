-- Migration 086: Ajouter les parametres de la page d'accueil
-- Derviche Diffusion
--
-- Ajoute 6 cles dans app_settings pour rendre le contenu
-- de la homepage entierement configurable depuis /admin/preferences.
-- Les valeurs par defaut correspondent au contenu actuellement hardcode.

INSERT INTO app_settings (key, value, description)
VALUES
  (
    'homepage_hero',
    '{
      "title": "Découvrez les spectacles\naccompagnés par Derviche Diffusion",
      "description": "Derviche est une agence de production et de diffusion innovante, transparente et mutualiste, offrant un accompagnement sur mesure aux compagnies de spectacles vivants et aux artistes.",
      "secondary_text": "Comme les derviches tourneurs, les spectacles ont besoin de tourner pour vivre et grandir !",
      "cta_primary_text": "Réserver ma place",
      "cta_primary_url": "/catalogue",
      "cta_secondary_text": "Découvrir la plateforme",
      "cta_secondary_url": "#avantages"
    }'::jsonb,
    'Contenu section Hero de la page d''accueil'
  ),
  (
    'homepage_avantages',
    '{
      "label": "La plateforme",
      "title": "Simplifiez votre programmation",
      "cards": [
        {
          "icon": "search",
          "title": "Accès direct",
          "description": "Parcourez notre catalogue complet et réservez les spectacles qui correspondent à votre programmation en quelques clics."
        },
        {
          "icon": "calendar",
          "title": "Gestion simple",
          "description": "Gérez vos réservations, suivez vos confirmations et accédez à tous les détails de vos spectacles en un seul endroit."
        },
        {
          "icon": "message-circle",
          "title": "Accompagnement",
          "description": "Notre équipe est à vos côtés et reste joignable pour toutes informations complémentaires sur les spectacles et compagnies."
        }
      ]
    }'::jsonb,
    'Contenu section Avantages de la page d''accueil'
  ),
  (
    'homepage_spectacles',
    '{
      "label": "Sélection",
      "title": "Spectacles à découvrir",
      "subtitle": "Explorez les spectacles en tournée cette saison",
      "cta_text": "Voir tout le catalogue"
    }'::jsonb,
    'Contenu section Spectacles de la page d''accueil'
  ),
  (
    'homepage_impact',
    '{
      "label": "Notre impact",
      "title": "Les chiffres qui parlent de notre engagement",
      "description": "Depuis 2016, Derviche rassemble les meilleurs spectacles vivants et les programmateurs les plus engagés. Plus de 200 000 spectateurs ont déjà applaudi nos artistes lors de leurs tournées !",
      "stats": [
        { "number": "120", "label": "Spectacles représentés" },
        { "number": "850", "label": "Programmateurs actifs" },
        { "number": "18", "label": "Compagnies partenaires" }
      ]
    }'::jsonb,
    'Contenu section Chiffres cles de la page d''accueil'
  ),
  (
    'homepage_contact',
    '{
      "label": "Contact",
      "title": "Nous contacter",
      "description": "Une question ? Notre équipe est à votre disposition pour vous accompagner."
    }'::jsonb,
    'Contenu section Contact de la page d''accueil (coordonnees depuis Organisation)'
  ),
  (
    'homepage_footer',
    '{
      "description": "Agence de production et de diffusion de spectacles vivants depuis 2016. Nous accompagnons les compagnies artistiques et les programmateurs.",
      "facebook_url": "https://www.facebook.com/Derviche-Diffusion-104081770023884",
      "instagram_url": "https://www.instagram.com/dervichediffusion/",
      "copyright_text": "© {year} Derviche Diffusion. Tous droits réservés."
    }'::jsonb,
    'Contenu du footer de la page d''accueil'
  )
ON CONFLICT (key) DO NOTHING;
