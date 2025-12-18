'use client';

import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface SafeHtmlProps {
    html: string;
    className?: string;
}

/**
 * Composant pour afficher du HTML sanitizé de manière sécurisée
 * Utilise la même configuration que WysiwygEditor pour garantir la cohérence
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
    const sanitizedHtml = sanitizeHtml(html);

    return (
        <div
            className={cn(
                'prose prose-sm max-w-none',
                '[&_a]:text-derviche [&_a]:underline',
                className
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
}
