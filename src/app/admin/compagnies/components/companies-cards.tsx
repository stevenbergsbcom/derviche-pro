/**
 * Cards mobile des compagnies
 * Session 107 - Refactorisation
 */

'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Theater, CheckCircle, XCircle } from 'lucide-react';
import type { CompaniesListProps } from '../types';

export const CompaniesCards = memo(function CompaniesCards({
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
    <div className="lg:hidden space-y-4">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3
                  role="button"
                  tabIndex={0}
                  className="font-semibold cursor-pointer hover:text-derviche hover:underline"
                  onClick={() => onEdit(company)}
                  onKeyDown={(e) => handleNameKeyDown(e, company)}
                  aria-label={`Modifier ${company.name}`}
                >
                  {company.name}
                </h3>
                {company.city && (
                  <p className="text-sm text-muted-foreground">{company.city}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  role="button"
                  tabIndex={0}
                  className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                  onClick={() => onViewShows(company.name)}
                  onKeyDown={(e) => handleBadgeKeyDown(e, company.name)}
                  aria-label={`Voir les ${company.shows_count} spectacle${company.shows_count > 1 ? 's' : ''} de ${company.name}`}
                >
                  <Theater className="w-3 h-3 mr-1" aria-hidden="true" />
                  {company.shows_count}
                </Badge>
                {company.has_user ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                    Accès
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                    Pas d&apos;accès
                  </Badge>
                )}
              </div>
            </div>
            {company.contact_name && (
              <p className="text-sm text-muted-foreground">{company.contact_name}</p>
            )}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(company)}
                aria-label={`Modifier ${company.name}`}
              >
                <Pencil className="w-4 h-4 mr-2" aria-hidden="true" />
                Modifier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => void onDelete(company)}
                aria-label={`Supprimer ${company.name}`}
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
