/**
 * Constantes pour les paramètres de l'application
 * Derviche Diffusion
 */

import type {
  OrganizationSettingKey,
  EmailSettingKey,
  NotificationSettingKey,
  GoogleCalendarSettingKey,
  ReminderSettingKey,
  RgpdSettingKey,
  ThemeSettingKey,
  SeasonSettingKey,
  HomepageSettingKey,
  HomepageSettings,
  LegalSettingKey,
  LegalSettings,
  SeasonSettings,
} from './types';

// ============================================
// CONSTANTES
// ============================================

/** Clés des paramètres organisation */
export const ORGANIZATION_SETTING_KEYS: OrganizationSettingKey[] = [
  'organization_name',
  'organization_contact_email',
  'organization_contact_phone',
  'organization_address',
  'organization_website',
];

/** Clés des paramètres email */
export const EMAIL_SETTING_KEYS: EmailSettingKey[] = [
  'email_from_name',
  'email_from_address',
  'email_reply_to',
  'email_signature',
  'email_footer_text',
  'email_footer_show_email',
  'email_footer_show_phone',
  'email_footer_show_address',
  'email_footer_show_website',
];

/** Clés des paramètres notifications email admin */
export const NOTIFICATION_SETTING_KEYS: NotificationSettingKey[] = [
  'email_notification_new_reservation',
  'email_notification_cancellation',
  'email_notification_modification',
];

/** Clés des paramètres Google Calendar */
export const GOOGLE_CALENDAR_SETTING_KEYS: GoogleCalendarSettingKey[] = [
  'google_calendar_enabled',
  'google_calendar_notify_on_cancellation',
  'google_calendar_notify_on_modification',
];

/** Clés des paramètres rappels */
export const REMINDER_SETTING_KEYS: ReminderSettingKey[] = [
  'reminder_enabled_7d',
  'reminder_enabled_2d',
  'reminder_enabled_4h',
];

/** Clés des paramètres RGPD */
export const RGPD_SETTING_KEYS: RgpdSettingKey[] = [
  'rgpd_data_retention_months',
  'rgpd_inactive_account_months',
];

/** Clés des paramètres thème et apparence */
export const THEME_SETTING_KEYS: ThemeSettingKey[] = [
  'theme_preset',
  'logo_white_url',
  'logo_dark_url',
  'custom_theme_colors',
];

/** Clés des paramètres saison */
export const SEASON_SETTING_KEYS: SeasonSettingKey[] = [
  'season_start',
  'season_end',
];

/** Clés des paramètres page d'accueil */
export const HOMEPAGE_SETTING_KEYS: HomepageSettingKey[] = [
  'homepage_hero',
  'homepage_avantages',
  'homepage_spectacles',
  'homepage_impact',
  'homepage_contact',
  'homepage_footer',
];

/** Clés des paramètres pages légales */
export const LEGAL_SETTING_KEYS: LegalSettingKey[] = [
  'legal_mentions',
  'legal_privacy',
  'legal_cgu',
];

/** Valeurs par défaut — contenu actuel hardcodé de la homepage */
export const HOMEPAGE_DEFAULTS: HomepageSettings = {
  homepage_hero: {
    title: 'Découvrez les spectacles\naccompagnés par Derviche Diffusion',
    description:
      'Derviche est une agence de production et de diffusion innovante, transparente et mutualiste, offrant un accompagnement sur mesure aux compagnies de spectacles vivants et aux artistes.',
    secondary_text:
      'Comme les derviches tourneurs, les spectacles ont besoin de tourner pour vivre et grandir !',
    cta_primary_text: 'Réserver ma place',
    cta_primary_url: '/catalogue',
    cta_secondary_text: 'Découvrir la plateforme',
    cta_secondary_url: '#avantages',
  },
  homepage_avantages: {
    label: 'La plateforme',
    title: 'Simplifiez votre programmation',
    cards: [
      {
        icon: 'search',
        title: 'Accès direct',
        description:
          'Parcourez notre catalogue complet et réservez les spectacles qui correspondent à votre programmation en quelques clics.',
      },
      {
        icon: 'calendar',
        title: 'Gestion simple',
        description:
          'Gérez vos réservations, suivez vos confirmations et accédez à tous les détails de vos spectacles en un seul endroit.',
      },
      {
        icon: 'message-circle',
        title: 'Accompagnement',
        description:
          'Notre équipe est à vos côtés et reste joignable pour toutes informations complémentaires sur les spectacles et compagnies.',
      },
    ],
  },
  homepage_spectacles: {
    label: 'Sélection',
    title: 'Spectacles à découvrir',
    subtitle: 'Explorez les spectacles en tournée cette saison',
    cta_text: 'Voir tout le catalogue',
  },
  homepage_impact: {
    enabled: true,
    label: 'Notre impact',
    title: 'Les chiffres qui parlent de notre engagement',
    description:
      'Depuis 2016, Derviche rassemble les meilleurs spectacles vivants et les professionnel·le·s les plus engagé·e·s. Plus de 200 000 spectateurs ont déjà applaudi nos artistes lors de leurs tournées !',
    stats: [
      { number: '120', label: 'Spectacles représentés' },
      { number: '850', label: 'Professionnel·le·s actif·ve·s' },
      { number: '18', label: 'Compagnies partenaires' },
    ],
  },
  homepage_contact: {
    label: 'Contact',
    title: 'Nous contacter',
    description:
      'Une question ? Notre équipe est à votre disposition pour vous accompagner.',
  },
  homepage_footer: {
    description:
      'Agence de production et de diffusion de spectacles vivants depuis 2016. Nous accompagnons les compagnies artistiques et les professionnel·le·s.',
    facebook_url: 'https://www.facebook.com/Derviche-Diffusion-104081770023884',
    instagram_url: 'https://www.instagram.com/dervichediffusion/',
    copyright_text: '© {year} Derviche Diffusion. Tous droits réservés.',
  },
};

/** Labels pour l'affichage des paramètres */
export const SETTING_LABELS: Record<string, string> = {
  organization_name: 'Nom de l\'organisation',
  organization_contact_email: 'Email de contact',
  organization_contact_phone: 'Téléphone de contact',
  organization_address: 'Adresse postale',
  organization_website: 'Site web',
  email_from_name: 'Nom de l\'expéditeur',
  email_from_address: 'Adresse email de l\'expéditeur',
  email_reply_to: 'Adresse de réponse',
  email_signature: 'Signature',
  email_footer_text: 'Pied de page',
  email_footer_show_email: 'Afficher email dans le footer',
  email_footer_show_phone: 'Afficher téléphone dans le footer',
  email_footer_show_address: 'Afficher adresse dans le footer',
  email_footer_show_website: 'Afficher site web dans le footer',
  email_catalogue_url: 'URL du catalogue (emails)',

  google_calendar_enabled: 'Activer Google Calendar',
  google_calendar_notify_on_cancellation: 'Email Google à l\'annulation',
  google_calendar_notify_on_modification: 'Email Google à la modification',
  reminder_enabled_7d: 'Rappel J-7',
  reminder_enabled_2d: 'Rappel J-2',
  reminder_enabled_4h: 'Rappel H-4',
  rgpd_data_retention_months: 'Durée de conservation des données (mois)',
  rgpd_inactive_account_months: 'Durée avant suppression compte inactif (mois)',
  theme_preset: 'Thème de couleurs',
  logo_white_url: 'Logo version blanche',
  logo_dark_url: 'Logo version sombre',
};

/** Valeurs par défaut de la saison */
export const SEASON_DEFAULTS: SeasonSettings = {
  season_start: '09-01',
  season_end: '06-30',
};

/** Contenu par défaut des pages légales */
export const LEGAL_DEFAULTS: LegalSettings = {
  legal_mentions: `MENTIONS LÉGALES

Éditeur du site
Derviche Diffusion
13, rue de Cotte - 75012 Paris
SIRET : [À compléter]
RCS Paris : [À compléter]
Directeur de la publication : [À compléter]
Email : derviche@dervichediffusion.com

Hébergement
Ce site est hébergé par Vercel Inc.
440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
https://vercel.com

Propriété intellectuelle
L'ensemble du contenu de ce site (textes, images, vidéos, logos, éléments graphiques) est protégé par le droit d'auteur et le droit des marques. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable de Derviche Diffusion.

Responsabilité
Derviche Diffusion s'efforce d'assurer l'exactitude des informations diffusées sur ce site mais ne saurait être tenue responsable des erreurs, omissions ou résultats qui pourraient être obtenus par un mauvais usage de ces informations.

Crédits photographiques
Les photographies et visuels utilisés sur ce site sont la propriété de leurs auteurs respectifs et de Derviche Diffusion. Toute utilisation non autorisée est interdite.`,

  legal_privacy: `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : mars 2026

Responsable du traitement
Derviche Diffusion
13, rue de Cotte - 75012 Paris
Email : derviche@dervichediffusion.com

Données collectées
Dans le cadre de l'utilisation de notre plateforme, nous collectons les données suivantes :
- Données d'identification : nom, prénom, adresse email, téléphone
- Données professionnelles : structure, fonction, adresse postale
- Données de réservation : spectacles réservés, historique des réservations
- Données de connexion : logs de connexion, adresse IP

Finalités du traitement
Vos données sont collectées pour les finalités suivantes :
- Gestion de votre compte utilisateur
- Traitement de vos réservations de spectacles
- Communication relative à vos réservations (confirmations, rappels)
- Amélioration de nos services et statistiques anonymisées

Base légale
Le traitement de vos données repose sur :
- L'exécution du contrat (gestion des réservations)
- Votre consentement (newsletter, communications commerciales)
- Notre intérêt légitime (amélioration du service, sécurité)

Durée de conservation
Vos données personnelles sont conservées pendant la durée de votre inscription, puis archivées conformément aux obligations légales. Les comptes inactifs sont supprimés après 24 mois d'inactivité.

Vos droits (RGPD)
Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement (droit à l'oubli)
- Droit à la limitation du traitement
- Droit à la portabilité
- Droit d'opposition

Pour exercer ces droits, contactez-nous à : derviche@dervichediffusion.com

Cookies
Ce site utilise des cookies techniques nécessaires au bon fonctionnement de la plateforme. Aucun cookie publicitaire ou de suivi n'est utilisé.

Réclamation
Vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : www.cnil.fr`,

  legal_cgu: `CONDITIONS GÉNÉRALES D'UTILISATION

Dernière mise à jour : mars 2026

Article 1 — Objet
Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Derviche Diffusion, accessible à l'adresse derviche-pro.com. Cette plateforme permet aux professionnels du spectacle vivant (professionnel·le·s du spectacle vivant) de consulter le catalogue de spectacles et d'effectuer des réservations.

Article 2 — Inscription
L'accès à la plateforme de réservation nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes et à jour. Chaque compte est personnel et ne peut être partagé.

Article 3 — Réservations
Les réservations effectuées via la plateforme sont soumises à la disponibilité des créneaux. Une confirmation par email est envoyée pour chaque réservation validée. L'annulation d'une réservation est possible selon les conditions communiquées lors de la réservation.

Article 4 — Responsabilités de l'utilisateur
L'utilisateur s'engage à :
- Utiliser la plateforme conformément à sa destination
- Ne pas diffuser de contenu illicite ou inapproprié
- Maintenir la confidentialité de ses identifiants de connexion
- Signaler toute utilisation non autorisée de son compte

Article 5 — Propriété intellectuelle
L'ensemble des éléments de la plateforme (design, textes, images, logos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.

Article 6 — Limitation de responsabilité
Derviche Diffusion met tout en œuvre pour assurer la disponibilité et le bon fonctionnement de la plateforme. Toutefois, Derviche Diffusion ne saurait être tenue responsable des interruptions temporaires de service, des erreurs techniques ou des dommages indirects liés à l'utilisation de la plateforme.

Article 7 — Modification des CGU
Derviche Diffusion se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.

Article 8 — Droit applicable
Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux de Paris.

Contact
Pour toute question relative aux présentes CGU :
Derviche Diffusion
13, rue de Cotte - 75012 Paris
Email : derviche@dervichediffusion.com`,
};
