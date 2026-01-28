/**
 * Section catégories
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';
import type { CategoriesSectionProps } from '../types';

export function CategoriesSection({
  categoryIds,
  categories,
  onCategoryChange,
  onOpenCategoriesManager,
}: CategoriesSectionProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Catégories *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCategoriesManager}
          >
            <Settings className="w-4 h-4 mr-2" />
            Gérer
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={categoryIds.includes(category.id)}
                onCheckedChange={(checked) => {
                  onCategoryChange(category.id, checked === true);
                }}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
