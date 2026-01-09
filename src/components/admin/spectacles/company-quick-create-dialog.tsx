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
    /** Callback quand une compagnie est créée - retourne l'ID pour auto-sélection */
    onCreateCompany: (data: { name: string; email: string }) => string;
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

    const handleClose = () => {
        onOpenChange(false);
        setFormData({ name: '', email: '' });
    };

    const handleSubmit = () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            return;
        }
        const newId = onCreateCompany({
            name: formData.name.trim(),
            email: formData.email.trim(),
        });
        // Notifier le parent pour auto-sélection
        if (onCompanyCreated) {
            onCompanyCreated(newId);
        }
        handleClose();
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
                        />
                    </div>
                </div>
                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="w-full sm:w-auto"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        Créer et sélectionner
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
