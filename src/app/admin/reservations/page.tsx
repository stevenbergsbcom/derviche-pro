'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AdminPageHeader } from '@/components/admin';
import { useAdminReservations } from '@/hooks/useAdminReservations';
import { useShows } from '@/hooks/useShows';
import {
  useReservationColumnsPreference,
  type ReservationColumn,
  type ReservationColumnsPreference,
} from '@/hooks/useUserPreferences';
import { ColumnSelectorDialog } from '@/components/admin/column-selector-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Loader2,
  AlertTriangle,
  MoreVertical,
  Heart,
  Newspaper,
  Meh,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  CheckCircle,
  Ban,
  RefreshCw,
  Filter,
  ChevronDown,
  MapPin,
  Mail,
  Phone,
  Ticket,
  Download,
  Settings2,
  Pencil,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import type { AdminReservation, UpdateReservationData, CheckinUpdateData } from '@/lib/services/admin-reservations';
import type { ReservationStatus, CheckinStatus } from '@/types/database';
import { toast } from 'sonner';

// ============================================
// HELPERS DATE RACCOURCIS
// ============================================

type PeriodPreset = 'upcoming' | 'past' | 'all';
type DatePreset = 'this_week' | 'this_month' | 'next_month' | 'custom';
type SortOption = 'slot_date_asc' | 'slot_date_desc' | 'created_at_asc' | 'created_at_desc' | 'name_asc' | 'name_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'slot_date_asc', label: 'Date représentation ↑' },
  { value: 'slot_date_desc', label: 'Date représentation ↓' },
  { value: 'created_at_desc', label: 'Date création ↓' },
  { value: 'created_at_asc', label: 'Date création ↑' },
  { value: 'name_asc', label: 'Nom A→Z' },
  { value: 'name_desc', label: 'Nom Z→A' },
];

/**
 * Formate une date en YYYY-MM-DD en utilisant la timezone locale
 * Évite le problème de décalage UTC avec toISOString()
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDatePresetRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  const today = new Date();
  
  switch (preset) {
    case 'this_week': {
      // Lundi de cette semaine à dimanche
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1, Dimanche = 0
      monday.setDate(today.getDate() + diff);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      return {
        dateFrom: formatLocalDate(monday),
        dateTo: formatLocalDate(sunday),
      };
    }
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay),
      };
    }
    case 'next_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return {
        dateFrom: formatLocalDate(firstDay),
        dateTo: formatLocalDate(lastDay),
      };
    }
    default:
      return {};
  }
}

// ============================================
// HELPERS
// ============================================

function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatDateTimeFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const variants: Record<ReservationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    confirmed: { label: 'Confirmée', variant: 'default' },
    cancelled: { label: 'Annulée', variant: 'destructive' },
    no_show: { label: 'No-show', variant: 'secondary' },
  };
  const { label, variant } = variants[status] || { label: status, variant: 'outline' };
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function CheckinBadge({ status }: { status: CheckinStatus | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">Non pointé</span>;

  const variants: Record<CheckinStatus, { label: string; icon: React.ReactNode; className: string }> = {
    present_loved: { label: 'A aimé', icon: <Heart className="w-3 h-3" />, className: 'bg-pink-100 text-pink-700' },
    present_press: { label: 'Presse', icon: <Newspaper className="w-3 h-3" />, className: 'bg-blue-100 text-blue-700' },
    present_neutral: { label: 'Neutre', icon: <Meh className="w-3 h-3" />, className: 'bg-gray-100 text-gray-700' },
    absent: { label: 'Absent', icon: <XCircle className="w-3 h-3" />, className: 'bg-red-100 text-red-700' },
  };

  const { label, icon, className } = variants[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}

// ============================================
// HELPERS RENDU COLONNES TABLEAU
// ============================================

/** Labels des colonnes pour le header du tableau */
const COLUMN_HEADERS: Record<ReservationColumn, string> = {
  date: 'Date',
  spectacle: 'Spectacle',
  venue: 'Lieu',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone',
  emailSecondary: 'Email 2',
  phoneSecondary: 'Tél. 2',
  organization: 'Structure',
  function: 'Fonction',
  afcNumber: 'N° AFC',
  address: 'Adresse',
  numPlaces: 'Places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  checkinInternalNotes: 'Notes internes',
  createdAt: 'Créé le',
};

/** Rendu d'une cellule du tableau selon la colonne */
function renderTableCell(col: ReservationColumn, r: AdminReservation): React.ReactNode {
  switch (col) {
    case 'date':
      return r.slot ? (
        <div>
          <div className="font-medium">{formatDateFr(r.slot.date)}</div>
          <div className="text-sm text-muted-foreground">{r.slot.time}</div>
        </div>
      ) : '-';
    case 'spectacle':
      return <div className="font-medium max-w-[200px] truncate">{r.slot?.show?.title || '-'}</div>;
    case 'venue':
      return <span className="text-sm">{r.slot?.venue?.name || '-'}</span>;
    case 'lastName':
      return <span className="font-medium">{r.lastName}</span>;
    case 'firstName':
      return r.firstName;
    case 'email':
      return <span className="text-sm">{r.email}</span>;
    case 'phone':
      return <span className="text-sm">{r.phone || '-'}</span>;
    case 'emailSecondary':
      return <span className="text-sm">{r.emailSecondary || '-'}</span>;
    case 'phoneSecondary':
      return <span className="text-sm">{r.phoneSecondary || '-'}</span>;
    case 'organization':
      return <span className="text-sm">{r.organization || '-'}</span>;
    case 'function':
      return <span className="text-sm">{r.function || '-'}</span>;
    case 'afcNumber':
      return <span className="text-sm">{r.afcNumber || '-'}</span>;
    case 'address': {
      const postalCity = [r.postalCode, r.city].filter(Boolean).join(' ');
      const fullAddress = [r.address, postalCity].filter(Boolean).join(', ').trim();
      return (
        <span className="text-sm max-w-[200px] truncate block" title={fullAddress}>
          {fullAddress || '-'}
        </span>
      );
    }
    case 'numPlaces':
      return <span className="text-center block">{r.numPlaces}</span>;
    case 'status':
      return <StatusBadge status={r.status} />;
    case 'checkinStatus':
      return <CheckinBadge status={r.checkinStatus} />;
    case 'specialRequests':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.specialRequests || ''}>
          {r.specialRequests || '-'}
        </span>
      );
    case 'checkinNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinComment || ''}>
          {r.checkinComment || '-'}
        </span>
      );
    case 'checkinVenueNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinVenueNotes || ''}>
          {r.checkinVenueNotes || '-'}
        </span>
      );
    case 'checkinInternalNotes':
      return (
        <span className="text-sm max-w-[150px] truncate block" title={r.checkinInternalNotes || ''}>
          {r.checkinInternalNotes || '-'}
        </span>
      );
    case 'createdAt':
      return <span className="text-sm text-muted-foreground">{formatDateTimeFr(r.createdAt)}</span>;
    default:
      return '-';
  }
}

// ============================================
// COMPOSANT CARD MOBILE
// ============================================

interface ReservationCardProps {
  reservation: AdminReservation;
  visibleColumns: ReservationColumn[];
  onCheckin: (reservation: AdminReservation) => void;
  onEdit: (reservation: AdminReservation) => void;
  onCancel: (reservation: AdminReservation) => void;
}

function ReservationCard({ reservation, visibleColumns, onCheckin, onEdit, onCancel }: ReservationCardProps) {
  const isCancelled = reservation.status === 'cancelled';
  const isColumnVisible = (col: ReservationColumn) => visibleColumns.includes(col);
  const showName = isColumnVisible('lastName') || isColumnVisible('firstName');

  return (
    <Card 
      className={`py-1 cursor-pointer hover:bg-muted/50 transition-colors ${isCancelled ? 'opacity-60' : ''}`}
      onClick={() => !isCancelled && onEdit(reservation)}
    >
      <CardContent className="px-3 py-1.5">
        {/* Header: Nom + Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            {showName && (
              <h3 className="font-semibold text-base truncate">
                {isColumnVisible('firstName') && reservation.firstName}
                {isColumnVisible('firstName') && isColumnVisible('lastName') && ' '}
                {isColumnVisible('lastName') && reservation.lastName}
              </h3>
            )}
            {isColumnVisible('email') && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0" />
                {reservation.email}
              </p>
            )}
            {isColumnVisible('phone') && reservation.phone && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0" />
                {reservation.phone}
              </p>
            )}
            {isColumnVisible('organization') && reservation.organization && (
              <p className="text-xs text-muted-foreground mt-1">{reservation.organization}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 -mt-1 -mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(reservation)} disabled={isCancelled}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCheckin(reservation)} disabled={isCancelled}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Check-in
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCancel(reservation)} disabled={isCancelled} className="text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Annuler
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Spectacle + Date */}
        {reservation.slot && (isColumnVisible('spectacle') || isColumnVisible('date')) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
            {isColumnVisible('spectacle') && (
              <p className="font-medium text-sm line-clamp-1">
                {reservation.slot.show?.title || 'Spectacle inconnu'}
              </p>
            )}
            {isColumnVisible('date') && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateFr(reservation.slot.date)} à {reservation.slot.time}
                </span>
              </div>
            )}
            {isColumnVisible('venue') && reservation.slot.venue && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {reservation.slot.venue.name}
              </p>
            )}
          </div>
        )}

        {/* Infos supplémentaires si visibles */}
        {(isColumnVisible('specialRequests') && reservation.specialRequests) && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            <strong>Demandes :</strong> {reservation.specialRequests}
          </p>
        )}

        {/* Footer: Places + Statuts */}
        <div className="flex flex-wrap items-center gap-2">
          {isColumnVisible('numPlaces') && (
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              <Ticket className="w-3.5 h-3.5 text-derviche" />
              {reservation.numPlaces} place{reservation.numPlaces > 1 ? 's' : ''}
            </span>
          )}
          {isColumnVisible('status') && <StatusBadge status={reservation.status} />}
          {isColumnVisible('checkinStatus') && <CheckinBadge status={reservation.checkinStatus} />}
        </div>

        {/* Date de création si visible */}
        {isColumnVisible('createdAt') && (
          <p className="text-xs text-muted-foreground mt-2">
            Créé le {formatDateTimeFr(reservation.createdAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// DIALOG MODIFICATION RÉSERVATION
// ============================================

interface EditReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: AdminReservation | null;
  onSave: (data: UpdateReservationData) => Promise<void>;
  onCancel: (reservation: AdminReservation) => void;
  onGetSlots: (showId: string) => Promise<{ success: boolean; data?: Array<{ id: string; date: string; time: string; capacity: number; remainingCapacity: number; venue: { id: string; name: string; city: string } | null }>; error?: string }>;
  isSaving: boolean;
}

function EditReservationDialog({ open, onOpenChange, reservation, onSave, onCancel, onGetSlots, isSaving }: EditReservationDialogProps) {
  // Initialiser à null pour éviter la soumission avec données incomplètes
  const [formData, setFormData] = useState<UpdateReservationData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ id: string; date: string; time: string; capacity: number; remainingCapacity: number; venue: { id: string; name: string; city: string } | null }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Le formulaire est prêt uniquement quand formData est peuplé
  const isFormReady = formData !== null;

  // Ref stable pour onGetSlots afin d'éviter les re-exécutions inutiles du useEffect principal
  const onGetSlotsRef = useRef(onGetSlots);
  useEffect(() => {
    onGetSlotsRef.current = onGetSlots;
  });

  // Reset form when reservation changes
  useEffect(() => {
    if (reservation && open) {
      // Reset les erreurs de validation
      setValidationErrors([]);
      setFormData({
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        email: reservation.email,
        phone: reservation.phone,
        emailSecondary: reservation.emailSecondary,
        phoneSecondary: reservation.phoneSecondary,
        address: reservation.address,
        postalCode: reservation.postalCode,
        city: reservation.city,
        organization: reservation.organization,
        function: reservation.function,
        afcNumber: reservation.afcNumber,
        numPlaces: reservation.numPlaces,
        slotId: reservation.slotId,
        specialRequests: reservation.specialRequests,
        checkinComment: reservation.checkinComment,
        checkinVenueNotes: reservation.checkinVenueNotes,
        checkinInternalNotes: reservation.checkinInternalNotes,
      });

      // Charger les créneaux disponibles via la ref stable
      if (reservation.slot?.show?.id) {
        setLoadingSlots(true);
        setSlotsError(null);
        onGetSlotsRef.current(reservation.slot.show.id)
          .then(result => {
            if (result.success && result.data) {
              setAvailableSlots(result.data);
            } else if (result.error) {
              setSlotsError(result.error);
            }
          })
          .catch((err: Error) => {
            setSlotsError(err.message || 'Erreur lors du chargement des créneaux');
          })
          .finally(() => {
            setLoadingSlots(false);
          });
      }
    }
  }, [reservation, open]); // onGetSlots retiré des dépendances grâce à la ref

  const handleChange = (field: keyof UpdateReservationData, value: string | number | null) => {
    // Si formData est null (pendant le chargement), ignorer les modifications
    // Le formulaire est masqué pendant ce temps donc ce cas ne devrait pas arriver
    if (!formData) return;
    
    setFormData({ ...formData, [field]: value });
    // Effacer les erreurs de validation quand l'utilisateur modifie un champ
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validation côté client des champs requis
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!formData) return ['Formulaire non initialisé'];
    
    if (!formData.firstName?.trim()) {
      errors.push('Le prénom est requis');
    }
    if (!formData.lastName?.trim()) {
      errors.push('Le nom est requis');
    }
    if (!formData.email?.trim()) {
      errors.push('L\'email est requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('L\'email n\'est pas valide');
    }
    if (!formData.numPlaces || formData.numPlaces < 1) {
      errors.push('Le nombre de places doit être au moins 1');
    }
    if (!formData.slotId) {
      errors.push('Un créneau doit être sélectionné');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }
    if (!formData) return;
    await onSave(formData);
  };

  const handleCancelReservation = () => {
    if (reservation) {
      onOpenChange(false);
      onCancel(reservation);
    }
  };

  // Reset le formulaire quand le dialog se ferme
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData(null);
      setValidationErrors([]);
      setAvailableSlots([]);
      setSlotsError(null);
    }
    onOpenChange(open);
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réservation</DialogTitle>
          <DialogDescription>
            {reservation.slot?.show?.title} — {reservation.slot?.date ? formatDateFr(reservation.slot.date) : ''} à {reservation.slot?.time}
          </DialogDescription>
        </DialogHeader>

        {/* Avertissement anomalie de données */}
        {reservation.hasDataAnomaly && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Anomalie de données détectée</p>
              <p>Certains champs requis sont vides dans la base de données. Veuillez les compléter avant d&apos;enregistrer.</p>
            </div>
          </div>
        )}

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Erreurs de validation</p>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Indicateur de chargement du formulaire */}
        {!isFormReady && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-derviche" />
            <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
          </div>
        )}

        {isFormReady && <div className="space-y-6 py-4">
          {/* Section: Créneau et places */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Créneau et places
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créneau</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </div>
                ) : slotsError ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {slotsError}
                  </div>
                ) : (
                  <Select
                    value={formData.slotId || ''}
                    onValueChange={(v) => handleChange('slotId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un créneau" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map(slot => {
                        const isUnlimited = slot.capacity >= 999999;
                        const available = isUnlimited ? '∞' : slot.remainingCapacity;
                        return (
                          <SelectItem key={slot.id} value={slot.id}>
                            {formatDateFr(slot.date)} {slot.time} — {slot.venue?.name || 'Lieu ?'} ({available} dispo)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nombre de places</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.numPlaces || 1}
                  onChange={(e) => handleChange('numPlaces', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              La modification du créneau ou du nombre de places met à jour automatiquement les capacités disponibles.
            </p>
          </div>

          {/* Section: Informations personnelles */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations personnelles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email secondaire</Label>
                <Input
                  type="email"
                  value={formData.emailSecondary || ''}
                  onChange={(e) => handleChange('emailSecondary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tél. secondaire</Label>
                <Input
                  type="tel"
                  value={formData.phoneSecondary || ''}
                  onChange={(e) => handleChange('phoneSecondary', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Professionnel */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations professionnelles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Structure / Organisation</Label>
                <Input
                  value={formData.organization || ''}
                  onChange={(e) => handleChange('organization', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Input
                  value={formData.function || ''}
                  onChange={(e) => handleChange('function', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Numéro AFC</Label>
                <Input
                  value={formData.afcNumber || ''}
                  onChange={(e) => handleChange('afcNumber', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Adresse */}
          <div className="space-y-4">
            <h4 className="font-medium">Adresse</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-3">
                <Label>Adresse</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Ville</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h4 className="font-medium">Notes</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Demandes spéciales</Label>
                <Textarea
                  value={formData.specialRequests || ''}
                  onChange={(e) => handleChange('specialRequests', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes check-in</Label>
                <Textarea
                  value={formData.checkinComment || ''}
                  onChange={(e) => handleChange('checkinComment', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes lieu</Label>
                <Textarea
                  value={formData.checkinVenueNotes || ''}
                  onChange={(e) => handleChange('checkinVenueNotes', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes internes</Label>
                <Textarea
                  value={formData.checkinInternalNotes || ''}
                  onChange={(e) => handleChange('checkinInternalNotes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="destructive" 
            onClick={handleCancelReservation} 
            disabled={isSaving} 
            className="w-full sm:w-auto sm:mr-auto"
          >
            <Ban className="w-4 h-4 mr-2" />
            Annuler la réservation
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">
            Fermer
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPOSANT PAGE PRINCIPAL
// ============================================

export default function AdminReservationsPage() {
  // Hooks
  const {
    reservations,
    total,
    page,
    totalPages,
    isLoading,
    error,
    stats,
    filters,
    loadReservations,
    loadStats,
    checkin,
    update,
    cancel,
    exportToCSV,
    getSlots,
    setPage,
    setPageSize,
    pageSize,
    setFilters,
  } = useAdminReservations(50);

  const { shows, refresh: refreshShows } = useShows();
  const { 
    preference: columnsPreference, 
    visibleColumns, 
    isLoading: columnsLoading,
    setPreference: setColumnsPreference,
  } = useReservationColumnsPreference();

  // États locaux
  const [searchInput, setSearchInput] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // États filtres de date
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Chargement initial avec period: 'upcoming' et tri par date représentation
  useEffect(() => {
    void loadReservations({ period: 'upcoming', sortBy: 'slot_date_asc' });
    void loadStats();
    void refreshShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spectacles pour le filtre
  const showsOptions = useMemo(() => {
    return shows.filter(s => s.status === 'published');
  }, [shows]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleShowFilter = (showId: string) => {
    setFilters({ ...filters, showId: showId === 'all' ? undefined : showId });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status as ReservationStatus });
  };

  const handlePeriodFilter = (period: string) => {
    // Quand on change la période, on efface les dates personnalisées
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ 
      ...filters, 
      period: period as PeriodPreset,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleDatePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      // Mode personnalisé : on garde les dates actuelles
      setDatePreset('custom');
      return;
    }
    
    const range = getDatePresetRange(preset);
    setDatePreset(preset);
    setDateFrom(range.dateFrom || '');
    setDateTo(range.dateTo || '');
    setFilters({ 
      ...filters, 
      period: undefined, // Les dates écrasent la période
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    });
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setDatePreset('custom');
    setFilters({ 
      ...filters, 
      period: undefined, // Les dates écrasent la période
      dateFrom: value || undefined,
    });
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setDatePreset('custom');
    setFilters({ 
      ...filters, 
      period: undefined, // Les dates écrasent la période
      dateTo: value || undefined,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    // Reset vers "À venir" + tri par date représentation par défaut
    setFilters({ period: 'upcoming', sortBy: 'slot_date_asc' });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ ...filters, sortBy: sortBy as SortOption });
  };

  const handleCheckin = async (status: CheckinStatus) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const data: CheckinUpdateData = { checkinStatus: status };
    const result = await checkin(selectedReservation.id, data);
    setIsProcessing(false);
    if (result.success) {
      setCheckinDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await cancel(selectedReservation.id, cancelReason || undefined);
    setIsProcessing(false);
    if (result.success) {
      setCancelDialogOpen(false);
      setSelectedReservation(null);
      setCancelReason('');
      void loadStats();
    }
  };

  const handleEdit = async (data: UpdateReservationData) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await update(selectedReservation.id, data);
    setIsProcessing(false);
    if (result.success) {
      setEditDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  };

  const handleExport = async () => {
    // Afficher un avertissement si des filtres sont actifs
    // Note: period 'upcoming' est le défaut, donc on le compte comme filtre si différent
    const hasFilters = filters.showId || filters.slotId || filters.status || filters.checkinStatus || filters.search || filters.dateFrom || filters.dateTo || (filters.period && filters.period !== 'upcoming');
    
    if (hasFilters) {
      const confirmed = window.confirm(
        'Des filtres sont actifs. L\'export contiendra uniquement les réservations correspondant aux filtres actuels.\n\nContinuer ?'
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        'Aucun filtre actif. L\'export contiendra TOUTES les réservations.\n\nContinuer ?'
      );
      if (!confirmed) return;
    }

    setIsExporting(true);
    await exportToCSV();
    setIsExporting(false);
  };

  const handleSaveColumns = async (newPreference: ReservationColumnsPreference): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    const result = await setColumnsPreference(newPreference);
    setIsProcessing(false);
    if (result.success) {
      setColumnsDialogOpen(false);
      toast.success('Préférences enregistrées');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
    return result;
  };

  const openCheckinDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCheckinDialogOpen(true);
  };

  const openCancelDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const openEditDialog = (reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setEditDialogOpen(true);
  };

  // Compteur de filtres actifs (period 'upcoming' et sortBy 'slot_date_asc' sont les défauts)
  const activeFiltersCount = [
    filters.showId, 
    filters.status, 
    filters.search, 
    filters.dateFrom, 
    filters.dateTo,
    filters.period && filters.period !== 'upcoming' ? filters.period : null,
    filters.sortBy && filters.sortBy !== 'slot_date_asc' ? filters.sortBy : null,
  ].filter(Boolean).length;

  // Colonnes visibles dans l'ordre (éviter le flash au chargement)
  const columns = columnsLoading ? [] : visibleColumns;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 md:space-y-6">
      <AdminPageHeader
        title="Réservations"
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Total</p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-derviche" />
                <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Confirmées</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.confirmed}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">({stats.totalPlaces} pl.)</span>
              </div>
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Présents</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xl md:text-2xl font-bold">
                  {stats.presentLoved + stats.presentPress + stats.presentNeutral}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Annulées</p>
              <div className="flex items-center gap-2 mt-1">
                <Ban className="w-4 h-4 text-red-600" />
                <span className="text-xl md:text-2xl font-bold">{stats.cancelled}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre d'actions */}
      <div className="space-y-3">
        {/* Recherche + Actions */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => void loadReservations()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setColumnsDialogOpen(true)} title="Colonnes">
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline ml-2">Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Toggle filtres (mobile) */}
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filtres */}
        <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden md:block'}`}>
          {/* Ligne 1 : Spectacle, Statut, Tri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Spectacle</Label>
              <Select value={filters.showId || 'all'} onValueChange={handleShowFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les spectacles</SelectItem>
                  {showsOptions.map((show) => (
                    <SelectItem key={show.id} value={show.id}>{show.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="confirmed">Confirmées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                  <SelectItem value="no_show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Tri
              </Label>
              <Select 
                value={filters.sortBy || 'slot_date_asc'} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Ligne 2 : Période, Raccourci date, Du, Au, Réinitialiser */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Période</Label>
              <Select 
                value={(filters.dateFrom || filters.dateTo) ? 'all' : filters.period || 'upcoming'} 
                onValueChange={handlePeriodFilter}
                disabled={!!(filters.dateFrom || filters.dateTo)}
              >
                <SelectTrigger className={(filters.dateFrom || filters.dateTo) ? 'opacity-50' : ''}>
                  <SelectValue placeholder="À venir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="past">Passées</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Raccourci</Label>
              <Select 
                value={datePreset || ''} 
                onValueChange={(v) => handleDatePreset(v as DatePreset)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">Cette semaine</SelectItem>
                  <SelectItem value="this_month">Ce mois</SelectItem>
                  <SelectItem value="next_month">Mois prochain</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Du</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Au</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant={activeFiltersCount > 0 ? 'default' : 'ghost'} 
                onClick={handleResetFilters} 
                size="sm" 
                className={`w-full ${
                  activeFiltersCount > 0 
                    ? 'bg-derviche/10 text-derviche hover:bg-derviche/20 border border-derviche/30' 
                    : ''
                }`}
              >
                Réinitialiser
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-derviche text-white text-xs px-1.5 py-0">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {isLoading || columnsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-derviche" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => void loadReservations()}>Réessayer</Button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune réservation trouvée</p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={handleResetFilters} className="mt-4">
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Vue Cards (mobile) */}
          <div className="space-y-3 lg:hidden">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                visibleColumns={columns}
                onCheckin={openCheckinDialog}
                onEdit={openEditDialog}
                onCancel={openCancelDialog}
              />
            ))}
          </div>

          {/* Vue Tableau (desktop) */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <Card className="py-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b bg-muted">
                      <tr className="border-b transition-colors">
                        {columns.map((col) => (
                          <th 
                            key={col} 
                            className={`h-10 px-2 text-left align-middle font-medium whitespace-nowrap ${
                              col === 'numPlaces' ? 'text-center' : ''
                            }`}
                          >
                            {COLUMN_HEADERS[col]}
                          </th>
                        ))}
                        <th className="h-10 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {reservations.map((r, index) => (
                        <tr 
                          key={r.id} 
                          className={`border-b transition-colors cursor-pointer hover:bg-muted/50 ${
                            r.status === 'cancelled' ? 'opacity-60' : ''
                          } ${
                            index % 2 === 1 ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => r.status !== 'cancelled' && openEditDialog(r)}
                        >
                          {columns.map((col) => (
                            <td key={col} className="p-2 align-middle whitespace-nowrap">
                              {renderTableCell(col, r)}
                            </td>
                          ))}
                          <td className="p-2 align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(r)} disabled={r.status === 'cancelled'}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCheckinDialog(r)} disabled={r.status === 'cancelled'}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Check-in
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openCancelDialog(r)} disabled={r.status === 'cancelled'} className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Annuler
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">
              Page {page}/{totalPages || 1}
              <span className="hidden sm:inline"> ({total} résultats)</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Sélecteur nombre par page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Afficher</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Boutons pagination */}
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Précédent</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialog Check-in */}
      <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <span className="block mt-1">
                  <strong>{selectedReservation.firstName} {selectedReservation.lastName}</strong>
                  <br />{selectedReservation.numPlaces} place{selectedReservation.numPlaces > 1 ? 's' : ''}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-pink-50 hover:border-pink-300" onClick={() => void handleCheckin('present_loved')} disabled={isProcessing}>
              <Heart className="w-8 h-8 text-pink-500" />
              <span className="text-sm">A aimé</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-300" onClick={() => void handleCheckin('present_press')} disabled={isProcessing}>
              <Newspaper className="w-8 h-8 text-blue-500" />
              <span className="text-sm">Presse</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50 hover:border-gray-300" onClick={() => void handleCheckin('present_neutral')} disabled={isProcessing}>
              <Meh className="w-8 h-8 text-gray-500" />
              <span className="text-sm">Neutre</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-50 hover:border-red-300" onClick={() => void handleCheckin('absent')} disabled={isProcessing}>
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm">Absent</span>
            </Button>
          </div>
          {isProcessing && <div className="flex justify-center pb-2"><Loader2 className="w-6 h-6 animate-spin" /></div>}
        </DialogContent>
      </Dialog>

      {/* Dialog Annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <span className="block mt-1">
                  Réservation de <strong>{selectedReservation.firstName} {selectedReservation.lastName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm">Motif (optionnel)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Raison de l'annulation..."
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isProcessing} className="w-full sm:w-auto">
              Retour
            </Button>
            <Button variant="destructive" onClick={() => void handleCancel()} disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Sélecteur de colonnes */}
      <ColumnSelectorDialog
        open={columnsDialogOpen}
        onOpenChange={setColumnsDialogOpen}
        preference={columnsPreference}
        onSave={handleSaveColumns}
        isSaving={isProcessing}
      />

      {/* Dialog Modification */}
      <EditReservationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reservation={selectedReservation}
        onSave={handleEdit}
        onCancel={openCancelDialog}
        onGetSlots={getSlots}
        isSaving={isProcessing}
      />
    </div>
  );
}
