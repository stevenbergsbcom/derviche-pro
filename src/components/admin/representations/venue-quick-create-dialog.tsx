'use client';

import { useState, useEffect } from 'react';
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
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface VenueQuickCreateDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Callback quand un lieu est créé - retourne l'ID pour auto-sélection (peut être async) */
    onCreateVenue: (data: { name: string; city: string }) => string | Promise<string>;
    /** Callback optionnel appelé après création avec l'ID du nouveau lieu */
    onVenueCreated?: (venueId: string) => void;
}

/**
 * Modale de création rapide d'un lieu
 */
export function VenueQuickCreateDialog({
    open,
    onOpenChange,
    onCreateVenue,
    onVenueCreated,
}: VenueQuickCreateDialogProps) {
    const [formData, setFormData] = useState<{ name: string; city: string }>({
        name: '',
        city: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Réinitialiser les états à l'ouverture du dialog
    useEffect(() => {
        if (open) {
            setIsSubmitting(false);
            setError(null);
            setFormData({ name: '', city: '' });
        }
    }, [open]);

    const handleClose = () => {
        onOpenChange(false);
        setFormData({ name: '', city: '' });
        setError(null);
        // Note: pas de setIsSubmitting(false) ici car le composant se démonte
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.city.trim()) {
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const newId = await onCreateVenue({
                name: formData.name.trim(),
                city: formData.city.trim(),
            });
            // Notifier le parent pour auto-sélection seulement si on a un ID valide
            if (onVenueCreated && newId) {
                onVenueCreated(newId);
            }
            // Succès : fermer le dialog (pas besoin de setIsSubmitting car le composant se démonte)
            handleClose();
        } catch (err) {
            // Erreur : afficher l'erreur et garder le dialog ouvert
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du lieu';
            setError(errorMessage);
            setIsSubmitting(false); // Reset seulement en cas d'erreur
            console.error('Erreur création lieu:', err);
        }
    };

    const isValid = formData.name.trim() && formData.city.trim() && !isSubmitting;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau lieu</DialogTitle>
                    <DialogDescription>
                        Ajoutez un nouveau lieu pour vos représentations.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    {/* Affichage de l'erreur */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="newVenueName">
                            Nom du lieu <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newVenueName"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Ex: Théâtre de la Ville"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newVenueCity">
                            Ville <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="newVenueCity"
                            type="text"
                            value={formData.city}
                            onChange={(e) =>
                                setFormData({ ...formData, city: e.target.value })
                            }
                            placeholder="Ex: Avignon"
                            required
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
                        disabled={!isValid}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Création...
                            </>
                        ) : (
                            'Créer et sélectionner'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
