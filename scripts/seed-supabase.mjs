/**
 * Script de seed Supabase
 * Insère les données de test dans la base de données
 * 
 * Usage: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-supabase.mjs
 * 
 * ATTENTION: Ce script supprime les données existantes avant d'insérer !
 * Nécessite la clé service_role pour bypasser le RLS.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://qtssokeebzbjglteiayn.supabase.co';

// Clé service_role passée en variable d'environnement (sécurité)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31m❌ Erreur: SUPABASE_SERVICE_ROLE_KEY non définie\x1b[0m');
  console.log('\nUsage:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-supabase.mjs');
  console.log('\nTrouve ta clé service_role dans:');
  console.log('  Supabase Dashboard > Project Settings > API > service_role\n');
  process.exit(1);
}

// Client avec service_role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Couleurs terminal
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${c.reset} ${message}`);
}

// ============================================
// DONNÉES DE SEED (UUIDs fixes pour les FK)
// ============================================

// UUIDs fixes pour pouvoir les référencer entre tables
const IDS = {
  companies: {
    soleil: '11111111-1111-1111-1111-111111111111',
    artistes: '22222222-2222-2222-2222-222222222222',
    nomade: '33333333-3333-3333-3333-333333333333',
    ephemere: '44444444-4444-4444-4444-444444444444',
    vagabonde: '55555555-5555-5555-5555-555555555555',
  },
  venues: {
    beliers: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    balcon: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    soies: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    ville: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    rondpoint: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  },
  categories: {
    danse: 'caaaaa01-0001-0001-0001-000000000001',
    theatre: 'caaaaa02-0002-0002-0002-000000000002',
    jeunepublic: 'caaaaa03-0003-0003-0003-000000000003',
    cirque: 'caaaaa04-0004-0004-0004-000000000004',
    marionnettes: 'caaaaa05-0005-0005-0005-000000000005',
  },
  shows: {
    amoi: 'aaaa0001-0001-0001-0001-000000000001',
    rossignol: 'aaaa0002-0002-0002-0002-000000000002',
    bovary: 'aaaa0003-0003-0003-0003-000000000003',
    jeu: 'aaaa0004-0004-0004-0004-000000000004',
    mer: 'aaaa0005-0005-0005-0005-000000000005',
  },
};

// Compagnies
const companies = [
  {
    id: IDS.companies.soleil,
    name: 'Compagnie du Soleil',
    description: 'Compagnie de théâtre contemporain basée à Paris',
    city: 'Paris',
    contact_name: 'Marie Dupont',
    contact_email: 'marie@dusoleil.fr',
    contact_phone: '01 42 34 56 78',
  },
  {
    id: IDS.companies.artistes,
    name: 'Les Artistes Associés',
    description: "Collectif d'artistes pluridisciplinaires",
    city: 'Lyon',
    contact_name: 'Pierre Martin',
    contact_email: 'pierre@artistes-associes.fr',
    contact_phone: '04 72 12 34 56',
  },
  {
    id: IDS.companies.nomade,
    name: 'Théâtre Nomade',
    description: 'Compagnie itinérante de théâtre',
    city: 'Marseille',
    contact_name: 'Sophie Bernard',
    contact_email: 'sophie@theatre-nomade.fr',
    contact_phone: '04 91 23 45 67',
  },
  {
    id: IDS.companies.ephemere,
    name: 'Collectif Éphémère',
    description: 'Créations théâtrales éphémères et uniques',
    city: 'Bordeaux',
    contact_name: 'Jean Lefebvre',
    contact_email: 'jean@collectif-ephemere.fr',
    contact_phone: null,
  },
  {
    id: IDS.companies.vagabonde,
    name: 'La Troupe Vagabonde',
    description: 'Danse contemporaine et performances',
    city: 'Toulouse',
    contact_name: 'Claire Moreau',
    contact_email: 'claire@vagabonde.fr',
    contact_phone: '05 61 23 45 67',
  },
];

// Lieux
const venues = [
  {
    id: IDS.venues.beliers,
    name: 'Théâtre des Béliers',
    city: 'Avignon',
    address: '53 rue du Portail Magnanen',
    postal_code: '84000',
    country: 'France',
    capacity: 80,
    description: 'Salle intimiste au cœur du festival',
    contact_email: 'contact@beliers-avignon.com',
    contact_phone: '04 90 82 21 07',
    latitude: 43.9493,
    longitude: 4.8055,
    pmr_accessible: true,
    parking: false,
    transports: 'Bus ligne 2, arrêt Portail Magnanen',
  },
  {
    id: IDS.venues.balcon,
    name: 'Théâtre du Balcon',
    city: 'Avignon',
    address: '38 rue Guillaume Puy',
    postal_code: '84000',
    country: 'France',
    capacity: 120,
    description: 'Théâtre moderne avec excellente acoustique',
    contact_email: 'reservation@theatredubalcon.fr',
    contact_phone: '04 90 85 00 80',
    latitude: 43.9478,
    longitude: 4.8062,
    pmr_accessible: true,
    parking: true,
    transports: 'Parking Palais des Papes à 300m',
  },
  {
    id: IDS.venues.soies,
    name: 'La Condition des Soies',
    city: 'Avignon',
    address: '13 rue de la Croix',
    postal_code: '84000',
    country: 'France',
    capacity: 200,
    description: 'Ancienne manufacture de soie reconvertie en lieu culturel',
    contact_email: 'info@conditiondessoies.com',
    contact_phone: '04 90 86 58 11',
    latitude: null,
    longitude: null,
    pmr_accessible: false,
    parking: false,
    transports: null,
  },
  {
    id: IDS.venues.ville,
    name: 'Théâtre de la Ville',
    city: 'Paris',
    address: '2 place du Châtelet',
    postal_code: '75001',
    country: 'France',
    capacity: 1000,
    description: 'Grand théâtre parisien au cœur de la capitale',
    contact_email: 'contact@theatredelaville.fr',
    contact_phone: '01 42 74 22 77',
    latitude: 48.8584,
    longitude: 2.3470,
    pmr_accessible: true,
    parking: false,
    transports: 'Métro Châtelet (lignes 1, 4, 7, 11, 14)',
  },
  {
    id: IDS.venues.rondpoint,
    name: 'Théâtre du Rond-Point',
    city: 'Paris',
    address: '2 bis avenue Franklin D. Roosevelt',
    postal_code: '75008',
    country: 'France',
    capacity: 450,
    description: 'Théâtre dédié aux écritures contemporaines',
    contact_email: 'accueil@rondpoint.fr',
    contact_phone: '01 44 95 98 21',
    latitude: null,
    longitude: null,
    pmr_accessible: true,
    parking: true,
    transports: 'Métro Franklin D. Roosevelt (lignes 1, 9)',
  },
];

// Catégories de spectacles
const showCategories = [
  { id: IDS.categories.danse, name: 'Danse', slug: 'danse', icon: '💃', display_order: 1 },
  { id: IDS.categories.theatre, name: 'Théâtre', slug: 'theatre', icon: '🎭', display_order: 2 },
  { id: IDS.categories.jeunepublic, name: 'Jeune public', slug: 'jeune-public', icon: '👶', display_order: 3 },
  { id: IDS.categories.cirque, name: 'Cirque', slug: 'cirque', icon: '🎪', display_order: 4 },
  { id: IDS.categories.marionnettes, name: 'Marionnettes', slug: 'marionnettes', icon: '🎎', display_order: 5 },
];

// Spectacles
const shows = [
  {
    id: IDS.shows.amoi,
    slug: 'a-moi',
    title: 'À moi',
    company_id: IDS.companies.soleil,
    short_description: 'Un spectacle poétique sur l\'identité',
    long_description: '<p>Un spectacle poétique et intimiste qui interroge notre rapport à l\'identité et à l\'autre. Dans un espace scénique dépouillé, deux comédiens explorent les frontières de l\'intime et du collectif.</p>',
    duration_minutes: 60,
    image_url: '/images/spectacles/a-moi.jpg',
    status: 'published',
    price_type: 'free',
    max_reservations_per_booking: 4,
    period: 'Automne 2025',
    captation_available: true,
    captation_url: 'https://vimeo.com/example1',
  },
  {
    id: IDS.shows.rossignol,
    slug: 'le-rossignol',
    title: 'Le Rossignol',
    company_id: IDS.companies.artistes,
    short_description: "D'après le conte d'Andersen",
    long_description: '<p>Une adaptation magique du célèbre conte d\'Andersen, mêlant théâtre et marionnettes.</p>',
    duration_minutes: 75,
    image_url: '/images/spectacles/rossignol.jpg',
    status: 'published',
    price_type: 'free',
    max_reservations_per_booking: 4,
    period: 'Printemps 2025',
    captation_available: false,
  },
  {
    id: IDS.shows.bovary,
    slug: 'madame-bovary',
    title: 'Madame Bovary',
    company_id: IDS.companies.nomade,
    short_description: 'Adaptation du roman de Flaubert',
    long_description: '<p>Une adaptation audacieuse du chef-d\'œuvre de Flaubert, dans une mise en scène épurée.</p>',
    duration_minutes: 90,
    image_url: '/images/spectacles/madame-bovary.jpg',
    status: 'published',
    price_type: 'paid_on_site',
    price_amount: 15.00,
    max_reservations_per_booking: 4,
    period: 'Été 2025',
    captation_available: true,
  },
  {
    id: IDS.shows.jeu,
    slug: 'le-jeu',
    title: 'Le Jeu',
    company_id: IDS.companies.ephemere,
    short_description: "Théâtre d'improvisation",
    long_description: '<p>Une expérience théâtrale unique où le public influence le déroulement du spectacle.</p>',
    duration_minutes: 55,
    image_url: '/images/spectacles/jeu.jpg',
    status: 'published',
    price_type: 'free',
    max_reservations_per_booking: 4,
    captation_available: false,
  },
  {
    id: IDS.shows.mer,
    slug: 'la-mer',
    title: 'La Mer',
    company_id: IDS.companies.vagabonde,
    short_description: 'Une odyssée maritime en danse',
    long_description: '<p>Un voyage poétique à travers les océans, porté par une chorégraphie envoûtante.</p>',
    duration_minutes: 70,
    image_url: '/images/spectacles/la-mer.jpg',
    status: 'draft',
    price_type: 'free',
    max_reservations_per_booking: 4,
    captation_available: false,
  },
];

// Mapping spectacles <-> catégories
const showCategoryMappings = [
  { show_id: IDS.shows.amoi, category_id: IDS.categories.theatre },
  { show_id: IDS.shows.rossignol, category_id: IDS.categories.theatre },
  { show_id: IDS.shows.rossignol, category_id: IDS.categories.jeunepublic },
  { show_id: IDS.shows.bovary, category_id: IDS.categories.theatre },
  { show_id: IDS.shows.jeu, category_id: IDS.categories.theatre },
  { show_id: IDS.shows.mer, category_id: IDS.categories.danse },
];

// Créneaux (slots) - dates en 2026
// UUIDs valides (format 8-4-4-4-12 hexadécimal)
const slots = [
  // À moi - 9 représentations
  { id: '00000001-0001-0001-0001-000000000001', show_id: IDS.shows.amoi, venue_id: IDS.venues.beliers, date: '2026-01-15', time: '11:00:00', capacity: 20, remaining_capacity: 5, hosted_by: 'derviche' },
  { id: '00000001-0001-0001-0001-000000000002', show_id: IDS.shows.amoi, venue_id: IDS.venues.balcon, date: '2026-01-15', time: '15:00:00', capacity: 20, remaining_capacity: 12, hosted_by: 'company' },
  { id: '00000001-0001-0001-0001-000000000003', show_id: IDS.shows.amoi, venue_id: IDS.venues.beliers, date: '2026-01-22', time: '11:00:00', capacity: 20, remaining_capacity: 0, hosted_by: 'derviche' },
  { id: '00000001-0001-0001-0001-000000000004', show_id: IDS.shows.amoi, venue_id: IDS.venues.soies, date: '2026-01-22', time: '15:00:00', capacity: 20, remaining_capacity: 17, hosted_by: 'company' },
  { id: '00000001-0001-0001-0001-000000000005', show_id: IDS.shows.amoi, venue_id: IDS.venues.balcon, date: '2026-01-29', time: '11:00:00', capacity: 20, remaining_capacity: 8, hosted_by: 'derviche' },
  { id: '00000001-0001-0001-0001-000000000006', show_id: IDS.shows.amoi, venue_id: IDS.venues.beliers, date: '2026-01-29', time: '15:00:00', capacity: 20, remaining_capacity: 15, hosted_by: 'company' },
  { id: '00000001-0001-0001-0001-000000000007', show_id: IDS.shows.amoi, venue_id: IDS.venues.soies, date: '2026-02-05', time: '11:00:00', capacity: 20, remaining_capacity: 2, hosted_by: 'derviche' },
  { id: '00000001-0001-0001-0001-000000000008', show_id: IDS.shows.amoi, venue_id: IDS.venues.balcon, date: '2026-02-05', time: '15:00:00', capacity: 20, remaining_capacity: 10, hosted_by: 'company' },
  { id: '00000001-0001-0001-0001-000000000009', show_id: IDS.shows.amoi, venue_id: IDS.venues.beliers, date: '2026-02-12', time: '11:00:00', capacity: 30, remaining_capacity: 25, hosted_by: 'derviche' },
  
  // Le Rossignol - 3 représentations
  { id: '00000002-0002-0002-0002-000000000001', show_id: IDS.shows.rossignol, venue_id: IDS.venues.balcon, date: '2026-01-18', time: '14:00:00', capacity: 25, remaining_capacity: 5, hosted_by: 'derviche' },
  { id: '00000002-0002-0002-0002-000000000002', show_id: IDS.shows.rossignol, venue_id: IDS.venues.balcon, date: '2026-01-25', time: '14:00:00', capacity: 25, remaining_capacity: 15, hosted_by: 'company' },
  { id: '00000002-0002-0002-0002-000000000003', show_id: IDS.shows.rossignol, venue_id: IDS.venues.soies, date: '2026-02-01', time: '14:00:00', capacity: 30, remaining_capacity: 25, hosted_by: 'derviche' },
  
  // Madame Bovary - 2 représentations
  { id: '00000003-0003-0003-0003-000000000001', show_id: IDS.shows.bovary, venue_id: IDS.venues.beliers, date: '2026-02-07', time: '20:00:00', capacity: 50, remaining_capacity: 5, hosted_by: 'derviche' },
  { id: '00000003-0003-0003-0003-000000000002', show_id: IDS.shows.bovary, venue_id: IDS.venues.beliers, date: '2026-02-14', time: '20:00:00', capacity: 50, remaining_capacity: 20, hosted_by: 'company' },
  
  // Le Jeu - 2 représentations
  { id: '00000004-0004-0004-0004-000000000001', show_id: IDS.shows.jeu, venue_id: IDS.venues.soies, date: '2026-01-20', time: '18:00:00', capacity: 15, remaining_capacity: 0, hosted_by: 'derviche' },
  { id: '00000004-0004-0004-0004-000000000002', show_id: IDS.shows.jeu, venue_id: IDS.venues.soies, date: '2026-01-27', time: '18:00:00', capacity: 15, remaining_capacity: 7, hosted_by: 'company' },
];

// ============================================
// FONCTIONS DE SEED
// ============================================

async function clearTable(tableName, useCompositeKey = false) {
  let query;
  
  if (useCompositeKey) {
    // Pour les tables sans colonne 'id' (clés composites), on supprime tout
    query = supabase.from(tableName).delete().neq('show_id', '00000000-0000-0000-0000-000000000000');
  } else {
    query = supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  
  const { error } = await query;
  if (error && !error.message.includes('0 rows')) {
    throw new Error(`Erreur suppression ${tableName}: ${error.message}`);
  }
}

async function insertData(tableName, data) {
  if (data.length === 0) return { count: 0 };
  
  const { data: inserted, error } = await supabase.from(tableName).insert(data).select();
  if (error) {
    throw new Error(`Erreur insertion ${tableName}: ${error.message}`);
  }
  return { count: inserted?.length || 0 };
}

async function getTargetAudiences() {
  const { data, error } = await supabase.from('target_audiences').select('id, slug');
  if (error) throw new Error(`Erreur récupération target_audiences: ${error.message}`);
  return data || [];
}

async function main() {
  console.log('\n' + c.bold + c.cyan + '═══════════════════════════════════════════════════════════' + c.reset);
  console.log(c.bold + c.cyan + '  🌱 SEED SUPABASE - Derviche Diffusion' + c.reset);
  console.log(c.bold + c.cyan + '═══════════════════════════════════════════════════════════' + c.reset + '\n');

  console.log(c.blue + '🔑 Utilisation de la clé service_role (bypass RLS)' + c.reset + '\n');

  try {
    // 1. Récupérer les target_audiences existants
    console.log(c.bold + '1. Récupération des publics cibles existants...' + c.reset);
    const targetAudiences = await getTargetAudiences();
    log(c.green, '✅', `${targetAudiences.length} publics cibles trouvés`);
    
    // Créer le mapping spectacles <-> publics cibles
    const audienceMap = {};
    targetAudiences.forEach(ta => { audienceMap[ta.slug] = ta.id; });
    
    const showTargetMappings = [];
    if (audienceMap['tout-public']) {
      showTargetMappings.push({ show_id: IDS.shows.amoi, target_audience_id: audienceMap['tout-public'] });
      showTargetMappings.push({ show_id: IDS.shows.jeu, target_audience_id: audienceMap['tout-public'] });
      showTargetMappings.push({ show_id: IDS.shows.mer, target_audience_id: audienceMap['tout-public'] });
    }
    if (audienceMap['adultes']) {
      showTargetMappings.push({ show_id: IDS.shows.bovary, target_audience_id: audienceMap['adultes'] });
    }
    if (audienceMap['jeune-public']) {
      showTargetMappings.push({ show_id: IDS.shows.rossignol, target_audience_id: audienceMap['jeune-public'] });
    }
    if (audienceMap['famille']) {
      showTargetMappings.push({ show_id: IDS.shows.rossignol, target_audience_id: audienceMap['famille'] });
      showTargetMappings.push({ show_id: IDS.shows.mer, target_audience_id: audienceMap['famille'] });
    }

    // 2. Nettoyage des tables (ordre inverse des dépendances)
    console.log('\n' + c.bold + '2. Nettoyage des tables existantes...' + c.reset);
    
    // Tables avec clés composites
    try {
      await clearTable('show_target_audience_mapping', true);
      log(c.yellow, '🗑️', 'show_target_audience_mapping vidée');
    } catch (err) {
      log(c.yellow, '⚠️', `show_target_audience_mapping: ${err.message}`);
    }
    
    try {
      await clearTable('show_category_mapping', true);
      log(c.yellow, '🗑️', 'show_category_mapping vidée');
    } catch (err) {
      log(c.yellow, '⚠️', `show_category_mapping: ${err.message}`);
    }
    
    // Tables avec id
    const tablesToClear = ['slots', 'shows', 'show_categories', 'venues', 'companies'];
    
    for (const table of tablesToClear) {
      try {
        await clearTable(table);
        log(c.yellow, '🗑️', `${table} vidée`);
      } catch (err) {
        log(c.yellow, '⚠️', `${table}: ${err.message}`);
      }
    }

    // 3. Insertion des données (ordre des dépendances)
    console.log('\n' + c.bold + '3. Insertion des données...' + c.reset);

    // Companies
    const compResult = await insertData('companies', companies);
    log(c.green, '✅', `companies: ${compResult.count} enregistrements`);

    // Venues
    const venueResult = await insertData('venues', venues);
    log(c.green, '✅', `venues: ${venueResult.count} enregistrements`);

    // Show Categories
    const catResult = await insertData('show_categories', showCategories);
    log(c.green, '✅', `show_categories: ${catResult.count} enregistrements`);

    // Shows
    const showResult = await insertData('shows', shows);
    log(c.green, '✅', `shows: ${showResult.count} enregistrements`);

    // Show Category Mapping
    const scmResult = await insertData('show_category_mapping', showCategoryMappings);
    log(c.green, '✅', `show_category_mapping: ${scmResult.count} enregistrements`);

    // Show Target Audience Mapping
    if (showTargetMappings.length > 0) {
      const stamResult = await insertData('show_target_audience_mapping', showTargetMappings);
      log(c.green, '✅', `show_target_audience_mapping: ${stamResult.count} enregistrements`);
    }

    // Slots
    const slotResult = await insertData('slots', slots);
    log(c.green, '✅', `slots: ${slotResult.count} enregistrements`);

    // Résumé
    console.log('\n' + c.bold + c.cyan + '═══════════════════════════════════════════════════════════' + c.reset);
    console.log(c.bold + '  📊 RÉSUMÉ DU SEED' + c.reset);
    console.log(c.bold + c.cyan + '═══════════════════════════════════════════════════════════' + c.reset + '\n');

    console.log(`  📦 Compagnies:        ${compResult.count}`);
    console.log(`  📍 Lieux:             ${venueResult.count}`);
    console.log(`  🏷️  Catégories:        ${catResult.count}`);
    console.log(`  🎭 Spectacles:        ${showResult.count}`);
    console.log(`  📅 Créneaux:          ${slotResult.count}`);

    console.log(c.green + '\n  ✅ Seed terminé avec succès !' + c.reset);
    console.log('  → Relance le diagnostic pour vérifier: node scripts/check-supabase.mjs\n');

  } catch (error) {
    console.error(c.red + '\n❌ Erreur lors du seed:' + c.reset, error.message);
    process.exit(1);
  }

  console.log(c.cyan + '═══════════════════════════════════════════════════════════\n' + c.reset);
}

main();
