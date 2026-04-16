/**
 * VenueDetailExportButton - Bouton "Exporter PDF" du drawer détail lieu
 * Derviche Diffusion
 *
 * Génère un rapport focalisé sur le lieu courant :
 * cover + KPIs + table des spectacles joués.
 */

'use client';

import { useCallback, useState } from 'react';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exportVenueDetailPdf } from '@/hooks/admin-stats';
import type { VenueDetailRow, VenueStats } from '@/lib/services/admin-stats';
import { EXPORT_FILENAME_PREFIX } from '../../constants';

export interface VenueDetailExportButtonProps {
  summary: VenueStats;
  rows: VenueDetailRow[];
  periodLabel: string;
  from: string;
  to: string;
  disabled?: boolean;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function VenueDetailExportButton({
  summary,
  rows,
  periodLabel,
  from,
  to,
  disabled,
}: VenueDetailExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = useCallback(() => {
    setIsExporting(true);
    const slug = slugify(summary.venueName) || 'lieu';
    const filename = `${EXPORT_FILENAME_PREFIX}_${slug}_${from}_${to}.pdf`;

    void (async () => {
      try {
        await exportVenueDetailPdf(
          { summary, rows, periodLabel, from, to },
          filename
        );
        toast.success('Export PDF téléchargé');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur export PDF');
      } finally {
        setIsExporting(false);
      }
    })();
  }, [summary, rows, periodLabel, from, to]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isExporting}
      aria-label="Exporter le détail de ce lieu au format PDF"
    >
      <FileDown className="mr-1.5 h-4 w-4" />
      {isExporting ? 'Export…' : 'Exporter PDF'}
    </Button>
  );
}
