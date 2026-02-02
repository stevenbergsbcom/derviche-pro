/**
 * Composant d'upload de logo pour les préférences
 * Version simplifiée de ImageUploader adaptée aux logos
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { LOGO_CONFIG, validateLogo } from '@/lib/services/storage/logoStorage';

export interface LogoUploaderProps {
  /** URL du logo actuel (null si pas de logo) */
  value: string | null;
  /** Callback quand le logo change (File pour upload, null pour suppression) */
  onChange: (file: File | null) => void;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Erreur externe à afficher */
  error?: string | null;
  /** Label du logo (ex: "Logo blanc", "Logo sombre") */
  label: string;
  /** Couleur de fond pour la prévisualisation */
  previewBgColor?: 'light' | 'dark';
  /** ID unique pour l'input */
  inputId?: string;
}

/**
 * Composant d'upload de logo avec drag & drop
 * Affiche une prévisualisation sur fond clair ou sombre
 */
export function LogoUploader({
  value,
  onChange,
  disabled = false,
  error: externalError,
  label,
  previewBgColor = 'light',
  inputId = 'logo-upload',
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser la preview quand la valeur externe change
  useEffect(() => {
    setPreviewUrl(null);
    setValidationError(null);
  }, [value]);

  // L'URL à afficher : preview locale ou URL existante
  const displayUrl = previewUrl || value;
  const errorMessage = validationError || externalError;

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);
      setIsProcessing(true);

      // Valider
      const validation = validateLogo(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Fichier invalide');
        setIsProcessing(false);
        return;
      }

      // Créer preview locale
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsProcessing(false);
        onChange(file);
      };
      reader.onerror = () => {
        setValidationError('Erreur lors de la lecture du fichier');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };

  const bgClass = previewBgColor === 'dark' ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          PNG, SVG, WebP • Max {LOGO_CONFIG.maxSizeKB} Ko
        </span>
      </div>

      {/* Zone d'affichage/upload */}
      {displayUrl ? (
        <div className="relative">
          <div
            className={`relative flex h-24 w-full items-center justify-center overflow-hidden rounded-md border ${bgClass}`}
          >
            <Image
              src={displayUrl}
              alt={label}
              width={200}
              height={60}
              className="max-h-16 w-auto object-contain"
              unoptimized={displayUrl.startsWith('data:')}
            />
            {/* Overlay de chargement */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          {/* Boutons d'action */}
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleClick}
              disabled={disabled || isProcessing}
            >
              Remplacer
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={handleRemove}
              disabled={disabled || isProcessing}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Uploader ${label}`}
          aria-disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 bg-muted/50 hover:bg-muted'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            ${errorMessage ? 'border-destructive/50' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-1">
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Upload
                className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {isDragging ? 'Déposez ici' : 'Glissez ou cliquez'}
            </p>
          </div>
        </div>
      )}

      {/* Input caché */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={LOGO_CONFIG.allowedTypes.join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
