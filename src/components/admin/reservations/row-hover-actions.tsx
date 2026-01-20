/**
 * Actions au survol d'une ligne de réservation (desktop)
 * Derviche Diffusion
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreVertical, Pencil, CheckCircle, Ban } from 'lucide-react';
import type { AdminReservation } from '@/lib/services/admin-reservations';

// ============================================
// COMPOSANT ROW HOVER ACTIONS
// ============================================

interface RowHoverActionsProps {
  reservation: AdminReservation;
  onEdit: () => void;
  onCheckin: () => void;
  onCancel: () => void;
}

export function RowHoverActions({ reservation, onEdit, onCheckin, onCancel }: RowHoverActionsProps) {
  const isCancelled = reservation.status === 'cancelled';
  
  return (
    <div className="relative w-8 h-8 group">
      {/* Menu classique (visible par défaut, masqué au hover) */}
      <div className="transition-opacity duration-150 group-hover:opacity-0 group-hover:pointer-events-none">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCheckin} disabled={isCancelled}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Check-in
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCancel} disabled={isCancelled} className="text-destructive">
              <Ban className="w-4 h-4 mr-2" />
              Annuler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Icônes au survol (position absolue, visible uniquement au hover du groupe) */}
      <TooltipProvider delayDuration={300}>
        <div 
          className="absolute top-0 left-0 flex items-center gap-0.5 bg-background/95 backdrop-blur-sm rounded-md shadow-sm border border-border/50 px-1 py-0.5 transition-all duration-150 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-derviche/10 hover:text-derviche"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Modifier</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${
                  isCancelled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-green-100 hover:text-green-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCancelled) onCheckin();
                }}
                disabled={isCancelled}
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Check-in</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${
                  isCancelled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-red-100 hover:text-red-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCancelled) onCancel();
                }}
                disabled={isCancelled}
              >
                <Ban className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Annuler</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
