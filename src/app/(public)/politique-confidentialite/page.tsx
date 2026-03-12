/**
 * Page Politique de confidentialité — Client Component
 * Derviche Diffusion
 *
 * Charge le contenu depuis app_settings (legal_privacy).
 * Fallback sur LEGAL_DEFAULTS si erreur.
 */

'use client';

import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeHtml } from '@/lib/sanitize';
import { getLegalSettings, LEGAL_DEFAULTS } from '@/lib/services/app-settings';

export default function PolitiqueConfidentialitePage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getLegalSettings();
        if (result.data?.legal_privacy) {
          setContent(result.data.legal_privacy);
        } else {
          setContent(LEGAL_DEFAULTS.legal_privacy);
        }
      } catch {
        setContent(LEGAL_DEFAULTS.legal_privacy);
      }
      setIsLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8 text-derviche-dark">
            Politique de confidentialité
          </h1>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none whitespace-pre-line text-sm text-muted-foreground leading-relaxed [&_a]:text-derviche [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
