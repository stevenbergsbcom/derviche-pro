/**
 * Sélecteur de format d'export (Excel ou CSV)
 */

import { memo } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { FormatSelectorProps, ExportFormat } from '../types';
import { FORMAT_LABELS } from '../constants';

// ============================================
// CONFIGURATION DES FORMATS
// ============================================

interface FormatConfig {
  icon: React.ReactNode;
  defaultColor: string;
}

const FORMAT_CONFIG: Record<ExportFormat, FormatConfig> = {
  xlsx: {
    icon: <FileSpreadsheet className="w-8 h-8" />,
    defaultColor: 'text-green-600',
  },
  csv: {
    icon: <FileText className="w-8 h-8" />,
    defaultColor: 'text-blue-600',
  },
};

// ============================================
// COMPOSANT
// ============================================

export const FormatSelector = memo(function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const formats: ExportFormat[] = ['xlsx', 'csv'];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Format d&apos;export</Label>
      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => {
          const isSelected = value === format;
          const config = FORMAT_CONFIG[format];
          const labels = FORMAT_LABELS[format];

          return (
            <button
              key={format}
              type="button"
              onClick={() => onChange(format)}
              aria-label={`Exporter en ${labels.title}`}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                isSelected
                  ? 'border-derviche bg-derviche/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <span className={isSelected ? 'text-derviche' : config.defaultColor}>
                {config.icon}
              </span>
              <div className="text-left">
                <div className="font-medium">{labels.title}</div>
                <div className="text-xs text-muted-foreground">
                  {labels.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

FormatSelector.displayName = 'FormatSelector';
