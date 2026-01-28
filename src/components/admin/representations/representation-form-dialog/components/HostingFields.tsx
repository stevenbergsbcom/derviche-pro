/**
 * Composant HostingFields - Champs d'accueil (hostedBy + hostedById)
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

import type { HostingFieldsProps, SlotHostedBy } from '../types';
import { LABELS, HOSTED_BY_OPTIONS, EMPTY_USER_VALUE } from '../constants';
import { formatUserForSelect } from '../utils';

/**
 * Champs de configuration de l'accueil
 */
export function HostingFields({
  hostedBy,
  hostedById,
  dervisheUsers,
  onHostedByChange,
  onHostedByIdChange,
}: HostingFieldsProps) {
  return (
    <>
      {/* Type d'accueil */}
      <div className="space-y-2">
        <Label htmlFor="representation-hostedBy">
          {LABELS.hostedBy} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={hostedBy}
          onValueChange={(value: SlotHostedBy) => onHostedByChange(value)}
        >
          <SelectTrigger id="representation-hostedBy" aria-label={LABELS.hostedBy}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOSTED_BY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur d'utilisateur (si accueil par Derviche) */}
      {hostedBy === 'derviche' && (
        <div className="space-y-2">
          <Label htmlFor="representation-hostedById">
            {LABELS.hostedById} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={hostedById ?? ''}
            onValueChange={(value) => onHostedByIdChange(value)}
          >
            <SelectTrigger
              id="representation-hostedById"
              aria-label={LABELS.selectUser}
            >
              <SelectValue placeholder={LABELS.selectUser} />
            </SelectTrigger>
            <SelectContent>
              {dervisheUsers.length === 0 ? (
                <SelectItem value={EMPTY_USER_VALUE} disabled>
                  {LABELS.noUserAvailable}
                </SelectItem>
              ) : (
                dervisheUsers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {formatUserForSelect(user)}
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
