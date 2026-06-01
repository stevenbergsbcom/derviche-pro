/**
 * CrmIdInput
 * Derviche Diffusion — S174
 *
 * Champ de saisie réutilisable pour les identifiants CRM Zoho.
 * Utilisé dans :
 *  - formulaire lieu (venues.crm_id)
 *  - formulaire pro (profiles.crm_id)
 *  - fiche réservation guest (reservations.crm_id)
 *
 * Validation souple :
 *  - Seuls les chiffres sont acceptés (filtrage `/\D/g` à la frappe)
 *  - Aucune longueur imposée côté UI (les IDs Zoho font ~17 chiffres
 *    aujourd'hui, mais ce format peut évoluer côté CRM)
 *
 * La saisie est nettoyée à la volée (caractères non-numériques retirés
 * silencieusement) pour offrir un comportement prévisible quand l'admin
 * colle un ID copié depuis Zoho avec des espaces ou caractères parasites.
 * Le composant ne lève aucun avertissement visuel — par design : la
 * sanitization est invisible et l'utilisateur voit immédiatement le
 * résultat propre dans le champ.
 */

'use client';

import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface CrmIdInputProps {
  id?: string;
  /** Label affiché. Par défaut : « ID CRM (Zoho) ». */
  label?: string;
  /** Valeur courante. `null` est traité comme chaîne vide. */
  value: string | null | undefined;
  /** Callback à chaque saisie. Reçoit `null` quand l'utilisateur vide le champ. */
  onChange: (value: string | null) => void;
  /** Désactive le champ. */
  disabled?: boolean;
  /** Placeholder. Par défaut un exemple d'ID Zoho. */
  placeholder?: string;
  /** Aide affichée sous le champ (à la place de l'aide par défaut). */
  helpText?: string;
  className?: string;
}

/**
 * Filtre les caractères non-numériques.
 * Retourne la chaîne nettoyée + un booléen indiquant si on a retiré quelque chose.
 */
function sanitizeNumericOnly(raw: string): { cleaned: string; hadInvalidChars: boolean } {
  const cleaned = raw.replace(/\D/g, '');
  return { cleaned, hadInvalidChars: cleaned !== raw };
}

export function CrmIdInput({
  id = 'crm_id',
  label = 'ID CRM (Zoho)',
  value,
  onChange,
  disabled = false,
  placeholder = 'Ex : 70611000000487416',
  helpText,
  className,
}: CrmIdInputProps) {
  const currentValue = value ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { cleaned } = sanitizeNumericOnly(e.target.value);
    // On stocke `null` si vide pour rester cohérent avec les colonnes
    // nullable côté BDD (évite d'insérer une chaîne vide qui ne déclencherait
    // pas l'index partiel `WHERE crm_id IS NOT NULL`).
    onChange(cleaned === '' ? null : cleaned);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {helpText ??
            "Identifiant du contact dans votre CRM Zoho (~17 chiffres). Optionnel — utilisé pour faire le pont avec votre CRM dans les exports."}
        </span>
      </p>
    </div>
  );
}
