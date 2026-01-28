/**
 * Composant VenueSelector - Sélecteur de lieu
 * Derviche Diffusion - Session 103
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { VenueSelectorProps } from '../types';
import { LABELS, NEW_VENUE_VALUE } from '../constants';
import { formatVenueForSelect } from '../utils';

/**
 * Sélecteur de lieu avec option de création
 */
export function VenueSelector({
  venueId,
  venues,
  onChange,
  onCreateNew,
}: VenueSelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === NEW_VENUE_VALUE) {
      onCreateNew();
    } else {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="representation-venue">
        {LABELS.venue} <span className="text-destructive">*</span>
      </Label>
      <Select
        value={venueId ? String(venueId) : ''}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="representation-venue" aria-label={LABELS.selectVenue}>
          <SelectValue placeholder={LABELS.selectVenue} />
        </SelectTrigger>
        <SelectContent>
          {venues.map((venue) => (
            <SelectItem key={venue.id} value={String(venue.id)}>
              {formatVenueForSelect(venue.name, venue.city)}
            </SelectItem>
          ))}
          <div className="border-t my-1" />
          <SelectItem value={NEW_VENUE_VALUE} className="text-derviche font-medium">
            {LABELS.createNewVenue}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
