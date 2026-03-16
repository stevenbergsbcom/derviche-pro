/**
 * Sélecteur de thème — Grille de prévisualisations
 * Derviche Diffusion - Admin Preferences
 */

'use client';

import { Check } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { THEME_OPTIONS, getThemePreset } from '@/lib/theme';
import { cn } from '@/lib/utils';

import type { ThemePickerProps } from './types';

// ============================================
// COMPONENT
// ============================================

/** Grille de sélection du thème de couleurs. */
export function ThemePicker({ selectedTheme, onThemeChange, canEdit }: ThemePickerProps) {
  return (
    <div className="space-y-4">
      <Label>Thème de couleurs</Label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_OPTIONS.map((theme) => {
          const preset = getThemePreset(theme.value);
          const isSelected = selectedTheme === theme.value;
          const colors = preset.colors.light;

          return (
            <button
              key={theme.value}
              type="button"
              onClick={() => onThemeChange(theme.value)}
              disabled={!canEdit}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 text-left',
                'transition-all hover:shadow-md',
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-muted',
                !canEdit && 'cursor-not-allowed opacity-60'
              )}
            >
              {/* Prévisualisation du thème - Mini interface */}
              <div
                className="relative h-20 w-full overflow-hidden rounded-md border"
                style={{ backgroundColor: colors.background }}
              >
                {/* Sidebar miniature */}
                <div
                  className="absolute left-0 top-0 h-full w-6"
                  style={{ backgroundColor: colors.sidebarBackground }}
                >
                  <div
                    className="mx-1 mt-2 h-2 w-4 rounded-sm"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div
                    className="mx-1 mt-1 h-1.5 w-3 rounded-sm opacity-50"
                    style={{ backgroundColor: colors.sidebarForeground }}
                  />
                  <div
                    className="mx-1 mt-1 h-1.5 w-3 rounded-sm opacity-50"
                    style={{ backgroundColor: colors.sidebarForeground }}
                  />
                </div>

                {/* Contenu principal miniature */}
                <div className="ml-8 p-2">
                  {/* Header */}
                  <div
                    className="mb-2 h-2 w-12 rounded-sm"
                    style={{ backgroundColor: colors.foreground }}
                  />
                  {/* Card */}
                  <div
                    className="rounded border p-1.5"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                  >
                    <div
                      className="mb-1 h-1.5 w-10 rounded-sm opacity-70"
                      style={{ backgroundColor: colors.cardForeground }}
                    />
                    <div className="flex gap-1">
                      <div
                        className="h-3 w-6 rounded-sm"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <div
                        className="h-3 w-4 rounded-sm"
                        style={{ backgroundColor: colors.accent }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pastilles de couleurs */}
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: colors.background }}
                  title="Fond"
                />
                <div
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: colors.primary }}
                  title="Principal"
                />
                <div
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: colors.accent }}
                  title="Accent"
                />
                <div
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: colors.muted }}
                  title="Muted"
                />
              </div>

              {/* Nom et description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{theme.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>

              {/* Badge sélectionné */}
              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Le thème sera appliqué à l&apos;ensemble de la plateforme pour tous les utilisateurs.
      </p>
    </div>
  );
}
