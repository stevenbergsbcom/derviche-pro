/**
 * ExportMenu - Dropdown CSV / Excel / PDF
 * Derviche Diffusion
 *
 * Phase 3B : l'option PDF est active et déclenche la génération
 * d'un rapport multi-pages via `exportStatsPdf`.
 */

'use client';

import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
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
  disabled?: boolean;
  isExporting?: boolean;
}

export function ExportMenu({ onExport, disabled, isExporting }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Export en cours…' : 'Exporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Formats disponibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          <FileType className="h-4 w-4 mr-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
