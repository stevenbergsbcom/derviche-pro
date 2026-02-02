/**
 * Service de gestion des logos avec Supabase Storage
 * Bucket : organization-logos
 */

import { createClient } from '@/lib/supabase/client';

// Configuration
export const LOGO_CONFIG = {
  bucket: 'organization-logos',
  maxSizeBytes: 512000, // 500 KB
  maxSizeKB: 500,
  allowedTypes: ['image/png', 'image/svg+xml', 'image/webp'] as const,
  allowedExtensions: ['.png', '.svg', '.webp'] as const,
  recommendedWidth: 400,
  recommendedHeight: 150,
};

export type AllowedLogoType = (typeof LOGO_CONFIG.allowedTypes)[number];

export interface LogoValidationResult {
  valid: boolean;
  error?: string;
}

export interface LogoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface LogoDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Valide un fichier logo avant upload
 */
export function validateLogo(file: File): LogoValidationResult {
  // Vérifier le type MIME
  if (!LOGO_CONFIG.allowedTypes.includes(file.type as AllowedLogoType)) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés : PNG, SVG, WebP`,
    };
  }

  // Vérifier la taille
  if (file.size > LOGO_CONFIG.maxSizeBytes) {
    const fileSizeKB = Math.round(file.size / 1024);
    return {
      valid: false,
      error: `Logo trop lourd (${fileSizeKB} Ko). Maximum : ${LOGO_CONFIG.maxSizeKB} Ko`,
    };
  }

  return { valid: true };
}

/**
 * Génère un nom de fichier pour le logo
 * @param variant - 'white' ou 'dark'
 */
function generateLogoFileName(variant: 'white' | 'dark', originalName: string): string {
  const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
  const timestamp = Date.now();
  return `logo-${variant}-${timestamp}${extension}`;
}

/**
 * Extrait le chemin du fichier depuis une URL Supabase Storage
 */
export function extractLogoPathFromUrl(url: string): string | null {
  try {
    // Format: https://xxx.supabase.co/storage/v1/object/public/organization-logos/path/to/file.png
    const regex = /\/storage\/v1\/object\/public\/organization-logos\/(.+)$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Upload un logo vers Supabase Storage
 */
export async function uploadLogo(
  file: File,
  variant: 'white' | 'dark'
): Promise<LogoUploadResult> {
  // Valider d'abord
  const validation = validateLogo(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = createClient();
  const fileName = generateLogoFileName(variant, file.name);

  try {
    const { error: uploadError } = await supabase.storage
      .from(LOGO_CONFIG.bucket)
      .upload(fileName, file, {
        cacheControl: '86400', // 24h cache
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload logo:', uploadError);
      return { success: false, error: `Erreur lors de l'upload : ${uploadError.message}` };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(LOGO_CONFIG.bucket)
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    console.error('Erreur inattendue upload logo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue lors de l'upload",
    };
  }
}

/**
 * Supprime un logo de Supabase Storage
 */
export async function deleteLogo(logoUrl: string): Promise<LogoDeleteResult> {
  // Ne rien faire si l'URL est vide ou en base64
  if (!logoUrl || logoUrl.startsWith('data:') || logoUrl.startsWith('/')) {
    return { success: true };
  }

  const path = extractLogoPathFromUrl(logoUrl);
  if (!path) {
    // URL non reconnue, on considère que c'est OK (peut-être une URL externe)
    return { success: true };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.storage.from(LOGO_CONFIG.bucket).remove([path]);

    if (error) {
      console.error('Erreur suppression logo:', error);
      return { success: false, error: `Erreur lors de la suppression : ${error.message}` };
    }

    return { success: true };
  } catch (err) {
    console.error('Erreur inattendue suppression logo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inattendue lors de la suppression',
    };
  }
}

/**
 * Remplace un logo existant par un nouveau
 * Supprime l'ancien et upload le nouveau
 */
export async function replaceLogo(
  newFile: File,
  variant: 'white' | 'dark',
  oldLogoUrl: string | null
): Promise<LogoUploadResult> {
  // Supprimer l'ancien logo si il existe
  if (oldLogoUrl) {
    await deleteLogo(oldLogoUrl);
    // On ne bloque pas si la suppression échoue
  }

  // Upload le nouveau
  return uploadLogo(newFile, variant);
}
