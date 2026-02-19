/**
 * Utilitaire d'export des professionnels (CSV uniquement)
 * Derviche Diffusion
 *
 * Exporte la liste des professionnels filtrée au format CSV.
 * Le CSV inclut un BOM UTF-8 pour un affichage correct dans Excel.
 * Note: xlsx et exceljs ont été exclus car sans alternative sécurisée sur npm.
 */

import type { Professional } from '@/lib/services/professionals';
import type { ProfessionalColumn } from '@/hooks/useUserPreferences';
import { PROFESSIONAL_COLUMNS_ORDER, PROFESSIONAL_COLUMNS_CONFIG } from '@/hooks/useUserPreferences';

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv';

export interface ExportProfessionalsOptions {
  format: ExportFormat;
  /** Colonnes optionnelles à inclure (undefined = toutes) */
  visibleColumns?: ProfessionalColumn[];
}

export interface ExportResult {
  success: boolean;
  error?: string;
}

// ============================================
// COLONNES FIXES (toujours exportées)
// ============================================

interface FixedColumn {
  key: keyof Professional;
  label: string;
}

const FIXED_COLUMNS: FixedColumn[] = [
  { key: 'last_name',  label: 'Nom'    },
  { key: 'first_name', label: 'Prénom' },
  { key: 'email',      label: 'Email'  },
];

// ============================================
// MAPPING COLONNE → CHAMP Professional
// ============================================

const COLUMN_TO_FIELD: Record<ProfessionalColumn, { key: keyof Professional; label: string }> = {
  structure:    { key: 'structure',         label: 'Structure'        },
  phone:        { key: 'phone',             label: 'Téléphone'        },
  email2:       { key: 'email2',            label: 'Email secondaire' },
  phone2:       { key: 'phone2',            label: 'Tél. secondaire'  },
  function:     { key: 'function',          label: 'Fonction'         },
  city:         { key: 'city',              label: 'Ville'            },
  reservations: { key: 'reservation_count', label: 'Réservations'     },
};

// ============================================
// COLONNES SUPPLÉMENTAIRES (toujours à la fin)
// ============================================

const TRAILING_COLUMNS: FixedColumn[] = [
  { key: 'postal_code', label: 'Code postal' },
  { key: 'country',     label: 'Pays'        },
  { key: 'address',     label: 'Adresse'     },
  { key: 'afc_number',  label: 'N° AFC'      },
  { key: 'created_at',  label: 'Créé le'     },
];

// ============================================
// FORMATAGE
// ============================================

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Formatage des dates ISO
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return value;
  }
  return String(value);
}

function generateFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `professionnels_${date}.csv`;
}

// ============================================
// CONSTRUCTION DES DONNÉES
// ============================================

function buildExportData(
  professionals: Professional[],
  visibleColumns: ProfessionalColumn[]
): { headers: string[]; rows: string[][] } {
  const optionalCols = PROFESSIONAL_COLUMNS_ORDER.filter((col) =>
    visibleColumns.includes(col)
  );

  const allColumns: Array<{ key: keyof Professional; label: string }> = [
    ...FIXED_COLUMNS,
    ...optionalCols.map((col) => COLUMN_TO_FIELD[col]),
    ...TRAILING_COLUMNS,
  ];

  const headers = allColumns.map((c) => c.label);
  const rows = professionals.map((pro) =>
    allColumns.map((c) => formatValue(pro[c.key]))
  );

  return { headers, rows };
}

// ============================================
// GÉNÉRATION CSV
// ============================================

function buildCsvContent(professionals: Professional[], visibleColumns: ProfessionalColumn[]): string {
  const { headers, rows } = buildExportData(professionals, visibleColumns);

  const escape = (v: string): string => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];

  return '\uFEFF' + lines.join('\r\n'); // BOM UTF-8 pour Excel
}

// ============================================
// TÉLÉCHARGEMENT
// ============================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Exporte la liste des professionnels au format CSV.
 *
 * @param professionals - Liste filtrée à exporter
 * @param options - Format et colonnes à inclure
 */
export async function exportProfessionals(
  professionals: Professional[],
  options: ExportProfessionalsOptions
): Promise<ExportResult> {
  try {
    const visibleColumns =
      options.visibleColumns ??
      (Object.keys(PROFESSIONAL_COLUMNS_CONFIG) as ProfessionalColumn[]);

    const content = buildCsvContent(professionals, visibleColumns);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, generateFilename());

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}
