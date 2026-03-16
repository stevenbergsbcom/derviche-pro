/**
 * Constantes et helpers pour CompanyDialog
 * Extraits de company-dialog.tsx — S160
 */

import type { CompanyFormData } from './types';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const defaultFormData: CompanyFormData = {
  name: '',
  contact_email: '',
  description: '',
  city: '',
  contact_name: '',
  contact_phone: '',
  website: '',
};

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function sanitizeFormData(data: CompanyFormData): CompanyFormData {
  return {
    name: data.name.trim(),
    contact_email: data.contact_email?.trim() || null,
    description: data.description?.trim() || null,
    city: data.city?.trim() || null,
    contact_name: data.contact_name?.trim() || null,
    contact_phone: data.contact_phone?.trim() || null,
    website: data.website?.trim() || null,
  };
}
