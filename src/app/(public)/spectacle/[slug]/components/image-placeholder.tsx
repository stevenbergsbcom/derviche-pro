/**
 * ImagePlaceholder — Placeholder visuel quand le spectacle n'a pas d'image
 * Derviche Diffusion - Page spectacle
 */

import { Drama } from 'lucide-react';

export function ImagePlaceholder({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-derviche/20 to-derviche/40 flex flex-col items-center justify-center p-4">
      <Drama className="w-16 h-16 text-muted-foreground/50 mb-2" />
      <p className="text-derviche-dark/80 text-sm font-medium text-center line-clamp-2">{title}</p>
    </div>
  );
}
