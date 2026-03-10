/**
 * Section médias (URLs, captation, image)
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '../../image-uploader';
import type { MediaSectionProps } from '../types';

export function MediaSection({
  folderUrl,
  teaserUrl,
  captationAvailable,
  captationUrl,
  photoFolderUrl,
  imageUrl,
  isSubmitting,
  onFolderUrlChange,
  onTeaserUrlChange,
  onCaptationAvailableChange,
  onCaptationUrlChange,
  onPhotoFolderUrlChange,
  onImageChange,
}: MediaSectionProps) {
  return (
    <>
      {/* URL du dossier de presse */}
      <div className="space-y-2">
        <Label htmlFor="folderUrl">URL du dossier de presse</Label>
        <Input
          id="folderUrl"
          type="url"
          value={folderUrl}
          onChange={(e) => onFolderUrlChange(e.target.value)}
          placeholder="https://drive.google.com/... ou https://dropbox.com/..."
        />
      </div>

      {/* URL du dossier photo — S170 */}
      <div className="space-y-2">
        <Label htmlFor="photoFolderUrl">URL du dossier photo</Label>
        <Input
          id="photoFolderUrl"
          type="url"
          value={photoFolderUrl}
          onChange={(e) => onPhotoFolderUrlChange(e.target.value)}
          placeholder="https://drive.google.com/... ou https://dropbox.com/..."
        />
      </div>

      {/* URL teaser */}
      <div className="space-y-2">
        <Label htmlFor="teaserUrl">URL du teaser</Label>
        <Input
          id="teaserUrl"
          type="url"
          value={teaserUrl}
          onChange={(e) => onTeaserUrlChange(e.target.value)}
          placeholder="https://vimeo.com/... ou https://youtube.com/..."
        />
      </div>

      {/* Captation - Encadré */}
      <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
        <div className="flex items-center space-x-3">
          <Switch
            id="captationAvailable"
            checked={captationAvailable}
            onCheckedChange={(checked) => {
              onCaptationAvailableChange(checked);
              if (!checked) {
                onCaptationUrlChange('');
              }
            }}
          />
          <div className="flex-1">
            <Label htmlFor="captationAvailable" className="font-medium cursor-pointer">
              Captation disponible
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Une captation vidéo du spectacle est disponible pour les professionnels
            </p>
          </div>
        </div>

        {/* URL captation - affiché seulement si captation disponible */}
        {captationAvailable && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="captationUrl">URL de la captation</Label>
            <Input
              id="captationUrl"
              type="url"
              value={captationUrl}
              onChange={(e) => onCaptationUrlChange(e.target.value)}
              placeholder="https://vimeo.com/... ou lien privé"
            />
          </div>
        )}
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label>Image</Label>
        <ImageUploader
          value={imageUrl}
          onChange={onImageChange}
          disabled={isSubmitting}
        />
      </div>
    </>
  );
}
