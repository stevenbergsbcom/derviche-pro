/**
 * Composant VenueSection - Sélection du lieu
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { VenueSectionProps } from '../types';

export function VenueSection({
  venueId,
  venues,
  onVenueChange,
  onOpenNewVenueDialog,
}: VenueSectionProps) {
  const handleValueChange = (value: string) => {
    if (value === 'new') {
      onOpenNewVenueDialog();
    } else {
      onVenueChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="seriesVenueId">
        Lieu <span className="text-destructive">*</span>
      </Label>
      <Select
        value={venueId ? String(venueId) : ''}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="seriesVenueId" aria-label="Choisir un lieu">
          <SelectValue placeholder="Sélectionner un lieu" />
        </SelectTrigger>
        <SelectContent>
          {venues.map((venue) => (
            <SelectItem key={venue.id} value={String(venue.id)}>
              {venue.city ? `${venue.name} - ${venue.city}` : venue.name}
            </SelectItem>
          ))}
          <div className="border-t my-1" />
          <SelectItem value="new" className="text-derviche font-medium">
            ➕ Créer un nouveau lieu...
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
