/**
 * Composant HostedBySection - Sélection de l'accueil
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { HostedBySectionProps, SlotHostedBy, UserRole } from '../types';

/** Labels pour les rôles */
const ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'externe': 'Externe',
  'professional': 'Programmateur',
  'company': 'Compagnie',
};

export function HostedBySection({
  hostedBy,
  hostedById,
  dervisheUsers,
  onHostedByChange,
  onHostedByIdChange,
}: HostedBySectionProps) {
  const handleHostedByChange = (value: SlotHostedBy) => {
    onHostedByChange(value);
    // Reset hostedById si on passe à company
    if (value === 'company') {
      onHostedByIdChange(null);
    }
  };

  return (
    <>
      {/* Type d'accueil */}
      <div className="space-y-2">
        <Label htmlFor="seriesHostedBy">
          Accueil par <span className="text-destructive">*</span>
        </Label>
        <Select
          value={hostedBy}
          onValueChange={(value: SlotHostedBy) => handleHostedByChange(value)}
        >
          <SelectTrigger id="seriesHostedBy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="derviche">Derviche Diffusion</SelectItem>
            <SelectItem value="company">Compagnie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Membre Derviche (si hostedBy === 'derviche') */}
      {hostedBy === 'derviche' && (
        <div className="space-y-2">
          <Label htmlFor="seriesHostedById">
            Accueilli par <span className="text-destructive">*</span>
          </Label>
          <Select
            value={hostedById ?? ''}
            onValueChange={(value) => onHostedByIdChange(value)}
          >
            <SelectTrigger id="seriesHostedById">
              <SelectValue placeholder="Sélectionner un membre Derviche" />
            </SelectTrigger>
            <SelectContent>
              {dervisheUsers.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  Aucun membre disponible
                </SelectItem>
              ) : (
                dervisheUsers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.email
                    } - [{ROLE_LABELS[user.role]}]
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
