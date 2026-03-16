/**
 * LogDetails — Détails expandables d'une ligne de log
 * Derviche Diffusion
 *
 * Affiche les paires clé/valeur du champ JSONB `details` d'un log.
 */

'use client';

/** Props du composant LogDetails */
interface LogDetailsProps {
  /** Objet de détails à afficher (champ JSONB) */
  details: Record<string, unknown>;
}

/** Affiche les détails JSONB d'un log sous forme de grille clé/valeur */
export function LogDetails({ details }: LogDetailsProps) {
  const entries = Object.entries(details).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Aucun détail</p>;
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground font-medium whitespace-nowrap">{key}</dt>
          <dd className="text-foreground font-mono break-all">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
