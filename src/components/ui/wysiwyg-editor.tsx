'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface WysiwygEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
}

export function WysiwygEditor({
    value,
    onChange,
    placeholder = 'Saisissez votre texte...',
    className,
    rows = 3,
}: WysiwygEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);
    
    // Ref pour éviter les boucles infinies de mise à jour
    const isInternalUpdate = useRef(false);
    const lastValueRef = useRef(value);

    // Synchroniser la valeur externe uniquement si elle a changé depuis l'extérieur
    useEffect(() => {
        // Ne pas mettre à jour si c'est une mise à jour interne
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // Sanitizer la valeur entrante pour comparaison cohérente
        const sanitizedValue = sanitizeHtml(value);

        // Ne mettre à jour que si la valeur sanitizée a réellement changé
        if (editorRef.current && sanitizedValue !== lastValueRef.current) {
            editorRef.current.innerHTML = sanitizedValue;
            lastValueRef.current = sanitizedValue;
            setIsEmpty(!sanitizedValue || sanitizedValue === '<br>');
        }
    }, [value]);

    // Gérer le changement de contenu avec sanitization
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const cleanHtml = html === '<br>' ? '' : html;
            // Sanitizer le HTML avant de le passer au parent
            const sanitizedHtml = sanitizeHtml(cleanHtml);
            
            // Marquer comme mise à jour interne pour éviter la boucle
            isInternalUpdate.current = true;
            lastValueRef.current = sanitizedHtml;
            
            onChange(sanitizedHtml);
            setIsEmpty(!sanitizedHtml);
        }
    }, [onChange]);

    // Appliquer une commande de formatage
    const execCommand = useCallback((command: string, commandValue?: string) => {
        document.execCommand(command, false, commandValue);
        editorRef.current?.focus();
        handleInput();
    }, [handleInput]);

    // Gras
    const handleBold = useCallback(() => {
        execCommand('bold');
    }, [execCommand]);

    // Italique
    const handleItalic = useCallback(() => {
        execCommand('italic');
    }, [execCommand]);

    // Lien
    const handleLink = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();

        if (!selectedText) {
            alert('Veuillez sélectionner du texte avant d\'ajouter un lien.');
            return;
        }

        const url = prompt('Entrez l\'URL du lien :', 'https://');
        if (url && url !== 'https://') {
            // Valider que l'URL commence par http:// ou https://
            if (url.startsWith('http://') || url.startsWith('https://')) {
                execCommand('createLink', url);
            } else {
                alert('L\'URL doit commencer par http:// ou https://');
            }
        }
    }, [execCommand]);

    // Supprimer le lien
    const handleUnlink = useCallback(() => {
        execCommand('unlink');
    }, [execCommand]);

    // Gérer les raccourcis clavier
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    handleBold();
                    break;
                case 'i':
                    e.preventDefault();
                    handleItalic();
                    break;
                case 'k':
                    e.preventDefault();
                    handleLink();
                    break;
            }
        }
    }, [handleBold, handleItalic, handleLink]);

    // Gérer le collage pour sanitizer le contenu
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        // Insérer uniquement le texte brut pour éviter le HTML malveillant
        document.execCommand('insertText', false, text);
        handleInput();
    }, [handleInput]);

    // Calculer la hauteur minimum basée sur rows
    const minHeight = rows * 24; // ~24px par ligne

    return (
        <div className={cn('border rounded-md overflow-hidden', className)}>
            {/* Barre d'outils */}
            <div className="flex items-center gap-1 p-1 border-b bg-muted/30">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleBold}
                    title="Gras (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                    <span className="sr-only">Gras</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleItalic}
                    title="Italique (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                    <span className="sr-only">Italique</span>
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleLink}
                    title="Ajouter un lien (Ctrl+K)"
                >
                    <Link className="w-4 h-4" />
                    <span className="sr-only">Lien</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleUnlink}
                    title="Supprimer le lien"
                >
                    <Unlink className="w-4 h-4" />
                    <span className="sr-only">Supprimer le lien</span>
                </Button>
            </div>

            {/* Zone d'édition */}
            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className={cn(
                        'px-3 py-2 text-sm outline-none',
                        'prose prose-sm max-w-none',
                        '[&_a]:text-derviche [&_a]:underline',
                        '[&_b]:font-bold [&_strong]:font-bold',
                        '[&_i]:italic [&_em]:italic'
                    )}
                    style={{ minHeight: `${minHeight}px` }}
                    suppressContentEditableWarning
                />
                {/* Placeholder */}
                {isEmpty && !isFocused && (
                    <div
                        className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none"
                        aria-hidden="true"
                    >
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}
