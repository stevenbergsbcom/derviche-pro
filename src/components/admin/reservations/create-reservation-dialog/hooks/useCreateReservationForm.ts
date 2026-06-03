/**
 * Hook de gestion du formulaire de création de réservation
 * Derviche Diffusion - Session 104
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';
import { checkDuplicateReservation } from '@/lib/services/reservations-duplicate';
import type { DuplicateCheckResult } from '@/lib/services/reservations-duplicate';
import { isSlotTimePast } from '@/lib/utils/timezone';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';
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

  // S184 : Doublons
  duplicateInfo: DuplicateCheckResult | null;
  showDuplicateDialog: boolean;
  handleConfirmDuplicate: () => void;
  handleCancelDuplicate: () => void;

  // Confirmation « créneau passé »
  showPastSlotDialog: boolean;
  /** True si le slot sélectionné a une heure antérieure à maintenant. */
  selectedSlotIsPast: boolean;
  handleConfirmPastSlot: () => void;
  handleCancelPastSlot: () => void;

  // Handlers
  handleShowChange: (showId: string) => void;
  handleFieldChange: <K extends keyof CreateAdminReservationData>(
    field: K,
    value: CreateAdminReservationData[K]
  ) => void;
  handleProfileSelect: (profile: FoundProfile) => void;
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

  // S184 : Doublons
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Confirmation « créneau passé »
  const [showPastSlotDialog, setShowPastSlotDialog] = useState(false);
  const pastSlotConfirmedRef = useRef(false);

  // Spectacles publiés uniquement
  const publishedShows = shows.filter(s => s.status === 'published');

  // Computed : le slot sélectionné a-t-il une heure passée ?
  const selectedSlot = availableSlots.find(s => s.id === formData.slotId);
  const selectedSlotIsPast = selectedSlot
    ? isSlotTimePast(selectedSlot.date, selectedSlot.time)
    : false;

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
      setShowPastSlotDialog(false);
      pastSlotConfirmedRef.current = false;
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

    // Si on change de slot, on réinitialise la confirmation « créneau passé »
    // (le user doit re-confirmer s'il choisit un nouveau slot dont l'heure
    // est aussi passée).
    if (field === 'slotId') {
      pastSlotConfirmedRef.current = false;
    }
  }, []); // Pas de dépendances externes

  // S189 : Pré-remplissage depuis un profil professionnel
  const handleProfileSelect = useCallback((profile: FoundProfile) => {
    setFormData((prev) => ({
      ...prev,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email,
      phone: profile.phone ?? null,
      emailSecondary: profile.email2 ?? null,
      phoneSecondary: profile.phone2 ?? null,
      organization: profile.organization ?? null,
      function: profile.function ?? null,
      afcNumber: profile.afcNumber ?? null,
      // S174 + Session B — pré-remplir les IDs CRM Zoho depuis le profil sélectionné
      crmId: profile.crmId ?? null,
      crmStructureId: profile.crmStructureId ?? null,
      address: profile.address ?? null,
      postalCode: profile.postalCode ?? null,
      city: profile.city ?? null,
      country: profile.country ?? 'France',
    }));
    setValidationErrors([]);
  }, []);

  // S184 : Création effective (appelée directement ou après confirmation doublon)
  const performCreate = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await onCreateRef.current({ ...formData, _notifOptions: notifOptions });

      if (result.success) {
        // Session B + retour audit Cursor : surface l'avertissement non-bloquant
        // si le side-update CRM a échoué (la résa est créée, mais un ID CRM n'a
        // pas été persisté). Affiché AVANT le succès pour que l'utilisateur
        // remarque l'anomalie.
        if (result.warning) {
          toast.warning(result.warning);
        }
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
  }, [formData, notifOptions]);

  // Étape post « créneau passé » : check doublon + création. Extraite pour
  // pouvoir être appelée depuis handleSubmit ET handleConfirmPastSlot.
  const proceedAfterPastSlotCheck = useCallback(async () => {
    // S184 : Vérifier les doublons avant de créer
    const email = formData.email?.trim();
    if (email && formData.slotId) {
      setIsSaving(true);
      const dupResult = await checkDuplicateReservation(formData.slotId, email);
      setIsSaving(false);

      if (dupResult.hasDuplicate) {
        setDuplicateInfo(dupResult);
        setShowDuplicateDialog(true);
        return;
      }
    }

    // Pas de doublon → créer directement
    await performCreate();
  }, [formData.email, formData.slotId, performCreate]);

  // Handler soumission (avec détection doublons S184 + confirmation
  // « créneau passé » si l'heure du slot est antérieure à maintenant)
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

    // Confirmation « créneau passé » : intercepter avant le check doublon.
    if (!pastSlotConfirmedRef.current) {
      const slot = availableSlots.find(s => s.id === formData.slotId);
      if (slot && isSlotTimePast(slot.date, slot.time)) {
        setShowPastSlotDialog(true);
        return;
      }
    }

    await proceedAfterPastSlotCheck();
  }, [formData, selectedShowId, maxPlaces, availableSlots, proceedAfterPastSlotCheck]);

  // S184 : Confirmer la création malgré doublon
  const handleConfirmDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
    void performCreate();
  }, [performCreate]);

  // S184 : Annuler (doublon détecté)
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
  }, []);

  // Confirmation « créneau passé » : l'admin a vu la modale et confirme.
  // Garde anti double-clic : si le ref est déjà à `true`, on ignore les
  // clics suivants (Radix peut maintenir le bouton actif pendant la
  // transition de fermeture de la modale).
  const handleConfirmPastSlot = useCallback(() => {
    if (pastSlotConfirmedRef.current) return;
    pastSlotConfirmedRef.current = true;
    setShowPastSlotDialog(false);
    void proceedAfterPastSlotCheck();
  }, [proceedAfterPastSlotCheck]);

  const handleCancelPastSlot = useCallback(() => {
    setShowPastSlotDialog(false);
  }, []);

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

    // S184 : Doublons
    duplicateInfo,
    showDuplicateDialog,
    handleConfirmDuplicate,
    handleCancelDuplicate,

    // Confirmation « créneau passé »
    showPastSlotDialog,
    selectedSlotIsPast,
    handleConfirmPastSlot,
    handleCancelPastSlot,

    // Handlers
    handleShowChange,
    handleFieldChange,
    handleProfileSelect,
    handleSubmit,
    handleClose,
  };
}
