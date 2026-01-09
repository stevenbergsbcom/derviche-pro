/**
 * Script de diagnostic Supabase
 * Vérifie l'état des tables et des données
 * 
 * Usage: node scripts/check-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (depuis .env.local)
const SUPABASE_URL = 'https://qtssokeebzbjglteiayn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3Nva2VlYnpiamdsdGVpYXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzkxMzksImV4cCI6MjA4MDk1NTEzOX0.b3vyBfkO_JlBJznX9TejeFhQYuYaNbRegn6vqk9bnvQ';

// Créer le client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables à vérifier
const TABLES_TO_CHECK = [
  'venues',
  'companies', 
  'shows',
  'slots',
  'reservations',
  'profiles',
  'user_roles',
  'show_categories',
  'target_audiences',
  'show_category_mapping',
  'show_target_audience_mapping',
];

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

async function checkTable(tableName) {
  try {
    // Tenter de récupérer les données (limit 1 pour vérifier l'accès)
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      // Si erreur 42P01 = table n'existe pas
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { exists: false, count: 0, error: 'Table inexistante' };
      }
      // Autre erreur (permissions, etc.)
      return { exists: true, count: 0, error: error.message };
    }

    return { 
      exists: true, 
      count: count ?? data?.length ?? 0, 
      sample: data?.slice(0, 2),
      error: null 
    };
  } catch (err) {
    return { exists: false, count: 0, error: err.message };
  }
}

async function main() {
  console.log('\n' + colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + colors.cyan + '  🔍 DIAGNOSTIC SUPABASE - Derviche Diffusion' + colors.reset);
  console.log(colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

  console.log(`${colors.blue}📡 Connexion:${colors.reset} ${SUPABASE_URL}\n`);

  // Test de connexion basique
  console.log(colors.bold + '1. Test de connexion...' + colors.reset);
  try {
    const { error } = await supabase.from('venues').select('id').limit(1);
    if (error && error.code === '42P01') {
      log(colors.yellow, '⚠️', 'Connexion OK mais table "venues" inexistante');
    } else if (error) {
      log(colors.yellow, '⚠️', `Connexion OK mais erreur: ${error.message}`);
    } else {
      log(colors.green, '✅', 'Connexion réussie !');
    }
  } catch (err) {
    log(colors.red, '❌', `Échec de connexion: ${err.message}`);
    process.exit(1);
  }

  // Vérification des tables
  console.log('\n' + colors.bold + '2. Vérification des tables...' + colors.reset + '\n');

  const results = [];
  let tablesExist = 0;
  let tablesWithData = 0;

  for (const tableName of TABLES_TO_CHECK) {
    const result = await checkTable(tableName);
    results.push({ table: tableName, ...result });

    if (result.exists && !result.error) {
      tablesExist++;
      if (result.count > 0) {
        tablesWithData++;
        log(colors.green, '✅', `${tableName.padEnd(30)} ${colors.cyan}${result.count} enregistrement(s)${colors.reset}`);
      } else {
        log(colors.yellow, '⚠️', `${tableName.padEnd(30)} ${colors.yellow}Vide (0 enregistrement)${colors.reset}`);
      }
    } else if (result.exists && result.error) {
      log(colors.yellow, '🔒', `${tableName.padEnd(30)} ${colors.yellow}Accès refusé (RLS?)${colors.reset}`);
    } else {
      log(colors.red, '❌', `${tableName.padEnd(30)} ${colors.red}N'existe pas${colors.reset}`);
    }
  }

  // Résumé
  console.log('\n' + colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + '  📊 RÉSUMÉ' + colors.reset);
  console.log(colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

  console.log(`  Tables existantes:    ${tablesExist}/${TABLES_TO_CHECK.length}`);
  console.log(`  Tables avec données:  ${tablesWithData}/${TABLES_TO_CHECK.length}`);

  // Recommandations
  console.log('\n' + colors.bold + '  🎯 RECOMMANDATIONS:' + colors.reset);
  
  if (tablesExist === 0) {
    console.log(colors.red + '\n  ⚠️  Aucune table trouvée ! Les migrations n\'ont pas été exécutées.' + colors.reset);
    console.log('  → Exécuter les migrations via Supabase Dashboard > SQL Editor');
    console.log('  → Ou via CLI: npx supabase db push\n');
  } else if (tablesExist < TABLES_TO_CHECK.length) {
    console.log(colors.yellow + '\n  ⚠️  Certaines tables manquent. Migrations partielles ?' + colors.reset);
    console.log('  → Vérifier les migrations 001-015 dans Supabase Dashboard\n');
  } else if (tablesWithData === 0) {
    console.log(colors.yellow + '\n  ⚠️  Tables créées mais vides. Besoin de seed data.' + colors.reset);
    console.log('  → On peut insérer des données de test pour commencer\n');
  } else {
    console.log(colors.green + '\n  ✅ Tout est prêt ! On peut connecter les pages admin.' + colors.reset + '\n');
  }

  // Aperçu des données venues si disponibles
  const venuesResult = results.find(r => r.table === 'venues');
  if (venuesResult?.sample?.length > 0) {
    console.log(colors.bold + '  📍 Aperçu table "venues":' + colors.reset);
    venuesResult.sample.forEach(v => {
      console.log(`     - ${v.name} (${v.city})`);
    });
    console.log('');
  }

  console.log(colors.cyan + '═══════════════════════════════════════════════════════════\n' + colors.reset);
}

main().catch(console.error);
