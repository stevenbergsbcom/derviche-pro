/**
 * ExportMenu - Split button : action directe sur le format par défaut,
 *              caret pour choisir un autre format.
 * Derviche Diffusion
 *
 * Phase 4B : le format par défaut provient des préférences admin ; l'utilisateur
 * peut toujours changer via le dropdown (flèche).
 */

'use client';

import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileType,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExportFormat } from '../../hooks/use-stats-export';

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  /** Format sélectionné par défaut (bouton principal). */
  defaultFormat?: ExportFormat;
  disabled?: boolean;
  isExporting?: boolean;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  excel: 'Excel',
  pdf: 'PDF',
};

const FORMAT_ICONS: Record<ExportFormat, LucideIcon> = {
  csv: FileText,
  excel: FileSpreadsheet,
  pdf: FileType,
};

const FORMAT_ORDER: ExportFormat[] = ['csv', 'excel', 'pdf'];

export function ExportMenu({
  onExport,
  defaultFormat = 'excel',
  disabled,
  isExporting,
}: ExportMenuProps) {
  const DefaultIcon = FORMAT_ICONS[defaultFormat];
  const defaultLabel = FORMAT_LABELS[defaultFormat];

  return (
    <div
      className="inline-flex rounded-md shadow-sm"
      role="group"
      aria-label="Exporter les statistiques"
    >
      {/* Partie gauche : action directe sur le format par défaut */}
      <Button
        type="button"
        variant="outline"
        className="rounded-r-none"
        disabled={disabled || isExporting}
        onClick={() => onExport(defaultFormat)}
        aria-label={`Exporter au format ${defaultLabel}`}
      >
        <DefaultIcon className="mr-2 h-4 w-4" />
        {isExporting ? 'Export en cours…' : `Exporter ${defaultLabel}`}
      </Button>

      {/* Partie droite : caret pour choisir un autre format */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="rounded-l-none border-l-0 px-2"
            disabled={disabled || isExporting}
            aria-label="Choisir un autre format d'export"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Formats disponibles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {FORMAT_ORDER.map((fmt) => {
            const Icon = FORMAT_ICONS[fmt];
            return (
              <DropdownMenuItem key={fmt} onClick={() => onExport(fmt)}>
                <Icon className="mr-2 h-4 w-4" />
                {FORMAT_LABELS[fmt]}
                {fmt === defaultFormat && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Défaut
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
