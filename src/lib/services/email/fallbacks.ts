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
