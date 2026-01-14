'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Trash2,
    Calendar,
    Maximize2,
    Minimize2,
    Clock,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import type { MockRepresentation, MockVenue, MockUser } from '@/lib/mock-data';
import type { SlotHostedBy } from '@/types/database';

// Type pour les données de génération de série
export interface GenerateSeriesData {
    startDate: string;
    endDate: string;
    weekDays: boolean[]; // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
    times: string[];
    excludedDates: string[];
    venueId: string;
    capacity: number | null;
    isUnlimited: boolean;
    hostedBy: SlotHostedBy;
    hostedById: string | null;
    includeExactDuplicates: boolean;
    includeConflicts: boolean;
}

// Type pour une représentation générée
export interface GeneratedRepresentation {
    date: string;
    time: string;
    venueId: string;
    venueName: string;
    status: 'ok' | 'exact_duplicate' | 'conflict';
}

export interface GenerateSeriesDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Callback à la soumission (peut être async) */
    onSubmit: (data: GenerateSeriesData, representationsToCreate: GeneratedRepresentation[]) => void | Promise<void>;
    /** Liste des lieux disponibles */
    venues: MockVenue[];
    /** Liste des utilisateurs Derviche */
    dervisheUsers: MockUser[];
    /** Représentations existantes (pour détecter les doublons) */
    existingRepresentations: MockRepresentation[];
    /** Callback pour ouvrir la modale de création de lieu */
    onOpenNewVenueDialog: () => void;
    /** ID du lieu nouvellement créé (pour auto-sélection) */
    newlyCreatedVenueId?: string | null;
    /** Callback pour reset l'ID du lieu nouvellement créé */
    onClearNewlyCreatedVenueId?: () => void;
}

// Labels des jours de la semaine
const weekDayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Fonction pour obtenir la date locale au format YYYY-MM-DD
function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Valeurs par défaut
const defaultSeriesData: GenerateSeriesData = {
    startDate: '',
    endDate: '',
    weekDays: [true, true, true, true, true, true, true],
    times: ['11:00'],
    excludedDates: [],
    venueId: '',
    capacity: null,
    isUnlimited: true,
    hostedBy: 'derviche',
    hostedById: null,
    includeExactDuplicates: false,
    includeConflicts: false,
};

// Fonction pour formater la date
function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00');
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Modale de génération en série de représentations
 */
export function GenerateSeriesDialog({
    open,
    onOpenChange,
    onSubmit,
    venues,
    dervisheUsers,
    existingRepresentations,
    onOpenNewVenueDialog,
    newlyCreatedVenueId,
    onClearNewlyCreatedVenueId,
}: GenerateSeriesDialogProps) {
    const [seriesData, setSeriesData] = useState<GenerateSeriesData>(defaultSeriesData);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-sélection du nouveau lieu créé
    useEffect(() => {
        if (newlyCreatedVenueId && open) {
            setSeriesData((prev) => ({ ...prev, venueId: newlyCreatedVenueId }));
            if (onClearNewlyCreatedVenueId) {
                onClearNewlyCreatedVenueId();
            }
        }
    }, [newlyCreatedVenueId, open, onClearNewlyCreatedVenueId]);

    // Réinitialiser les états à l'ouverture
    useEffect(() => {
        if (open) {
            setIsSubmitting(false);
            setError(null);
        }
    }, [open]);

    const handleClose = () => {
        onOpenChange(false);
        setSeriesData(defaultSeriesData);
        setIsExpanded(false);
        setError(null);
        // Note: pas de setIsSubmitting(false) ici car le composant se démonte
    };

    // Calculer les représentations générées
    const generatedRepresentations = useMemo(() => {
        const { startDate, endDate, weekDays, times, excludedDates, venueId } = seriesData;

        if (!startDate || !endDate || times.length === 0 || !venueId) {
            return [];
        }

        const start = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        const results: GeneratedRepresentation[] = [];
        const excludedDatesSet = new Set(excludedDates.filter((d) => d.trim() !== ''));

        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();

            if (!weekDays[dayOfWeek]) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            if (excludedDatesSet.has(dateString)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            const venue = venues.find((v) => v.id === venueId);
            if (venue) {
                times.forEach((time) => {
                    const isExactDuplicate = existingRepresentations.some(
                        (r) => r.date === dateString && r.time === time && r.venueId === venueId
                    );

                    const isConflict = !isExactDuplicate && existingRepresentations.some(
                        (r) => r.date === dateString && r.time === time && r.venueId !== venueId
                    );

                    let status: 'ok' | 'exact_duplicate' | 'conflict' = 'ok';
                    if (isExactDuplicate) {
                        status = 'exact_duplicate';
                    } else if (isConflict) {
                        status = 'conflict';
                    }

                    results.push({
                        date: dateString,
                        time,
                        venueId,
                        venueName: venue.name,
                        status,
                    });
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return results.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [seriesData, existingRepresentations, venues]);

    // Calculer les représentations qui seront effectivement créées
    const representationsToCreate = useMemo(() => {
        return generatedRepresentations.filter((rep) => {
            if (rep.status === 'exact_duplicate' && !seriesData.includeExactDuplicates) {
                return false;
            }
            if (rep.status === 'conflict' && !seriesData.includeConflicts) {
                return false;
            }
            return true;
        });
    }, [generatedRepresentations, seriesData.includeExactDuplicates, seriesData.includeConflicts]);

    // Compteurs
    const exactDuplicatesCount = useMemo(() =>
        generatedRepresentations.filter((r) => r.status === 'exact_duplicate').length
        , [generatedRepresentations]);

    const conflictsCount = useMemo(() =>
        generatedRepresentations.filter((r) => r.status === 'conflict').length
        , [generatedRepresentations]);

    // Validation
    // Note: hostedById est temporairement optionnel car les mockDervisheUsers ont des IDs non-UUID
    // TODO: Rendre obligatoire quand useDervisheUsers sera implémenté
    const isValid = useMemo(() => {
        const { startDate, endDate, weekDays, times, venueId, isUnlimited, capacity } = seriesData;

        if (!startDate || !endDate) return false;
        if (new Date(endDate) < new Date(startDate)) return false;
        if (weekDays.every((d) => !d)) return false;
        if (times.length === 0 || times.some((t) => !t.trim())) return false;
        if (!venueId) return false;
        if (!isUnlimited && (!capacity || capacity < 1)) return false;
        // hostedById temporairement optionnel - sera validé côté page
        if (representationsToCreate.length === 0) return false;
        return true;
    }, [seriesData, representationsToCreate.length]);

    const handleSubmit = async () => {
        if (!isValid) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Attendre que onSubmit se termine avant de fermer
            await onSubmit(seriesData, representationsToCreate);
            handleClose();
        } catch (err) {
            // Erreur : garder le dialog ouvert et permettre de réessayer
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération';
            setError(errorMessage);
            setIsSubmitting(false);
            console.error('Erreur lors de la génération:', err);
        }
    };

    const handleAddTime = () => {
        setSeriesData((prev) => ({
            ...prev,
            times: [...prev.times, '11:00'],
        }));
    };

    const handleRemoveTime = (index: number) => {
        setSeriesData((prev) => ({
            ...prev,
            times: prev.times.filter((_, i) => i !== index),
        }));
    };

    const handleAddExcludedDate = () => {
        setSeriesData((prev) => ({
            ...prev,
            excludedDates: [...prev.excludedDates, ''],
        }));
    };

    const handleRemoveExcludedDate = (index: number) => {
        setSeriesData((prev) => ({
            ...prev,
            excludedDates: prev.excludedDates.filter((_, i) => i !== index),
        }));
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className={`w-full max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${isExpanded ? 'sm:max-w-6xl sm:h-[90vh]' : 'sm:max-w-lg'}`}>
                <DialogHeader className="relative">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle>Générer une série</DialogTitle>
                            <DialogDescription>
                                Créez plusieurs représentations en une seule fois en définissant une période, des horaires et des jours de la semaine.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex h-8 w-8 shrink-0"
                            onClick={() => setIsExpanded(!isExpanded)}
                            title={isExpanded ? 'Réduire' : 'Agrandir'}
                        >
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            <span className="sr-only">{isExpanded ? 'Réduire' : 'Agrandir'}</span>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                    {/* Affichage de l'erreur */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    {/* Période */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">
                                Date de début <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={seriesData.startDate}
                                onChange={(e) => setSeriesData({ ...seriesData, startDate: e.target.value })}
                                min={getLocalDateString()} // Empêcher dates passées (timezone local)
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">
                                Date de fin <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={seriesData.endDate}
                                onChange={(e) => setSeriesData({ ...seriesData, endDate: e.target.value })}
                                min={seriesData.startDate || getLocalDateString()} // Minimum = date début ou aujourd'hui (timezone local)
                                required
                            />
                        </div>
                    </div>

                    {/* Jours de la semaine */}
                    <div className="space-y-2">
                        <Label>Jours de la semaine <span className="text-destructive">*</span></Label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {weekDayLabels.map((label, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`series-day-${index}`}
                                        checked={seriesData.weekDays[index]}
                                        onCheckedChange={(checked) => {
                                            setSeriesData((prev) => {
                                                const newWeekDays = [...prev.weekDays];
                                                newWeekDays[index] = checked === true;
                                                return { ...prev, weekDays: newWeekDays };
                                            });
                                        }}
                                    />
                                    <Label htmlFor={`series-day-${index}`} className="font-normal cursor-pointer text-sm">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Horaires */}
                    <div className="space-y-2">
                        <Label>Horaires <span className="text-destructive">*</span></Label>
                        <div className="space-y-2">
                            {seriesData.times.map((time, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => {
                                            setSeriesData((prev) => {
                                                const newTimes = [...prev.times];
                                                newTimes[index] = e.target.value;
                                                return { ...prev, times: newTimes };
                                            });
                                        }}
                                        className="flex-1"
                                        required
                                    />
                                    {seriesData.times.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveTime(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="sr-only">Supprimer</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTime} className="w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter un horaire
                            </Button>
                        </div>
                    </div>

                    {/* Dates à exclure */}
                    <div className="space-y-2">
                        <Label>Dates à exclure</Label>
                        <p className="text-xs text-muted-foreground">Jours fériés, relâches exceptionnelles...</p>
                        <div className="space-y-2">
                            {seriesData.excludedDates.map((date, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                            setSeriesData((prev) => {
                                                const newDates = [...prev.excludedDates];
                                                newDates[index] = e.target.value;
                                                return { ...prev, excludedDates: newDates };
                                            });
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveExcludedDate(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="sr-only">Supprimer</span>
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddExcludedDate} className="w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une exclusion
                            </Button>
                        </div>
                    </div>

                    {/* Lieu */}
                    <div className="space-y-2">
                        <Label htmlFor="seriesVenueId">Lieu <span className="text-destructive">*</span></Label>
                        <Select
                            value={seriesData.venueId ? String(seriesData.venueId) : ''}
                            onValueChange={(value) => {
                                if (value === 'new') {
                                    onOpenNewVenueDialog();
                                } else {
                                    setSeriesData({ ...seriesData, venueId: value });
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un lieu" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map((venue) => (
                                    <SelectItem key={venue.id} value={String(venue.id)}>
                                        {venue.city ? `${venue.name} - ${venue.city}` : venue.name}
                                    </SelectItem>
                                ))}
                                <div className="border-t my-1" />
                                <SelectItem value="new" className="text-derviche font-medium">
                                    ➕ Créer un nouveau lieu...
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Places max */}
                    <div className="space-y-2">
                        <Label htmlFor="seriesCapacity">Places max (pro) <span className="text-destructive">*</span></Label>
                        <p className="text-xs text-muted-foreground">Nombre maximum de programmateurs pouvant réserver</p>
                        <div className="flex items-center gap-2">
                            <Input
                                id="seriesCapacity"
                                type="number"
                                min="1"
                                value={seriesData.capacity ?? ''}
                                onChange={(e) => setSeriesData({ ...seriesData, capacity: parseInt(e.target.value) || 0 })}
                                disabled={seriesData.isUnlimited}
                                required={!seriesData.isUnlimited}
                                className={seriesData.isUnlimited ? 'flex-1 bg-muted text-muted-foreground' : 'flex-1'}
                            />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="seriesIsUnlimited"
                                    checked={seriesData.isUnlimited}
                                    onCheckedChange={(checked) => {
                                        setSeriesData({
                                            ...seriesData,
                                            isUnlimited: checked === true,
                                            capacity: checked === true ? null : 20,
                                        });
                                    }}
                                />
                                <Label htmlFor="seriesIsUnlimited" className="font-normal cursor-pointer">
                                    Illimité
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Accueil par */}
                    <div className="space-y-2">
                        <Label htmlFor="seriesWelcomeBy">Accueil par <span className="text-destructive">*</span></Label>
                        <Select
                            value={seriesData.hostedBy}
                            onValueChange={(value: SlotHostedBy) => {
                                setSeriesData({
                                    ...seriesData,
                                    hostedBy: value,
                                    hostedById: value === 'company' ? null : seriesData.hostedById,
                                });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="derviche">Derviche Diffusion</SelectItem>
                                <SelectItem value="company">Compagnie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Membre Derviche */}
                    {seriesData.hostedBy === 'derviche' && (
                        <div className="space-y-2">
                            <Label htmlFor="seriesWelcomeById">Accueilli par <span className="text-destructive">*</span></Label>
                            <Select
                                value={seriesData.hostedById ?? ''}
                                onValueChange={(value) => setSeriesData({ ...seriesData, hostedById: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un membre Derviche" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dervisheUsers.map((user) => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            {user.firstName} {user.lastName} - [
                                            {user.role === 'super-admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Externe'}]
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Aperçu */}
                    <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">
                                Aperçu : {generatedRepresentations.length} représentation{generatedRepresentations.length > 1 ? 's' : ''}
                            </h3>
                        </div>

                        {/* Warning doublons exacts */}
                        {exactDuplicatesCount > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-900">
                                        {exactDuplicatesCount} représentation{exactDuplicatesCount > 1 ? 's' : ''} existe{exactDuplicatesCount > 1 ? 'nt' : ''} déjà (même lieu)
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox
                                            id="includeExactDuplicates"
                                            checked={seriesData.includeExactDuplicates}
                                            onCheckedChange={(checked) => {
                                                setSeriesData({ ...seriesData, includeExactDuplicates: checked === true });
                                            }}
                                        />
                                        <Label htmlFor="includeExactDuplicates" className="font-normal cursor-pointer text-sm text-red-800">
                                            Inclure les doublons existants
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning conflits */}
                        {conflictsCount > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-orange-900">
                                        {conflictsCount} créneau{conflictsCount > 1 ? 'x' : ''} en conflit (autre lieu, même horaire)
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox
                                            id="includeConflicts"
                                            checked={seriesData.includeConflicts}
                                            onCheckedChange={(checked) => {
                                                setSeriesData({ ...seriesData, includeConflicts: checked === true });
                                            }}
                                        />
                                        <Label htmlFor="includeConflicts" className="font-normal cursor-pointer text-sm text-orange-800">
                                            Inclure les créneaux en conflit
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {generatedRepresentations.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-3 bg-muted/50">
                                {generatedRepresentations.map((rep, index) => {
                                    const willBeCreated =
                                        rep.status === 'ok' ||
                                        (rep.status === 'exact_duplicate' && seriesData.includeExactDuplicates) ||
                                        (rep.status === 'conflict' && seriesData.includeConflicts);

                                    return (
                                        <div
                                            key={index}
                                            className={`text-sm flex items-center gap-2 ${rep.status === 'exact_duplicate' ? 'text-red-700' : rep.status === 'conflict' ? 'text-orange-700' : 'text-foreground'} ${!willBeCreated ? 'opacity-50 line-through' : ''}`}
                                        >
                                            <Clock className="w-3 h-3 shrink-0" />
                                            <span>{formatDate(rep.date)} à {rep.time}</span>
                                            {rep.status === 'exact_duplicate' && (
                                                <Badge variant="outline" className="ml-auto text-xs bg-red-100 text-red-700 border-red-300">
                                                    Existant
                                                </Badge>
                                            )}
                                            {rep.status === 'conflict' && (
                                                <Badge variant="outline" className="ml-auto text-xs bg-orange-100 text-orange-700 border-orange-300">
                                                    Conflit
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic p-3 border rounded-md bg-muted/50">
                                Aucune représentation générée. Remplissez les champs requis pour voir l&apos;aperçu.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={!isValid || isSubmitting}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>Générer {representationsToCreate.length > 0 && `(${representationsToCreate.length})`}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
