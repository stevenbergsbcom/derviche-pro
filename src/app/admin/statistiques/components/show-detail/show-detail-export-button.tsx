/**
 * ShowDetailExportButton - Bouton "Exporter PDF" du drawer détail spectacle
 * Derviche Diffusion
 *
 * Génère un rapport focalisé sur le spectacle courant :
 * cover + KPIs + table des représentations.
 */

'use client';

import { useCallback, useState } from 'react';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exportShowDetailPdf } from '@/hooks/admin-stats';
import type { ShowDetailRow, ShowStats } from '@/lib/services/admin-stats';
import { slugifyFilenameSegment } from '@/lib/utils';
import { EXPORT_FILENAME_PREFIX } from '../../constants';

export interface ShowDetailExportButtonProps {
  summary: ShowStats;
  rows: ShowDetailRow[];
  periodLabel: string;
  from: string;
  to: string;
  disabled?: boolean;
}

export function ShowDetailExportButton({
  summary,
  rows,
  periodLabel,
  from,
  to,
  disabled,
}: ShowDetailExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = useCallback(() => {
    setIsExporting(true);
    const slug = slugifyFilenameSegment(summary.showTitle) || 'spectacle';
    const filename = `${EXPORT_FILENAME_PREFIX}_${slug}_${from}_${to}.pdf`;

    void (async () => {
      try {
        await exportShowDetailPdf(
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
      aria-label="Exporter le détail de ce spectacle au format PDF"
    >
      <FileDown className="mr-1.5 h-4 w-4" />
      {isExporting ? 'Export en cours…' : 'Exporter PDF'}
    </Button>
  );
}
