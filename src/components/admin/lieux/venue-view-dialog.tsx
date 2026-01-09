'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Phone, Car, Accessibility, Train } from 'lucide-react';
import type { VenueRow } from '@/types/database';

export interface VenueViewDialogProps {
    /** Lieu à afficher (null = modale fermée) */
    venue: VenueRow | null;
    /** Callback pour fermer la modale */
    onClose: () => void;
    /** Callback pour passer en mode édition */
    onEdit: () => void;
    /** Callback pour supprimer */
    onDelete: () => void;
}

/**
 * Modale de visualisation d'un lieu
 */
export function VenueViewDialog({
    venue,
    onClose,
    onEdit,
    onDelete,
}: VenueViewDialogProps) {
    if (!venue) return null;

    return (
        <Dialog open={!!venue} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">{venue.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {venue.city}
                        {venue.postal_code && ` (${venue.postal_code})`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Adresse complète */}
                    {venue.address && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Adresse</h4>
                            <p>{venue.address}</p>
                            <p>{venue.postal_code} {venue.city}</p>
                        </div>
                    )}

                    {/* Capacité */}
                    {venue.capacity && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Capacité</h4>
                            <p>{venue.capacity} places</p>
                        </div>
                    )}

                    {/* Description */}
                    {venue.description && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                            <p className="text-sm">{venue.description}</p>
                        </div>
                    )}

                    {/* Contact */}
                    {(venue.contact_email || venue.contact_phone) && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Contact</h4>
                            <div className="space-y-1">
                                {venue.contact_email && (
                                    <p className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <a href={`mailto:${venue.contact_email}`} className="text-derviche hover:underline">
                                            {venue.contact_email}
                                        </a>
                                    </p>
                                )}
                                {venue.contact_phone && (
                                    <p className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <a href={`tel:${venue.contact_phone}`} className="text-derviche hover:underline">
                                            {venue.contact_phone}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transports */}
                    {venue.transports && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Accès transports</h4>
                            <p className="flex items-center gap-2 text-sm">
                                <Train className="w-4 h-4 text-muted-foreground" />
                                {venue.transports}
                            </p>
                        </div>
                    )}

                    {/* Services */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                            {venue.pmr_accessible && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Accessibility className="w-3 h-3" />
                                    Accessible PMR
                                </Badge>
                            )}
                            {venue.parking && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Car className="w-3 h-3" />
                                    Parking
                                </Badge>
                            )}
                            {!venue.pmr_accessible && !venue.parking && (
                                <span className="text-sm text-muted-foreground italic">
                                    Aucun service renseigné
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Coordonnées GPS */}
                    {(venue.latitude !== null && venue.longitude !== null) && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Coordonnées GPS</h4>
                            <p className="text-sm font-mono">
                                {venue.latitude}, {venue.longitude}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onDelete}
                        className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        Supprimer
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Fermer
                    </Button>
                    <Button
                        onClick={onEdit}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        Modifier
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
