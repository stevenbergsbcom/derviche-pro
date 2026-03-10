/**
 * Table desktop des compagnies
 * Session 107 - Refactorisation
 */

'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Theater, CheckCircle, XCircle } from 'lucide-react';
import type { CompaniesListProps } from '../types';

export const CompaniesTable = memo(function CompaniesTable({
  companies,
  onEdit,
  onDelete,
  onViewShows,
}: CompaniesListProps) {
  // Handler pour navigation clavier sur les badges
  const handleBadgeKeyDown = useCallback(
    (e: React.KeyboardEvent, companyName: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewShows(companyName);
      }
    },
    [onViewShows]
  );

  // Handler pour navigation clavier sur le nom
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent, company: typeof companies[0]) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEdit(company);
      }
    },
    [onEdit]
  );

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block rounded-md border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Spectacles</TableHead>
            <TableHead>Accès</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => onEdit(company)}
                  onKeyDown={(e) => handleNameKeyDown(e, company)}
                  className="cursor-pointer hover:text-derviche hover:underline text-left"
                  aria-label={`Modifier ${company.name}`}
                >
                  {company.name}
                </button>
              </TableCell>
              <TableCell>{company.city || '-'}</TableCell>
              <TableCell>{company.contact_name || '-'}</TableCell>
              <TableCell>
                <Badge
                  role="button"
                  tabIndex={0}
                  className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                  onClick={() => onViewShows(company.name)}
                  onKeyDown={(e) => handleBadgeKeyDown(e, company.name)}
                  aria-label={`Voir les ${company.shows_count} spectacle${company.shows_count > 1 ? 's' : ''} de ${company.name}`}
                >
                  <Theater className="w-3 h-3 mr-1" aria-hidden="true" />
                  {company.shows_count} spectacle{company.shows_count > 1 ? 's' : ''}
                </Badge>
              </TableCell>
              <TableCell>
                {company.has_user ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                    Configuré
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                    Non configuré
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(company)}
                    aria-label={`Modifier ${company.name}`}
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => void onDelete(company)}
                    aria-label={`Supprimer ${company.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
