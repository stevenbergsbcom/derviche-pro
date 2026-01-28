/**
 * Hook pour la gestion du formulaire utilisateur
 * Derviche Diffusion - Session 102
 *
 * @important Les callbacks parents (onSubmit, onCreate, onOpenChange) doivent être stables
 * (mémorisés avec useCallback) pour éviter des re-renders inutiles.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { InternalUser } from '@/types/database';
import type { CompanyRow } from '@/types/database';
import type { ManagedUser, ManagedRole } from '@/lib/services/internal-users';
import { getCompanies } from '@/lib/services/companies';
import {
  generatePassword,
  validatePassword,
  getPasswordStrength,
} from '@/lib/utils/password-generator';

import type {
  CreateUserFormData,
  UserFormData,
  UseUserFormDialogReturn,
} from '../types';
import { DEFAULT_CREATE_FORM_DATA, MANAGED_ROLES, VALIDATION_MESSAGES } from '../constants';
import { isManagedUser, isValidRole, isValidEmail } from '../utils';

// ============================================
// OPTIONS DU HOOK
// ============================================

interface UseUserFormDialogOptions {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Utilisateur en cours d'édition (null = mode création) */
  editingUser: InternalUser | ManagedUser | null;
  /**
   * Callback à la soumission (édition)
   * @important Doit être stable (useCallback)
   */
  onSubmit: (data: UserFormData, isEditing: boolean) => Promise<void> | void;
  /**
   * Callback à la création
   * @important Doit être stable (useCallback)
   */
  onCreate?: (data: CreateUserFormData) => Promise<void> | void;
  /**
   * Callback pour fermer la modale
   * @important Doit être stable (useCallback)
   */
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook gérant toute la logique du formulaire utilisateur
 */
export function useUserFormDialog({
  open,
  editingUser,
  onSubmit,
  onCreate,
  onOpenChange,
}: UseUserFormDialogOptions): UseUserFormDialogReturn {
  // ============================================
  // MODE
  // ============================================
  const isCreating = editingUser === null;

  // ============================================
  // ÉTATS
  // ============================================
  const [formData, setFormData] = useState<CreateUserFormData>(DEFAULT_CREATE_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Compagnies
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // ============================================
  // REFS POUR STABILITÉ DES CALLBACKS
  // ============================================
  const onSubmitRef = useRef(onSubmit);
  const onCreateRef = useRef(onCreate);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    onCreateRef.current = onCreate;
  }, [onCreate]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  // ============================================
  // EFFETS
  // ============================================

  // Charger les compagnies quand le rôle devient 'company'
  useEffect(() => {
    if (open && formData.role === 'company' && companies.length === 0) {
      const loadCompanies = async () => {
        setIsLoadingCompanies(true);
        const result = await getCompanies();
        if (!result.error) {
          setCompanies(result.data);
        }
        setIsLoadingCompanies(false);
      };
      void loadCompanies();
    }
  }, [open, formData.role, companies.length]);

  // Initialiser le formulaire quand on ouvre la modale
  useEffect(() => {
    if (open) {
      setValidationErrors({});
      setCopied(false);

      if (editingUser) {
        // Mode édition
        const companyId = isManagedUser(editingUser) ? editingUser.company_id : undefined;
        setFormData({
          first_name: editingUser.first_name || '',
          last_name: editingUser.last_name || '',
          phone: editingUser.phone || '',
          role: editingUser.role,
          email: editingUser.email,
          password: '',
          must_change_password: false,
          company_id: companyId || undefined,
        });
      } else {
        // Mode création - générer un mot de passe par défaut
        setFormData({
          ...DEFAULT_CREATE_FORM_DATA,
          password: generatePassword(),
        });
      }
    }
  }, [open, editingUser]);

  // ============================================
  // CALCULS DÉRIVÉS
  // ============================================

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const isEditingCompanyUser = !isCreating && editingUser?.role === 'company';

  const canSelectCompany = formData.role === 'company' && (isCreating || !isEditingCompanyUser);

  const isValid = isCreating
    ? isValidEmail(formData.email) &&
      formData.password !== '' &&
      validatePassword(formData.password).valid &&
      MANAGED_ROLES.includes(formData.role) &&
      (formData.role !== 'company' || !!formData.company_id)
    : MANAGED_ROLES.includes(formData.role) &&
      (formData.role !== 'company' || !!formData.company_id);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Réinitialise le formulaire
   */
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_CREATE_FORM_DATA);
    setValidationErrors({});
    setShowPassword(false);
    setCopied(false);
  }, []);

  /**
   * Ferme la modale
   */
  const handleClose = useCallback(() => {
    resetForm();
    onOpenChangeRef.current(false);
  }, [resetForm]);

  /**
   * Met à jour un champ du formulaire
   */
  const handleFieldChange = useCallback(
    (field: keyof CreateUserFormData, value: string | boolean | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Effacer l'erreur de validation pour ce champ
      setValidationErrors((prev) => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });
    },
    []
  );

  /**
   * Gère le changement de rôle
   */
  const handleRoleChange = useCallback((role: ManagedRole) => {
    if (isValidRole(role)) {
      setFormData((prev) => ({
        ...prev,
        role,
        // Réinitialiser company_id si on change vers un autre rôle
        company_id: role === 'company' ? prev.company_id : undefined,
      }));
    }
  }, []);

  /**
   * Gère le changement de compagnie
   */
  const handleCompanyChange = useCallback((companyId: string) => {
    setFormData((prev) => ({ ...prev, company_id: companyId }));
    setValidationErrors((prev) => {
      if (prev.company_id) {
        const newErrors = { ...prev };
        delete newErrors.company_id;
        return newErrors;
      }
      return prev;
    });
  }, []);

  /**
   * Génère un nouveau mot de passe
   */
  const handleGeneratePassword = useCallback(() => {
    const newPassword = generatePassword();
    setFormData((prev) => ({ ...prev, password: newPassword }));
    setCopied(false);
  }, []);

  /**
   * Copie le mot de passe dans le presse-papier
   */
  const handleCopyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Impossible de copier dans le presse-papier');
    }
  }, [formData.password]);

  /**
   * Toggle la visibilité du mot de passe
   */
  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Valide le formulaire
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validation commune
    if (!MANAGED_ROLES.includes(formData.role)) {
      errors.role = VALIDATION_MESSAGES.roleInvalid;
    }

    // Validation company_id pour le rôle company
    if (formData.role === 'company' && !formData.company_id) {
      errors.company_id = VALIDATION_MESSAGES.companyRequired;
    }

    if (isCreating) {
      // Validation email
      if (!formData.email.trim()) {
        errors.email = VALIDATION_MESSAGES.emailRequired;
      } else if (!isValidEmail(formData.email)) {
        errors.email = VALIDATION_MESSAGES.emailInvalid;
      }

      // Validation mot de passe
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isCreating]);

  /**
   * Soumet le formulaire
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (isCreating) {
      // Mode création
      if (!onCreateRef.current) {
        console.error('UserFormDialog: onCreate callback manquant en mode création');
        return;
      }
      await onCreateRef.current({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        must_change_password: formData.must_change_password,
        company_id: formData.role === 'company' ? formData.company_id : undefined,
      });
    } else {
      // Mode édition
      if (!editingUser) {
        console.error('UserFormDialog: editingUser manquant en mode édition');
        return;
      }
      await onSubmitRef.current(
        {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          company_id: formData.role === 'company' ? formData.company_id : undefined,
        },
        true
      );
    }
  }, [validateForm, isCreating, formData, editingUser]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // Mode
    isCreating,

    // États
    formData,
    showPassword,
    copied,
    validationErrors,

    // Compagnies
    companies,
    isLoadingCompanies,

    // Calculs dérivés
    passwordStrength,
    isValid,
    isEditingCompanyUser,
    canSelectCompany,

    // Handlers
    handleFieldChange,
    handleRoleChange,
    handleCompanyChange,
    handleGeneratePassword,
    handleCopyPassword,
    toggleShowPassword,
    handleSubmit,
    handleClose,
  };
}
