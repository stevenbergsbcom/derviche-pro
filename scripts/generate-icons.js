/**
 * Script de génération d'icônes PWA placeholder
 * Derviche Diffusion
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Couleurs Derviche
const DERVICHE_DARK = '#1e3a5f';
const GOLD = '#d4a843';

// Fonction pour créer un SVG simple avec la lettre D
function createSVGIcon(size) {
  const letterSize = Math.floor(size * 0.55);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.floor(size * 0.18);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${DERVICHE_DARK}" rx="${radius}"/>
  <text x="${centerX}" y="${centerY + letterSize * 0.35}" font-family="Arial, Helvetica, sans-serif" font-size="${letterSize}" font-weight="bold" fill="${GOLD}" text-anchor="middle">D</text>
</svg>`;
}

async function generateIcons() {
  // Créer le dossier icons s'il n'existe pas
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sizes = [192, 512];

  // Essayer d'utiliser sharp si disponible
  let sharp;
  try {
    sharp = require('sharp');
    console.log('✓ Sharp trouvé - génération en PNG\n');
  } catch {
    console.log('⚠️  Sharp non trouvé - génération en SVG uniquement\n');
    console.log('   Pour générer des PNG, installe sharp: npm install sharp\n');
    sharp = null;
  }

  for (const size of sizes) {
    const svg = createSVGIcon(size);
    const svgBuffer = Buffer.from(svg);

    if (sharp) {
      // Générer PNG avec sharp
      const pngFilename = `icon-${size}.png`;
      const pngPath = path.join(iconsDir, pngFilename);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✓ Créé: ${pngFilename} (${size}x${size})`);
    } else {
      // Fallback SVG
      const svgFilename = `icon-${size}.svg`;
      const svgPath = path.join(iconsDir, svgFilename);
      
      fs.writeFileSync(svgPath, svg);
      console.log(`✓ Créé: ${svgFilename} (${size}x${size})`);
    }
  }

  console.log('\n✅ Icônes générées dans /public/icons/');
  
  if (!sharp) {
    console.log('\n📝 Note: Les icônes SVG doivent être converties en PNG.');
    console.log('   Utilise https://svgtopng.com ou installe sharp.\n');
  }
}

generateIcons().catch(console.error);
