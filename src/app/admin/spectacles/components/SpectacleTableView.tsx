/**
 * Vue tableau des spectacles (desktop mode liste)
 */

'use client';

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
import { Pencil, Trash2, Eye, Copy, Check, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/admin';
import type { SpectacleViewProps } from '../types';

export function SpectacleTableView({
  shows,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
  onNavigateToRepresentations,
  copiedShowId,
  hasFullAccess,
}: SpectacleViewProps) {
  return (
    <div className="hidden lg:block rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Compagnie</TableHead>
            <TableHead>Catégories</TableHead>
            <TableHead>Représentations</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shows.map((show) => (
            <TableRow key={show.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => onView(show)}
                  className="cursor-pointer hover:text-derviche hover:underline text-left"
                  aria-label={`Voir les détails de ${show.title}`}
                >
                  {show.title}
                </button>
              </TableCell>
              <TableCell>{show.companyName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {show.categories.map((cat) => (
                    <Badge key={cat} className="bg-gold/10 text-gold border-gold/20">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                  onClick={() => onNavigateToRepresentations(show.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Voir les ${show.representationsCount} représentation${show.representationsCount > 1 ? 's' : ''} de ${show.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigateToRepresentations(show.id);
                    }
                  }}
                >
                  <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                  {show.representationsCount} repr.
                </Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={show.status} />
              </TableCell>
              <TableCell className="text-right">
                <div
                  className="flex items-center justify-end gap-2"
                  role="group"
                  aria-label={`Actions pour ${show.title}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => void onCopyLink(show)}
                    aria-label={`Copier le lien de réservation pour ${show.title}`}
                    title="Copier le lien de réservation"
                  >
                    {copiedShowId === show.id ? (
                      <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {copiedShowId === show.id ? 'Lien copié' : 'Copier le lien'}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(show)}
                    aria-label={`Voir les détails de ${show.title}`}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Voir</span>
                  </Button>
                  {hasFullAccess && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(show)}
                      aria-label={`Modifier ${show.title}`}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                  )}
                  {hasFullAccess && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void onDelete(show)}
                      aria-label={`Supprimer ${show.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
