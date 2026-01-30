/**
 * Aperçu du nom de fichier qui sera généré
 */

import { memo } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { FilenamePreviewProps } from '../types';

// ============================================
// COMPOSANT
// ============================================

export const FilenamePreview = memo(function FilenamePreview({ filename, format }: FilenamePreviewProps) {
  const Icon = format === 'xlsx' ? FileSpreadsheet : FileText;
  const iconColor = format === 'xlsx' ? 'text-green-600' : 'text-blue-600';

  return (
    <div
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm"
      aria-label={`Nom du fichier : ${filename}`}
    >
      <Icon className={`w-5 h-5 ${iconColor} shrink-0`} aria-hidden="true" />
      <span className="font-mono text-xs truncate">{filename}</span>
    </div>
  );
});

FilenamePreview.displayName = 'FilenamePreview';
