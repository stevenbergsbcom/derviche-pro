'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { IMAGE_CONFIG, validateImage } from '@/lib/services/storage/imageStorage';

export interface ImageUploaderProps {
    /** URL de l'image actuelle (null si pas d'image) */
    value: string | null;
    /** Callback quand l'image change (File pour upload, null pour suppression) */
    onChange: (file: File | null) => void;
    /** Désactiver le composant */
    disabled?: boolean;
    /** Erreur externe à afficher */
    error?: string | null;
    /** ID unique pour l'input (pour le label) */
    inputId?: string;
}

/**
 * Composant d'upload d'image avec drag & drop
 * Affiche les specs et valide côté client
 */
export function ImageUploader({
    value,
    onChange,
    disabled = false,
    error: externalError,
    inputId = 'image-upload',
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // L'URL à afficher : preview locale ou URL existante
    const displayUrl = previewUrl || value;
    const errorMessage = validationError || externalError;

    const handleFile = useCallback((file: File) => {
        setValidationError(null);
        setIsProcessing(true);

        // Valider
        const validation = validateImage(file);
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
    }, [onChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [disabled, handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

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

    const handleRemove = () => {
        setPreviewUrl(null);
        setValidationError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange(null);
    };

    // Détecter si l'image actuelle est en base64 (ancien format à remplacer)
    const isBase64 = value?.startsWith('data:');

    return (
        <div className="space-y-2">
            {/* Specs de l'image */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="w-3 h-3" />
                <span>
                    Formats : JPG, PNG, WebP • Max : {IMAGE_CONFIG.maxSizeKB} Ko • 
                    Dimensions recommandées : {IMAGE_CONFIG.recommendedWidth}×{IMAGE_CONFIG.recommendedHeight}px
                </span>
            </div>

            {/* Zone d'affichage/upload */}
            {displayUrl ? (
                <div className="relative">
                    <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                        <Image
                            src={displayUrl}
                            alt="Aperçu de l'image"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            unoptimized={displayUrl.startsWith('data:')}
                        />
                        {/* Overlay de chargement */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                        {/* Badge base64 (ancien format) */}
                        {isBase64 && !previewUrl && (
                            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                Ancienne image (à remplacer)
                            </div>
                        )}
                    </div>
                    {/* Boutons d'action */}
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleClick}
                            disabled={disabled || isProcessing}
                        >
                            Remplacer
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleRemove}
                            disabled={disabled || isProcessing}
                        >
                            <X className="w-4 h-4" />
                            <span className="sr-only">Supprimer l&apos;image</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer
                        ${isDragging 
                            ? 'border-derviche bg-derviche/5' 
                            : 'border-muted-foreground/25 bg-muted/50 hover:bg-muted'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${errorMessage ? 'border-destructive/50' : ''}
                    `}
                >
                    <div className="flex flex-col items-center justify-center space-y-2">
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        ) : (
                            <Upload className={`w-8 h-8 ${isDragging ? 'text-derviche' : 'text-muted-foreground'}`} />
                        )}
                        <p className="text-sm font-medium text-center">
                            {isDragging 
                                ? 'Déposez l\'image ici' 
                                : 'Glissez une image ou cliquez pour sélectionner'
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Input caché */}
            <input
                ref={fileInputRef}
                id={inputId}
                type="file"
                accept={IMAGE_CONFIG.allowedTypes.join(',')}
                className="hidden"
                onChange={handleInputChange}
                disabled={disabled}
            />

            {/* Message d'erreur */}
            {errorMessage && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}
        </div>
    );
}
