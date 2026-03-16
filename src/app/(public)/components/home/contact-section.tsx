/**
 * ContactSection — Section contact de la page d'accueil
 * Affiche les coordonnées de l'organisation (email, téléphone, site web).
 */

'use client';

import { Mail, Phone, Globe } from 'lucide-react';
import type { HomepageContact, OrganizationSettings } from '@/lib/services/app-settings';

interface ContactSectionProps {
  /** Paramètres contact depuis les settings admin */
  contact: HomepageContact;
  /** Paramètres organisation (coordonnées) */
  organization: OrganizationSettings;
}

export function ContactSection({ contact, organization }: ContactSectionProps) {
  return (
    <section id="contact" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wider">
            {contact.label}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-derviche-dark">
            {contact.title}
          </h2>
          {contact.description && (
            <p className="text-muted-foreground text-sm md:text-base mb-8 md:mb-12">
              {contact.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {organization.organization_contact_email && (
              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Email</h3>
                <a
                  href={`mailto:${organization.organization_contact_email}`}
                  className="text-muted-foreground hover:text-derviche transition text-sm"
                >
                  {organization.organization_contact_email}
                </a>
              </div>
            )}

            {organization.organization_contact_phone && (
              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Telephone</h3>
                <a
                  href={`tel:${organization.organization_contact_phone.replace(/\s/g, '')}`}
                  className="text-muted-foreground hover:text-derviche transition text-sm"
                >
                  {organization.organization_contact_phone}
                </a>
              </div>
            )}

            {organization.organization_website && (
              <div className="flex flex-col items-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-derviche/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-derviche" />
                </div>
                <h3 className="font-semibold mb-1 md:mb-2 text-derviche-dark">Site web</h3>
                <a
                  href={organization.organization_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-derviche transition text-sm"
                >
                  {organization.organization_website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
