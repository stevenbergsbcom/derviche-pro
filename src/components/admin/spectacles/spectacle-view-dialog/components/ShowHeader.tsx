/**
 * Header du dialog avec image et titre
 * Derviche Diffusion - Session 110
 */

import Image from 'next/image';
import type { ShowHeaderProps } from '../types';

export function ShowHeader({ title, companyName, imageUrl }: ShowHeaderProps) {
  return (
    <>
      {/* Image en haut sans espace */}
      {imageUrl && (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 672px"
            className="object-cover"
            unoptimized={imageUrl.startsWith('data:')}
          />
        </div>
      )}

      {/* Header avec titre et compagnie */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-base text-muted-foreground mt-1">{companyName}</p>
      </div>
    </>
  );
}
