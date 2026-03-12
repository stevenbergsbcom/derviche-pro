/**
 * Page CGU (Conditions Générales d'Utilisation) — Client Component
 * Derviche Diffusion
 *
 * Charge le contenu depuis app_settings (legal_cgu).
 * Fallback sur LEGAL_DEFAULTS si erreur.
 */

'use client';

import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeHtml } from '@/lib/sanitize';
import { getLegalSettings, LEGAL_DEFAULTS } from '@/lib/services/app-settings';

export default function CguPage() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getLegalSettings();
        if (result.data?.legal_cgu) {
          setContent(result.data.legal_cgu);
        } else {
          setContent(LEGAL_DEFAULTS.legal_cgu);
        }
      } catch {
        setContent(LEGAL_DEFAULTS.legal_cgu);
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
            Conditions Générales d&apos;Utilisation
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
