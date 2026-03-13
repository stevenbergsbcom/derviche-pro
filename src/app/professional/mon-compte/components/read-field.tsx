/**
 * ReadField — Affichage lecture seule d'un champ profil
 * Derviche Diffusion - Mon Compte
 */

export function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">
        {value || <span className="text-muted-foreground italic text-sm">Non renseigné</span>}
      </p>
    </div>
  );
}
