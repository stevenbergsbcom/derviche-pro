/**
 * Ligne d'information avec icône, label et valeur
 * Utilisée dans le panneau d'informations du professionnel
 */

'use client';

interface InfoRowProps {
  /** Icône lucide-react à afficher */
  icon: React.ElementType;
  /** Libellé de la ligne */
  label: string;
  /** Valeur à afficher (masquée si null/undefined) */
  value: string | null | undefined;
  /** Si true, la valeur est rendue comme lien mailto */
  isEmail?: boolean;
}

/** Ligne d'information avec icône, label et valeur */
export function InfoRow({ icon: Icon, label, value, isEmail = false }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 border-b border-muted/40 py-1.5 last:border-0">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span>
      {isEmail ? (
        <a
          href={`mailto:${value}`}
          className="truncate text-sm font-medium text-derviche hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="break-words text-sm font-medium">{value}</span>
      )}
    </div>
  );
}
