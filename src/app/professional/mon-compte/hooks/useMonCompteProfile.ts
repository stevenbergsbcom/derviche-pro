/**
 * Hook de gestion du profil — chargement, formulaire, sauvegarde
 * Derviche Diffusion - Mon Compte professionnel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

import type {
  ProProfile,
  ProfileFormData,
  EditingSection,
} from '../types';

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_FORM_DATA: ProfileFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  phone2: '',
  email2: '',
  organization: '',
  function: '',
  afcNumber: '',
  address: '',
  postalCode: '',
  city: '',
  country: '',
};

// ============================================
// HOOK
// ============================================

/** Gère le chargement du profil, l'état du formulaire et la sauvegarde par section */
export function useMonCompteProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);

  // ----------------------------------------
  // Chargement du profil
  // ----------------------------------------

  const loadProfile = useCallback(async () => {
    try {
      setLoadError(false);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, email2, first_name, last_name, phone, phone2, structure, function, afc_number, address, postal_code, city, country, created_at'
        )
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('[ProMonCompte] Erreur chargement profil', error);
        setLoadError(true);
        return;
      }

      const loaded: ProProfile = {
        id: data.id as string,
        email: (data.email as string | null) ?? user.email ?? '',
        email2: (data.email2 as string | null) ?? '',
        createdAt: data.created_at as string,
        firstName: (data.first_name as string | null) ?? '',
        lastName: (data.last_name as string | null) ?? '',
        phone: (data.phone as string | null) ?? '',
        phone2: (data.phone2 as string | null) ?? '',
        organization: (data.structure as string | null) ?? '',
        function: (data.function as string | null) ?? '',
        afcNumber: (data.afc_number as string | null) ?? '',
        address: (data.address as string | null) ?? '',
        postalCode: (data.postal_code as string | null) ?? '',
        city: (data.city as string | null) ?? '',
        country: (data.country as string | null) ?? 'France',
      };

      setProfile(loaded);
      setFormData({
        firstName: loaded.firstName,
        lastName: loaded.lastName,
        phone: loaded.phone,
        phone2: loaded.phone2,
        email2: loaded.email2,
        organization: loaded.organization,
        function: loaded.function,
        afcNumber: loaded.afcNumber,
        address: loaded.address,
        postalCode: loaded.postalCode,
        city: loaded.city,
        country: loaded.country,
      });
    } catch (err) {
      logger.error(
        '[ProMonCompte] Erreur inattendue',
        err instanceof Error ? err : new Error(String(err))
      );
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // ----------------------------------------
  // Mise à jour du formulaire
  // ----------------------------------------

  const handleFormChange = useCallback((updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // ----------------------------------------
  // Sauvegarde par section
  // ----------------------------------------

  const handleSave = async (section: NonNullable<EditingSection>) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const updates: Record<string, string | null> = {};

      if (section === 'personal') {
        updates.first_name = formData.firstName.trim() || null;
        updates.last_name = formData.lastName.trim() || null;
        updates.phone = formData.phone.trim() || null;
        updates.phone2 = formData.phone2.trim() || null;
        updates.email2 = formData.email2.trim() || null;
      } else if (section === 'professional') {
        updates.structure = formData.organization.trim() || null;
        updates.function = formData.function.trim() || null;
        updates.afc_number = formData.afcNumber.trim() || null;
      } else if (section === 'address') {
        updates.address = formData.address.trim() || null;
        updates.postal_code = formData.postalCode.trim() || null;
        updates.city = formData.city.trim() || null;
        updates.country = formData.country.trim() || 'France';
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);

      if (error) {
        logger.error('[ProMonCompte] Erreur sauvegarde', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      setProfile((prev) => {
        if (!prev) return null;
        if (section === 'personal') {
          return {
            ...prev,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            phone2: formData.phone2.trim(),
            email2: formData.email2.trim(),
          };
        }
        if (section === 'professional') {
          return {
            ...prev,
            organization: formData.organization.trim(),
            function: formData.function.trim(),
            afcNumber: formData.afcNumber.trim(),
          };
        }
        return {
          ...prev,
          address: formData.address.trim(),
          postalCode: formData.postalCode.trim(),
          city: formData.city.trim(),
          country: formData.country.trim() || 'France',
        };
      });

      setEditingSection(null);
      toast.success('Profil mis à jour');
    } catch (err) {
      logger.error(
        '[ProMonCompte] Erreur sauvegarde',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------
  // Annulation de l'édition
  // ----------------------------------------

  const handleCancelEdit = (section: NonNullable<EditingSection>) => {
    if (!profile) return;
    if (section === 'personal') {
      setFormData((prev) => ({
        ...prev,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        phone2: profile.phone2,
        email2: profile.email2,
      }));
    } else if (section === 'professional') {
      setFormData((prev) => ({
        ...prev,
        organization: profile.organization,
        function: profile.function,
        afcNumber: profile.afcNumber,
      }));
    } else if (section === 'address') {
      setFormData((prev) => ({
        ...prev,
        address: profile.address,
        postalCode: profile.postalCode,
        city: profile.city,
        country: profile.country,
      }));
    }
    setEditingSection(null);
  };

  return {
    isLoading,
    loadError,
    isSaving,
    profile,
    editingSection,
    formData,
    loadProfile,
    handleFormChange,
    handleSave,
    handleCancelEdit,
    setEditingSection,
  };
}
