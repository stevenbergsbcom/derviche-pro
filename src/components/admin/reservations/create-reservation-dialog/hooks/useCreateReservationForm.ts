/**
 * Hook de gestion du formulaire de création de réservation
 * Derviche Diffusion - Session 104
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';
import type { 
  AvailableSlot, 
  ShowOption, 
  SlotsResult, 
  CreateResult,
  NotificationOptions,
} from '../types';
import { 
  INITIAL_FORM_DATA, 
  DEFAULT_MAX_PLACES, 
  TOAST_MESSAGES 
} from '../constants';
import { validateReservationForm } from '../utils';
import { DEFAULT_NOTIFICATION_OPTIONS } from '@/components/admin/reservations/notification-switches';

// ============================================
// TYPES DU HOOK
// ============================================

interface UseCreateReservationFormProps {
  open: boolean;
  shows: ShowOption[];
  onGetSlots: (showId: string) => Promise<SlotsResult>;
  onCreate: (data: CreateAdminReservationData & { _notifOptions?: NotificationOptions }) => Promise<CreateResult>;
  onOpenChange: (open: boolean) => void;
}

interface UseCreateReservationFormReturn {
  // État du formulaire
  formData: CreateAdminReservationData;
  selectedShowId: string;
  maxPlaces: number;
  
  // État des créneaux
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  slotsError: string | null;
  
  // État de validation et soumission
  validationErrors: string[];
  isSaving: boolean;
  
  // Spectacles filtrés
  publishedShows: ShowOption[];

  // Notifications
  notifOptions: NotificationOptions;
  setNotifOptions: (options: NotificationOptions) => void;
  
  // Handlers
  handleShowChange: (showId: string) => void;
  handleFieldChange: <K extends keyof CreateAdminReservationData>(
    field: K,
    value: CreateAdminReservationData[K]
  ) => void;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useCreateReservationForm({
  open,
  shows,
  onGetSlots,
  onCreate,
  onOpenChange,
}: UseCreateReservationFormProps): UseCreateReservationFormReturn {
  // États du formulaire
  const [formData, setFormData] = useState<CreateAdminReservationData>(INITIAL_FORM_DATA);
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [maxPlaces, setMaxPlaces] = useState<number>(DEFAULT_MAX_PLACES);
  
  // États des créneaux
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  
  // États de validation et soumission
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notifOptions, setNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIFICATION_OPTIONS);

  // Spectacles publiés uniquement
  const publishedShows = shows.filter(s => s.status === 'published');

  // Refs stables pour les callbacks (évite les race conditions)
  const onGetSlotsRef = useRef(onGetSlots);
  const onCreateRef = useRef(onCreate);
  const onOpenChangeRef = useRef(onOpenChange);
  
  useEffect(() => {
    onGetSlotsRef.current = onGetSlots;
    onCreateRef.current = onCreate;
    onOpenChangeRef.current = onOpenChange;
  });

  // Reset du formulaire à l'ouverture du dialog
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedShowId('');
      setMaxPlaces(DEFAULT_MAX_PLACES);
      setAvailableSlots([]);
      setSlotsError(null);
      setValidationErrors([]);
    }
  }, [open]);

  // Chargement des créneaux
  const loadSlots = useCallback(async (showId: string) => {
    if (!showId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setFormData(prev => ({ ...prev, slotId: '' }));

    try {
      const result = await onGetSlotsRef.current(showId);
      if (result.success && result.data) {
        setAvailableSlots(result.data);
        // Auto-sélection si un seul créneau
        if (result.data.length === 1) {
          setFormData(prev => ({ ...prev, slotId: result.data![0].id }));
        }
      } else if (result.error) {
        setSlotsError(result.error);
      }
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : 'Erreur lors du chargement des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // Handler changement de spectacle
  const handleShowChange = useCallback((showId: string) => {
    setSelectedShowId(showId);
    
    // Récupérer la limite de places du spectacle sélectionné
    const selectedShow = publishedShows.find(s => s.id === showId);
    if (selectedShow) {
      setMaxPlaces(selectedShow.max_reservations_per_booking);
      
      // Réinitialiser le nombre de places si nécessaire
      setFormData(prev => {
        if (prev.numPlaces > selectedShow.max_reservations_per_booking) {
          return { ...prev, numPlaces: selectedShow.max_reservations_per_booking };
        }
        return prev;
      });
    }
    
    void loadSlots(showId);
  }, [publishedShows, loadSlots]);

  // Handler changement de champ
  const handleFieldChange = useCallback(<K extends keyof CreateAdminReservationData>(
    field: K,
    value: CreateAdminReservationData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer les erreurs de validation (lecture via setState fonctionnel)
    setValidationErrors(prev => prev.length > 0 ? [] : prev);
  }, []); // Pas de dépendances externes

  // Handler soumission
  const handleSubmit = useCallback(async () => {
    const errors = validateReservationForm(
      formData,
      selectedShowId,
      maxPlaces,
      availableSlots
    );
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(TOAST_MESSAGES.validationError);
      return;
    }

    setIsSaving(true);
    try {
      const result = await onCreateRef.current({ ...formData, _notifOptions: notifOptions });
      
      if (result.success) {
        toast.success(TOAST_MESSAGES.createSuccess);
        onOpenChangeRef.current(false);
      } else {
        toast.error(result.error || TOAST_MESSAGES.createError);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : TOAST_MESSAGES.createError);
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedShowId, maxPlaces, availableSlots, notifOptions]);

  // Handler fermeture
  const handleClose = useCallback(() => {
    if (!isSaving) {
      onOpenChangeRef.current(false);
    }
  }, [isSaving]);

  return {
    // État du formulaire
    formData,
    selectedShowId,
    maxPlaces,
    
    // État des créneaux
    availableSlots,
    loadingSlots,
    slotsError,
    
    // État de validation et soumission
    validationErrors,
    isSaving,
    
    // Spectacles filtrés
    publishedShows,
    
    // Notifications
    notifOptions,
    setNotifOptions,

    // Handlers
    handleShowChange,
    handleFieldChange,
    handleSubmit,
    handleClose,
  };
}
