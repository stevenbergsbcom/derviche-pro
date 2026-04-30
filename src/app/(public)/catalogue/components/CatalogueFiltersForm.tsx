/**
 * CatalogueFiltersForm
 * Derviche Diffusion — S197
 *
 * Formulaire de filtres du catalogue, consommé :
 *  - inline par la page desktop (≥ md)
 *  - dans un Sheet par le composant mobile (< md)
 *
 * Source unique de vérité pour éviter toute duplication entre les deux
 * rendus. Le parent pilote entièrement l'état et reçoit les callbacks.
 */

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface CatalogueFiltersValue {
  genre: string;
  audience: string;
  mois: string;
  lieu: string;
  ville: string;
  onlyAvailable: boolean;
  searchQuery: string;
}

export interface CatalogueFiltersOptions {
  genres: string[];
  audiences: string[];
  mois: string[];
  lieux: string[];
  villes: string[];
}

interface CatalogueFiltersFormProps {
  value: CatalogueFiltersValue;
  options: CatalogueFiltersOptions;
  onGenreChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onMoisChange: (v: string) => void;
  onLieuChange: (v: string) => void;
  onVilleChange: (v: string) => void;
  onAvailableChange: (v: boolean) => void;
  onSearchChange: (v: string) => void;
  /**
   * Layout responsive (desktop) : grille adaptative.
   * En mode "stacked" (mobile Sheet), les champs s'empilent sur 1 colonne.
   */
  layout: 'grid' | 'stacked';
}

export function CatalogueFiltersForm({
  value,
  options,
  onGenreChange,
  onAudienceChange,
  onMoisChange,
  onLieuChange,
  onVilleChange,
  onAvailableChange,
  onSearchChange,
  layout,
}: CatalogueFiltersFormProps) {
  const gridClass =
    layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4'
      : 'flex flex-col gap-4';

  return (
    <div className={gridClass}>
      {/* Genre */}
      <div className="space-y-2">
        <Label htmlFor="catalogue-genre">Genre</Label>
        <Select value={value.genre} onValueChange={onGenreChange}>
          <SelectTrigger id="catalogue-genre">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            {options.genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Publics cible */}
      <div className="space-y-2">
        <Label htmlFor="catalogue-audience">Public cible</Label>
        <Select value={value.audience} onValueChange={onAudienceChange}>
          <SelectTrigger id="catalogue-audience">
            <SelectValue placeholder="Public cible" />
          </SelectTrigger>
          <SelectContent>
            {options.audiences.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mois */}
      <div className="space-y-2">
        <Label htmlFor="catalogue-mois">Mois</Label>
        <Select value={value.mois} onValueChange={onMoisChange}>
          <SelectTrigger id="catalogue-mois">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            {options.mois.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lieu */}
      <div className="space-y-2">
        <Label htmlFor="catalogue-lieu">Lieu</Label>
        <Select value={value.lieu} onValueChange={onLieuChange}>
          <SelectTrigger id="catalogue-lieu">
            <SelectValue placeholder="Lieu" />
          </SelectTrigger>
          <SelectContent>
            {options.lieux.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ville */}
      <div className="space-y-2">
        <Label htmlFor="catalogue-ville">Ville</Label>
        <Select value={value.ville} onValueChange={onVilleChange}>
          <SelectTrigger id="catalogue-ville">
            <SelectValue placeholder="Ville" />
          </SelectTrigger>
          <SelectContent>
            {options.villes.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recherche */}
      <div className={cn('space-y-2', layout === 'grid' && 'xl:col-span-2')}>
        <Label htmlFor="catalogue-search">Recherche</Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
            aria-hidden="true"
          />
          <Input
            id="catalogue-search"
            type="text"
            placeholder="Rechercher un spectacle..."
            value={value.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Switch « En tournée uniquement » — placé en dernier dans le DOM
          pour qu'il wrappe naturellement en 2ᵉ ligne sur xl (où le grid
          totalise 7 colonnes : 5 selects + recherche col-span-2). En layout
          stacked (mobile), il s'aligne après les autres champs. */}
      <div className="space-y-2">
        <Label
          htmlFor="catalogue-available"
          className="text-sm text-muted-foreground"
        >
          Disponibilité
        </Label>
        <div className="flex items-center gap-3 h-10">
          <Switch
            id="catalogue-available"
            checked={value.onlyAvailable}
            onCheckedChange={onAvailableChange}
          />
          <Label
            htmlFor="catalogue-available"
            className="text-sm font-normal cursor-pointer"
          >
            En tournée uniquement
          </Label>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper — nombre de filtres actifs
// ============================================

/**
 * Compte combien de filtres sont actifs (≠ valeur par défaut).
 * Utilisé pour le badge du bouton « Filtres » mobile et le bouton
 * « Réinitialiser » conditionnel.
 */
export function countActiveFilters(value: CatalogueFiltersValue): number {
  let count = 0;
  if (value.genre !== 'Tous') count += 1;
  if (value.audience !== 'Tous') count += 1;
  if (value.mois !== 'Tous') count += 1;
  if (value.lieu !== 'Tous') count += 1;
  if (value.ville !== 'Toutes') count += 1;
  if (value.onlyAvailable) count += 1;
  if (value.searchQuery.trim() !== '') count += 1;
  return count;
}
