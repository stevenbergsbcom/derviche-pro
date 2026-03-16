/**
 * Avatar avec initiales du professionnel
 * Affiche un cercle coloré avec les initiales du nom
 */

'use client';

interface ProfessionalAvatarProps {
  /** Nom complet du professionnel */
  name: string;
}

/** Avatar circulaire affichant les initiales du professionnel */
export function ProfessionalAvatar({ name }: ProfessionalAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-derviche"
      aria-hidden="true"
    >
      <span className="text-lg font-semibold leading-none text-white">
        {initials || '?'}
      </span>
    </div>
  );
}
