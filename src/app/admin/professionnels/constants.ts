/**
 * Constantes pour la page Admin Professionnels
 * Derviche Diffusion
 */

import type { StatusFilter } from './types';

// ============================================
// FILTRES
// ============================================

export const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'inactive'];

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Tous les statuts',
  active: 'Actifs',
  inactive: 'Inactifs',
};

// ============================================
// STYLES
// ============================================

export const STATUS_BADGE_CLASSES = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
} as const;

// ============================================
// MESSAGES
// ============================================

export const MESSAGES = {
  LOADING: 'Chargement des professionnels...',
  ERROR_PREFIX: 'Erreur lors du chargement : ',
  NO_PROFESSIONALS: 'Aucun professionnel enregistré',
  NO_RESULTS: 'Aucun professionnel ne correspond aux filtres',
  DELETE_SUCCESS: 'Professionnel supprimé avec succès',
  UPDATE_SUCCESS: 'Profil mis à jour avec succès',
  TOGGLE_ACTIVE_SUCCESS: 'Compte réactivé',
  TOGGLE_INACTIVE_SUCCESS: 'Compte désactivé',
} as const;

export const LABELS = {
  PAGE_TITLE: 'Professionnels',
  PAGE_SUBTITLE: 'Gestion des comptes programmateurs',
  SEARCH_PLACEHOLDER: 'Rechercher par nom, email, structure, ville…',
  FILTER_STATUS: 'Statut',
  FILTER_CITY: 'Ville',
  ALL_CITIES: 'Toutes les villes',
  VIEW_DETAIL: 'Voir le détail',
  EDIT: 'Modifier',
  ACTIVATE: 'Activer',
  DEACTIVATE: 'Désactiver',
  DELETE: 'Supprimer',
  EMAIL_CONTACT: 'Envoyer un email',
  CLOSE: 'Fermer',
  CANCEL: 'Annuler',
  SAVE: 'Enregistrer',
  SAVING: 'Enregistrement…',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  NO_DATA: '—',
} as const;

export const TABLE_COLUMNS = {
  NAME: 'Nom / Prénom',
  EMAIL: 'Email',
  STRUCTURE: 'Structure',
  PHONE: 'Téléphone',
  EMAIL2: 'Email secondaire',
  PHONE2: 'Tél. secondaire',
  FUNCTION: 'Fonction',
  CITY: 'Ville',
  RESERVATIONS: 'Résa.',
  STATUS: 'Statut',
  ACTIONS: 'Actions',
} as const;

export const DELETE_DIALOG = {
  TITLE: 'Supprimer ce professionnel ?',
  CONFIRM_TEXT: 'Supprimer',
  CANCEL_TEXT: 'Annuler',
} as const;

export const DRAWER_TABS = {
  info: 'Informations',
  reservations: 'Réservations',
} as const;
