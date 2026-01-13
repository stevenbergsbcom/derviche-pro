'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface CompanyQuickCreateDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Callback quand une compagnie est créée - retourne l'ID pour auto-sélection (sync ou async) */
    onCreateCompany: (data: { name: string; email: string }) => string | Promise<string>;
    /** Callback optionnel appelé après création avec l'ID de la nouvelle compagnie */
    onCompanyCreated?: (companyId: string) => void;
}

/**
 * Modale de création rapide d'une compagnie
 */
export function CompanyQuickCreateDialog({
    open,
    onOpenChange,
    onCreateCompany,
    onCompanyCreated,
}: CompanyQuickCreateDialogProps) {
    const [formData, setFormData] = useState<{ name: string; email: string }>({
        name: '',
        email: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        setFormData({ name: '', email: '' });
        setError(null);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = onCreateCompany({
                name: formData.name.trim(),
                email: formData.email.trim(),
            });
            
            // Supporter les fonctions sync et async
            const newId = result instanceof Promise ? await result : result;

            if (!newId) {
                setError('Erreur lors de la création de la compagnie');
                return;
            }

            // Notifier le parent pour auto-sélection
            if (onCompanyCreated) {
                onCompanyCreated(newId);
            }
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = formData.name.trim() && formData.email.trim();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer une nouvelle compagnie</DialogTitle>
                    <DialogDescription>
                        Ajoutez une nouvelle compagnie pour vos spectacles.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="newCompanyName">
                            Nom de la compagnie <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newCompanyName"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Ex: Compagnie du Soleil"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newCompanyEmail">
                            Email contact <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Cet email sera utilisé par la compagnie pour se connecter à la plateforme.
                        </p>
                        <Input
                            id="newCompanyEmail"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="email@compagnie.fr"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={!isValid || isSubmitting}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? 'Création...' : 'Créer et sélectionner'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
