'use client';

import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface SafeHtmlProps {
    html: string;
    className?: string;
    /** Si true, désactive les styles prose pour permettre line-clamp */
    disableProse?: boolean;
}

/**
 * Composant pour afficher du HTML sanitizé de manière sécurisée
 * Utilise la même configuration que WysiwygEditor pour garantir la cohérence
 */
export function SafeHtml({ html, className, disableProse = false }: SafeHtmlProps) {
    const sanitizedHtml = sanitizeHtml(html);

    return (
        <div
            className={cn(
                !disableProse && 'prose prose-sm max-w-none',
                '[&_a]:text-derviche [&_a]:underline',
                className
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
}
