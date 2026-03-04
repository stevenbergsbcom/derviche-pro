/**
 * Fallbacks — Service Email
 * Derviche Diffusion
 *
 * Templates de secours utilisés quand la DB est inaccessible.
 */

import type { EmailTemplate } from '@/types/email-templates';

export function getFallbackTemplate(key: string): EmailTemplate {
  const defaults: Record<string, Partial<EmailTemplate>> = {
    reservation_confirmation: {
      header_title: 'Réservation confirmée ✓',
      subject: 'Votre réservation est confirmée — {{organisation}}',
      intro_text: 'Bonjour {{prénom}},\n\nVotre réservation pour {{spectacle}} a bien été enregistrée. Nous vous attendons avec plaisir !',
      body_text: '',
      info_text: 'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
      salutation: 'À très bientôt,',
      cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: true,
    },
    reservation_cancellation: {
      header_title: 'Réservation annulée',
      subject: 'Annulation de votre réservation — {{organisation}}',
      intro_text: "Bonjour {{prénom}},\n\nL'annulation de votre réservation pour {{spectacle}} a bien été prise en compte.",
      body_text: "Vous souhaitez découvrir d'autres spectacles ? Consultez notre catalogue en ligne.",
      info_text: '',
      salutation: 'Cordialement,',
      cta_text: 'Voir le catalogue →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: false,
    },
    reservation_modification: {
      header_title: 'Créneau modifié ✓',
      subject: 'Modification de votre réservation — {{spectacle}}',
      intro_text: 'Bonjour {{prénom}},\n\nVotre réservation pour {{spectacle}} a bien été mise à jour avec le nouveau créneau ci-dessous.',
      body_text: '',
      info_text: 'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
      salutation: 'À très bientôt,',
      cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: false,
    },
    admin_notification: {
      header_title: 'Notification Admin',
      subject: '[{{organisation}}] {{événement}} — {{nom}} / {{spectacle}}',
      intro_text: '',
      body_text: '',
      info_text: '',
      salutation: '',
      cta_text: "Voir dans l'admin →",
      contact_block_title: '',
      show_contact_block: false,
      show_reservation_code: false,
    },
    reminder_7d: {
      header_title: 'Rappel — dans 7 jours 📅',
      subject: 'Rappel : {{spectacle}} dans 7 jours',
      intro_text: 'Bonjour {{prénom}},\n\nNous vous rappelons que vous avez une réservation pour {{spectacle}} dans 7 jours. Nous vous attendons avec plaisir !',
      body_text: '',
      info_text: 'Pensez à noter la date dans votre agenda.',
      salutation: 'À très bientôt,',
      cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: false,
    },
    reminder_2d: {
      header_title: 'Rappel — dans 2 jours 📅',
      subject: 'Rappel : {{spectacle}} dans 2 jours',
      intro_text: 'Bonjour {{prénom}},\n\nDans 2 jours, vous assistez à {{spectacle}}. Si vous ne pouvez plus y assister, pensez à annuler votre réservation.',
      body_text: '',
      info_text: 'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
      salutation: 'À très bientôt,',
      cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: false,
    },
    reminder_12h: {
      header_title: "C'est aujourd'hui ! 🎭",
      subject: "C'est aujourd'hui — {{spectacle}} à {{heure}}",
      intro_text: "Bonjour {{prénom}},\n\nC'est aujourd'hui ! Votre représentation de {{spectacle}} commence à {{heure}}. Nous vous attendons !",
      body_text: '',
      info_text: 'Présentez-vous 15 minutes avant le début du spectacle.',
      salutation: 'À tout à l\'heure,',
      cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion',
      show_contact_block: true,
      show_reservation_code: false,
    },
  };

  return {
    id: 'fallback',
    template_key: key as EmailTemplate['template_key'],
    name: key,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...defaults[key],
  } as EmailTemplate;
}
