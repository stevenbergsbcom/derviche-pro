/**
 * EmailTemplateForm — Schéma Zod et types du formulaire
 * Derviche Diffusion - Admin Preferences
 */

import { z } from 'zod';

// ============================================
// SCHÉMA ZOD
// ============================================

export const templateFormSchema = z.object({
  subject:               z.string().min(1, "L'objet est requis").max(200),
  header_title:          z.string().max(100),
  salutation:            z.string().max(100),
  intro_text:            z.string().max(1000),
  body_text:             z.string().max(2000),
  info_text:             z.string().max(1000),
  cta_text:              z.string().max(100),
  contact_block_title:   z.string().max(100),
  show_contact_block:    z.boolean(),
  show_reservation_code: z.boolean(),
  // Liens optionnels post-checkin (S149)
  show_folder_link:      z.boolean(),
  folder_link_text:      z.string().max(200),
  show_teaser_link:      z.boolean(),
  teaser_link_text:      z.string().max(200),
  show_captation_link:   z.boolean(),
  captation_link_text:   z.string().max(200),
  show_booking_link:     z.boolean(),
  booking_link_text:     z.string().max(200),
  // Dossier photo (S170)
  show_photo_folder_link: z.boolean(),
  photo_folder_link_text: z.string().max(200),
  // CTA dervichediffusion.com — toggle + libellé custom pour post-checkin (migration 112)
  show_derviche_site_link: z.boolean(),
  derviche_site_link_text: z.string().max(200),
  // Bloc « Gérer ma réservation »
  show_manage_reservation_link: z.boolean(),
  manage_reservation_link_text: z.string().max(200),
  guest_contact_message: z.string().max(500),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
