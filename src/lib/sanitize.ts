import DOMPurify from 'dompurify';

/**
 * Configuration centralisée pour la sanitization HTML
 * Utilisée par WysiwygEditor et SafeHtml pour garantir la cohérence
 */

// Balises HTML autorisées pour le contenu WYSIWYG
export const ALLOWED_TAGS = ['p', 'b', 'strong', 'i', 'em', 'a', 'br', 'ul', 'ol', 'li'];

// Attributs HTML autorisés
export const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitize HTML pour éviter les attaques XSS
 * Configuration partagée entre l'éditeur et l'affichage
 */
export function sanitizeHtml(html: string): string {
    if (typeof window === 'undefined') return html;
    
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
    });
}
