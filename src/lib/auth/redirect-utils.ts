import type { UserRole } from '@/types/database';

/**
 * Vérifie si une URL de redirection est sécurisée (protection contre open redirect)
 * 
 * @param url - URL à valider
 * @returns true si l'URL est sécurisée (commence par / et ne contient pas de protocole)
 * 
 * @example
 * isSafeRedirectUrl('/accueil') // true
 * isSafeRedirectUrl('//evil.com') // false
 * isSafeRedirectUrl('https://evil.com') // false
 * isSafeRedirectUrl('/%2Fevil.com') // false (encoded)
 */
export function isSafeRedirectUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }
  
    // Décoder l'URL pour détecter les tentatives d'encodage
    try {
        const decoded = decodeURIComponent(url);
        // Doit commencer par / et ne pas contenir de protocole
        return decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes('://');
    } catch {
        // Si le décodage échoue, vérifier l'URL originale
        return url.startsWith('/') && !url.startsWith('//') && !url.includes('://');
    }
}

/**
 * Retourne l'URL de redirection par défaut selon le rôle de l'utilisateur
 * (utilisé quand il n'y a pas de ?next= dans l'URL)
 * 
 * Note: Pour la PWA check-in, le start_url="/accueil" génère ?next=/accueil
 * qui sera utilisé en priorité par la page de login.
 * 
 * @param role - Rôle de l'utilisateur
 * @returns URL de redirection par défaut
 */
export function getRedirectUrlByRole(role: UserRole | null): string {
    switch (role) {
        case 'super-admin':
        case 'admin':
        case 'externe':
            return '/admin';
        case 'company':
            return '/company';
        case 'professional':
        default:
            return '/catalogue';
    }
}
