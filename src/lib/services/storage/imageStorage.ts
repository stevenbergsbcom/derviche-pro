/**
 * Service de gestion des images avec Supabase Storage
 * Bucket : show-images
 */

import { createClient } from '@/lib/supabase/client';

// Configuration
export const IMAGE_CONFIG = {
    bucket: 'show-images',
    maxSizeBytes: 307200, // 300 KB
    maxSizeKB: 300,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
    recommendedWidth: 800,
    recommendedHeight: 600,
};

export type AllowedImageType = typeof IMAGE_CONFIG.allowedTypes[number];

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
}

export interface ImageUploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export interface ImageDeleteResult {
    success: boolean;
    error?: string;
}

/**
 * Valide un fichier image avant upload
 */
export function validateImage(file: File): ImageValidationResult {
    // Vérifier le type MIME
    if (!IMAGE_CONFIG.allowedTypes.includes(file.type as AllowedImageType)) {
        return {
            valid: false,
            error: `Format non supporté. Formats acceptés : JPG, PNG, WebP`,
        };
    }

    // Vérifier la taille
    if (file.size > IMAGE_CONFIG.maxSizeBytes) {
        const fileSizeKB = Math.round(file.size / 1024);
        return {
            valid: false,
            error: `Image trop lourde (${fileSizeKB} KB). Maximum : ${IMAGE_CONFIG.maxSizeKB} KB`,
        };
    }

    return { valid: true };
}

/**
 * Génère un nom de fichier unique pour le stockage
 */
function generateFileName(showId: string, originalName: string): string {
    const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${showId}/${timestamp}-${random}${extension}`;
}

/**
 * Extrait le chemin du fichier depuis une URL Supabase Storage
 */
export function extractPathFromUrl(url: string): string | null {
    try {
        // Format: https://xxx.supabase.co/storage/v1/object/public/show-images/path/to/file.jpg
        const regex = /\/storage\/v1\/object\/public\/show-images\/(.+)$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Upload une image vers Supabase Storage
 */
export async function uploadShowImage(
    file: File,
    showId: string
): Promise<ImageUploadResult> {
    // Valider d'abord
    const validation = validateImage(file);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    const supabase = createClient();
    const fileName = generateFileName(showId, file.name);

    try {
        const { error: uploadError } = await supabase.storage
            .from(IMAGE_CONFIG.bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Erreur upload:', uploadError);
            return { success: false, error: `Erreur lors de l'upload : ${uploadError.message}` };
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
            .from(IMAGE_CONFIG.bucket)
            .getPublicUrl(fileName);

        return { success: true, url: urlData.publicUrl };
    } catch (err) {
        console.error('Erreur inattendue upload:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Erreur inattendue lors de l\'upload',
        };
    }
}

/**
 * Supprime une image de Supabase Storage
 */
export async function deleteShowImage(imageUrl: string): Promise<ImageDeleteResult> {
    // Ne rien faire si l'URL est vide ou en base64 (ancien format)
    if (!imageUrl || imageUrl.startsWith('data:')) {
        return { success: true };
    }

    const path = extractPathFromUrl(imageUrl);
    if (!path) {
        // URL non reconnue, on considère que c'est OK (peut-être une URL externe)
        return { success: true };
    }

    const supabase = createClient();

    try {
        const { error } = await supabase.storage
            .from(IMAGE_CONFIG.bucket)
            .remove([path]);

        if (error) {
            console.error('Erreur suppression image:', error);
            return { success: false, error: `Erreur lors de la suppression : ${error.message}` };
        }

        return { success: true };
    } catch (err) {
        console.error('Erreur inattendue suppression:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Erreur inattendue lors de la suppression',
        };
    }
}

/**
 * Remplace une image existante par une nouvelle
 * Supprime l'ancienne et upload la nouvelle
 */
export async function replaceShowImage(
    newFile: File,
    showId: string,
    oldImageUrl: string | null
): Promise<ImageUploadResult> {
    // Supprimer l'ancienne image si elle existe
    if (oldImageUrl) {
        await deleteShowImage(oldImageUrl);
        // On ne bloque pas si la suppression échoue
    }

    // Upload la nouvelle
    return uploadShowImage(newFile, showId);
}
