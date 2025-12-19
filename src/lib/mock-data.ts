/**
 * Données mock centralisées pour les maquettes
 * Derviche Diffusion
 * 
 * Ce fichier sera remplacé par des appels Supabase lors de la connexion BDD.
 * Les types sont alignés sur src/types/database.ts
 */

import type { UserRole, SlotHostedBy, ShowStatus, ShowPriceType } from '@/types/database';

// ============================================
// TYPES MOCK (simplifiés pour les maquettes)
// ============================================

/** Compagnie mock */
export interface MockCompany {
  id: string;
  name: string;
  description?: string;
  city?: string;
  contactName?: string;
  contactEmail: string;
  contactPhone: string | null;
}

/** Lieu mock */
export interface MockVenue {
  id: string;
  name: string;
  city: string;
  address?: string;
  postalCode?: string;
  capacity?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  pmrAccessible?: boolean;
  parking?: boolean;
  transports?: string;
}

/** Utilisateur Derviche mock */
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

/** Spectacle mock */
export interface MockShow {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  companyName: string; // Dénormalisé pour faciliter l'affichage
  categories: string[];
  description?: string;
  shortDescription: string | null;
  imageUrl: string | null;
  duration: number | null; // en minutes
  audience?: string;
  status: ShowStatus;
  priceType: ShowPriceType;
  period?: string;
  dervisheManager?: string;
  invitationPolicy?: string;
  maxParticipantsPerBooking?: number;
  closureDates?: string;
  representationsCount: number;
  folderUrl?: string;
  teaserUrl?: string;
  captationAvailable: boolean;
  captationUrl?: string;
}

/** Représentation mock */
export interface MockRepresentation {
  id: string;
  showId: string;
  showTitle: string; // Dénormalisé
  companyName: string; // Dénormalisé
  date: string; // Format ISO: "2025-07-05"
  time: string; // Format: "11:00"
  venueId: string;
  venueName: string; // Dénormalisé
  capacity: number | null; // null = illimité
  booked: number;
  hostedBy: SlotHostedBy;
  hostedById: string | null;
}

// ============================================
// DONNÉES MOCK
// ============================================

/** Compagnies artistiques */
export const mockCompanies: MockCompany[] = [
  {
    id: 'company-1',
    name: 'Compagnie du Soleil',
    description: 'Compagnie de théâtre contemporain basée à Paris',
    city: 'Paris',
    contactName: 'Marie Dupont',
    contactEmail: 'marie@dusoleil.fr',
    contactPhone: '01 42 34 56 78',
  },
  {
    id: 'company-2',
    name: 'Les Artistes Associés',
    description: 'Collectif d\'artistes pluridisciplinaires',
    city: 'Lyon',
    contactName: 'Pierre Martin',
    contactEmail: 'pierre@artistes-associes.fr',
    contactPhone: '04 72 12 34 56',
  },
  {
    id: 'company-3',
    name: 'Théâtre Nomade',
    city: 'Marseille',
    contactName: 'Sophie Bernard',
    contactEmail: 'sophie@theatre-nomade.fr',
    contactPhone: '04 91 23 45 67',
  },
  {
    id: 'company-4',
    name: 'Collectif Éphémère',
    city: 'Bordeaux',
    contactName: 'Jean Lefebvre',
    contactEmail: 'jean@collectif-ephemere.fr',
    contactPhone: null,
  },
  {
    id: 'company-5',
    name: 'La Troupe Vagabonde',
    city: 'Toulouse',
    contactName: 'Claire Moreau',
    contactEmail: 'claire@vagabonde.fr',
    contactPhone: '05 61 23 45 67',
  },
];

/** Lieux / Salles */
export const mockVenues: MockVenue[] = [
  {
    id: 'venue-1',
    name: 'Théâtre des Béliers',
    city: 'Avignon',
    address: '53 rue du Portail Magnanen',
    postalCode: '84000',
    capacity: 80,
    description: 'Salle intimiste au c\u0153ur du festival',
    contactEmail: 'contact@beliers-avignon.com',
    contactPhone: '04 90 82 21 07',
    latitude: 43.9493,
    longitude: 4.8055,
    pmrAccessible: true,
    parking: false,
    transports: 'Bus ligne 2, arr\u00eat Portail Magnanen',
  },
  {
    id: 'venue-2',
    name: 'Théâtre du Balcon',
    city: 'Avignon',
    address: '38 rue Guillaume Puy',
    postalCode: '84000',
    capacity: 120,
    contactEmail: 'reservation@theatredubalcon.fr',
    contactPhone: '04 90 85 00 80',
    latitude: 43.9478,
    longitude: 4.8062,
    pmrAccessible: true,
    parking: true,
    transports: 'Parking Palais des Papes \u00e0 300m',
  },
  {
    id: 'venue-3',
    name: 'La Condition des Soies',
    city: 'Avignon',
    address: '13 rue de la Croix',
    postalCode: '84000',
    capacity: 200,
    description: 'Ancienne manufacture de soie reconvertie en lieu culturel',
    contactEmail: 'info@conditiondessoies.com',
    contactPhone: '04 90 86 58 11',
    pmrAccessible: false,
    parking: false,
  },
  {
    id: 'venue-4',
    name: 'Théâtre de la Ville',
    city: 'Paris',
    address: '2 place du Ch\u00e2telet',
    postalCode: '75001',
    capacity: 1000,
    description: 'Grand thé\u00e2tre parisien au c\u0153ur de la capitale',
    contactEmail: 'contact@theatredelaville.fr',
    contactPhone: '01 42 74 22 77',
    latitude: 48.8584,
    longitude: 2.3470,
    pmrAccessible: true,
    parking: false,
    transports: 'Métro Ch\u00e2telet (lignes 1, 4, 7, 11, 14)',
  },
  {
    id: 'venue-5',
    name: 'Théâtre du Rond-Point',
    city: 'Paris',
    address: '2 bis avenue Franklin D. Roosevelt',
    postalCode: '75008',
    capacity: 450,
    contactEmail: 'accueil@rondpoint.fr',
    contactPhone: '01 44 95 98 21',
    pmrAccessible: true,
    parking: true,
    transports: 'Métro Franklin D. Roosevelt (lignes 1, 9)',
  },
];

/** Utilisateurs Derviche (admins, super-admins, externes) */
export const mockDervisheUsers: MockUser[] = [
  { id: 'user-1', firstName: 'Alexandra', lastName: 'Martin', email: 'alexandra@derviche.com', role: 'super-admin' },
  { id: 'user-2', firstName: 'Sophie', lastName: 'Bernard', email: 'sophie@derviche.com', role: 'admin' },
  { id: 'user-3', firstName: 'Pierre', lastName: 'Dupont', email: 'pierre@derviche.com', role: 'admin' },
  { id: 'user-4', firstName: 'Marie', lastName: 'Lefebvre', email: 'marie@derviche.com', role: 'externe-dd' },
  { id: 'user-5', firstName: 'Jean', lastName: 'Moreau', email: 'jean@derviche.com', role: 'externe-dd' },
  { id: 'user-6', firstName: 'Claire', lastName: 'Dubois', email: 'claire@derviche.com', role: 'externe-dd' },
];

/** Catégories de spectacles */
export const mockCategories: string[] = ['Danse', 'Théâtre', 'Jeune public', 'Cirque', 'Marionnettes'];

/** Types de public */
export const mockAudiences: string[] = ['Tout public', 'Adultes', 'Jeune public', 'Famille'];

/** Spectacles */
export const mockShows: MockShow[] = [
  {
    id: 'show-1',
    slug: 'a-moi',
    title: 'À moi',
    companyId: 'company-1',
    companyName: 'Compagnie du Soleil',
    categories: ['Théâtre'],
    description: '<p>Un spectacle poétique et intimiste qui interroge notre rapport à l\'identité et à l\'autre.</p>',
    shortDescription: 'Un spectacle poétique sur l\'identité',
    imageUrl: '/images/spectacles/a-moi.jpg',
    duration: 60,
    audience: 'Tout public',
    status: 'published',
    priceType: 'free',
    period: 'Automne 2025',
    dervisheManager: 'Alexandra Martin',
    representationsCount: 9,
    captationAvailable: true,
    captationUrl: 'https://vimeo.com/example1',
  },
  {
    id: 'show-2',
    slug: 'le-rossignol',
    title: 'Le Rossignol',
    companyId: 'company-2',
    companyName: 'Les Artistes Associés',
    categories: ['Théâtre', 'Jeune public'],
    description: '<p>Une adaptation magique du célèbre conte d\'Andersen.</p>',
    shortDescription: 'D\'après le conte d\'Andersen',
    imageUrl: '/images/spectacles/rossignol-a-la-langue-pourrie.jpg',
    duration: 75,
    audience: 'Jeune public',
    status: 'published',
    priceType: 'free',
    period: 'Printemps 2025',
    dervisheManager: 'Sophie Bernard',
    representationsCount: 3,
    captationAvailable: false,
  },
  {
    id: 'show-3',
    slug: 'madame-bovary',
    title: 'Madame Bovary',
    companyId: 'company-3',
    companyName: 'Théâtre Nomade',
    categories: ['Théâtre'],
    description: '<p>Une adaptation audacieuse du chef-d\'\u0153uvre de Flaubert.</p>',
    shortDescription: 'Adaptation du roman de Flaubert',
    imageUrl: '/images/spectacles/madame-bovary.jpg',
    duration: 90,
    audience: 'Adultes',
    status: 'published',
    priceType: 'paid_on_site',
    period: 'Été 2025',
    dervisheManager: 'Pierre Dupont',
    representationsCount: 2,
    captationAvailable: true,
  },
  {
    id: 'show-4',
    slug: 'le-jeu',
    title: 'Le Jeu',
    companyId: 'company-4',
    companyName: 'Collectif Éphémère',
    categories: ['Théâtre'],
    shortDescription: 'Théâtre d\'improvisation',
    imageUrl: '/images/spectacles/jeu.jpg',
    duration: 55,
    audience: 'Tout public',
    status: 'published',
    priceType: 'free',
    representationsCount: 2,
    captationAvailable: false,
  },
  {
    id: 'show-5',
    slug: 'la-mer',
    title: 'La Mer',
    companyId: 'company-5',
    companyName: 'La Troupe Vagabonde',
    categories: ['Danse'],
    shortDescription: 'Une odyssée maritime',
    imageUrl: '/images/spectacles/la-mer.jpg',
    duration: 70,
    audience: 'Tout public',
    status: 'draft',
    priceType: 'free',
    representationsCount: 0,
    captationAvailable: false,
  },
];

/** Représentations (toutes, tous spectacles confondus) - Dates en 2026 */
export const mockRepresentations: MockRepresentation[] = [
  // Spectacle 1 : À moi (9 représentations)
  {
    id: 'rep-1',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-15',
    time: '11:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: 20,
    booked: 15,
    hostedBy: 'derviche',
    hostedById: 'user-1',
  },
  {
    id: 'rep-2',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-15',
    time: '15:00',
    venueId: 'venue-2',
    venueName: 'Théâtre du Balcon',
    capacity: 20,
    booked: 8,
    hostedBy: 'company',
    hostedById: null,
  },
  {
    id: 'rep-3',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-22',
    time: '11:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: 20,
    booked: 20, // Complet
    hostedBy: 'derviche',
    hostedById: 'user-2',
  },
  {
    id: 'rep-4',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-22',
    time: '15:00',
    venueId: 'venue-3',
    venueName: 'La Condition des Soies',
    capacity: 20,
    booked: 3,
    hostedBy: 'company',
    hostedById: null,
  },
  {
    id: 'rep-5',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-29',
    time: '11:00',
    venueId: 'venue-2',
    venueName: 'Théâtre du Balcon',
    capacity: 20,
    booked: 12,
    hostedBy: 'derviche',
    hostedById: 'user-4',
  },
  {
    id: 'rep-6',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-01-29',
    time: '15:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: 20,
    booked: 5,
    hostedBy: 'company',
    hostedById: null,
  },
  {
    id: 'rep-7',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-02-05',
    time: '11:00',
    venueId: 'venue-3',
    venueName: 'La Condition des Soies',
    capacity: 20,
    booked: 18,
    hostedBy: 'derviche',
    hostedById: 'user-3',
  },
  {
    id: 'rep-8',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-02-05',
    time: '15:00',
    venueId: 'venue-2',
    venueName: 'Théâtre du Balcon',
    capacity: 20,
    booked: 10,
    hostedBy: 'company',
    hostedById: null,
  },
  {
    id: 'rep-9',
    showId: 'show-1',
    showTitle: 'À moi',
    companyName: 'Compagnie du Soleil',
    date: '2026-02-12',
    time: '11:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: null, // Illimité
    booked: 5,
    hostedBy: 'derviche',
    hostedById: 'user-6',
  },
  // Spectacle 2 : Le Rossignol (3 représentations)
  {
    id: 'rep-10',
    showId: 'show-2',
    showTitle: 'Le Rossignol',
    companyName: 'Les Artistes Associés',
    date: '2026-01-18',
    time: '14:00',
    venueId: 'venue-2',
    venueName: 'Théâtre du Balcon',
    capacity: 25,
    booked: 20,
    hostedBy: 'derviche',
    hostedById: 'user-2',
  },
  {
    id: 'rep-11',
    showId: 'show-2',
    showTitle: 'Le Rossignol',
    companyName: 'Les Artistes Associés',
    date: '2026-01-25',
    time: '14:00',
    venueId: 'venue-2',
    venueName: 'Théâtre du Balcon',
    capacity: 25,
    booked: 10,
    hostedBy: 'company',
    hostedById: null,
  },
  {
    id: 'rep-12',
    showId: 'show-2',
    showTitle: 'Le Rossignol',
    companyName: 'Les Artistes Associés',
    date: '2026-02-01',
    time: '14:00',
    venueId: 'venue-3',
    venueName: 'La Condition des Soies',
    capacity: 30,
    booked: 5,
    hostedBy: 'derviche',
    hostedById: 'user-5',
  },
  // Spectacle 3 : Madame Bovary (2 représentations)
  {
    id: 'rep-13',
    showId: 'show-3',
    showTitle: 'Madame Bovary',
    companyName: 'Théâtre Nomade',
    date: '2026-02-07',
    time: '20:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: 50,
    booked: 45,
    hostedBy: 'derviche',
    hostedById: 'user-1',
  },
  {
    id: 'rep-14',
    showId: 'show-3',
    showTitle: 'Madame Bovary',
    companyName: 'Théâtre Nomade',
    date: '2026-02-14',
    time: '20:00',
    venueId: 'venue-1',
    venueName: 'Théâtre des Béliers',
    capacity: 50,
    booked: 30,
    hostedBy: 'company',
    hostedById: null,
  },
  // Spectacle 4 : Le Jeu (2 représentations - 1 seule avec places)
  {
    id: 'rep-15',
    showId: 'show-4',
    showTitle: 'Le Jeu',
    companyName: 'Collectif Éphémère',
    date: '2026-01-20',
    time: '18:00',
    venueId: 'venue-3',
    venueName: 'La Condition des Soies',
    capacity: 15,
    booked: 15, // Complet
    hostedBy: 'derviche',
    hostedById: 'user-3',
  },
  {
    id: 'rep-16',
    showId: 'show-4',
    showTitle: 'Le Jeu',
    companyName: 'Collectif Éphémère',
    date: '2026-01-27',
    time: '18:00',
    venueId: 'venue-3',
    venueName: 'La Condition des Soies',
    capacity: 15,
    booked: 8,
    hostedBy: 'company',
    hostedById: null,
  },
];

// ============================================
// HELPERS
// ============================================

/**
 * Récupère les représentations d'un spectacle spécifique
 */
export function getRepresentationsByShowId(showId: string): MockRepresentation[] {
  return mockRepresentations.filter((rep) => rep.showId === showId);
}

/**
 * Récupère un spectacle par son ID
 */
export function getShowById(showId: string): MockShow | undefined {
  return mockShows.find((show) => show.id === showId);
}

/**
 * Récupère un lieu par son ID
 */
export function getVenueById(venueId: string): MockVenue | undefined {
  return mockVenues.find((venue) => venue.id === venueId);
}

/**
 * Récupère un utilisateur par son ID
 */
export function getUserById(userId: string): MockUser | undefined {
  return mockDervisheUsers.find((user) => user.id === userId);
}

/**
 * Récupère une compagnie par son ID
 */
export function getCompanyById(companyId: string): MockCompany | undefined {
  return mockCompanies.find((company) => company.id === companyId);
}

/**
 * Compteur interne pour générer des IDs uniques côté client
 * Évite les problèmes d'hydratation SSR/Client
 */
let mockIdCounter = 1000;

/**
 * Génère un nouvel ID unique (mock)
 * Utilise un compteur incrémental pour éviter les erreurs d'hydratation
 */
export function generateMockId(prefix: string): string {
  mockIdCounter += 1;
  return `${prefix}-${mockIdCounter}`;
}
