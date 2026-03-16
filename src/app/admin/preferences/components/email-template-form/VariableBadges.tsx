/**
 * VariableBadges — Badges variables cliquables
 * Derviche Diffusion - Admin Preferences
 *
 * Affiche les variables de template email sous forme de badges
 * cliquables avec tooltips et popover d'aide.
 */

'use client';

import { Info } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { EMAIL_TEMPLATE_VARIABLES } from '@/types/email-templates';

// ============================================
// PROPS
// ============================================

interface VariableBadgesProps {
  onInsert: (variable: string) => void;
  disabled: boolean;
}

// ============================================
// COMPOSANT
// ============================================

export function VariableBadges({ onInsert, disabled }: VariableBadgesProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Variables :</span>
        {EMAIL_TEMPLATE_VARIABLES.map((v) => (
          <Tooltip key={v.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !disabled && onInsert(v.key)}
                disabled={disabled}
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono
                           bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {v.key}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{v.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Icône i — popover avec toutes les variables */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center self-center ml-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Aide sur les variables disponibles"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-80 p-0">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">Variables disponibles</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cliquez sur un badge pour l&apos;insérer dans le champ actif.
              </p>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                    <tr key={v.key} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-mono text-primary whitespace-nowrap">
                        {v.key}
                      </td>
                      <td className="py-1.5 text-muted-foreground">
                        {v.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t bg-muted/30">
              <p className="text-[11px] text-muted-foreground">
                Certaines variables ne sont disponibles que sur certains types de templates.
              </p>
            </div>
          </PopoverContent>
        </Popover>

      </div>
    </TooltipProvider>
  );
}
