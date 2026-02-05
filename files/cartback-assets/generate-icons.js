const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamanhos iOS App Icon (Apple Human Interface Guidelines)
const iosAppIconSizes = [
  { size: 1024, name: 'AppStore', scale: '1x' },
  { size: 180, name: 'iPhone', scale: '3x' },  // 60pt @3x
  { size: 120, name: 'iPhone', scale: '2x' },  // 60pt @2x
  { size: 167, name: 'iPadPro', scale: '2x' }, // 83.5pt @2x
  { size: 152, name: 'iPad', scale: '2x' },    // 76pt @2x
  { size: 76, name: 'iPad', scale: '1x' },     // 76pt @1x
  { size: 87, name: 'Settings', scale: '3x' }, // 29pt @3x
  { size: 58, name: 'Settings', scale: '2x' }, // 29pt @2x
  { size: 29, name: 'Settings', scale: '1x' }, // 29pt @1x
  { size: 120, name: 'Spotlight', scale: '3x' }, // 40pt @3x
  { size: 80, name: 'Spotlight', scale: '2x' },  // 40pt @2x
  { size: 40, name: 'Spotlight', scale: '1x' },  // 40pt @1x
  { size: 60, name: 'Notification', scale: '3x' }, // 20pt @3x
  { size: 40, name: 'Notification', scale: '2x' }, // 20pt @2x
  { size: 20, name: 'Notification', scale: '1x' }, // 20pt @1x
];

// Tamanhos Favicon
const faviconSizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];

// Diretórios
const baseDir = '/home/claude/cartback-assets';
const appIconsDir = path.join(baseDir, 'app-icons');
const faviconsDir = path.join(baseDir, 'favicons');

// SVG do ícone principal
const mainIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#25D366" />
      <stop offset="100%" stop-color="#128C7E" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGradient)" />
  <g stroke="white" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M280 400 L340 400 L420 620 L700 620 L780 440 L460 440" stroke-width="44"/>
    <circle cx="460" cy="720" r="52" fill="white" />
    <circle cx="660" cy="720" r="52" fill="white" />
    <path d="M700 280 C580 240 460 280 400 380" stroke-width="44"/>
    <path d="M400 380 L460 310" stroke-width="44"/>
    <path d="M400 380 L340 320" stroke-width="44"/>
  </g>
</svg>`;

// SVG do favicon (mais arredondado)
const faviconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#25D366" />
      <stop offset="100%" stop-color="#128C7E" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bgGradient)" />
  <g stroke="white" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M140 200 L170 200 L210 310 L350 310 L390 220 L230 220" stroke-width="28"/>
    <circle cx="230" cy="360" r="28" fill="white" />
    <circle cx="330" cy="360" r="28" fill="white" />
    <path d="M350 140 C290 120 230 140 200 190" stroke-width="28"/>
    <path d="M200 190 L230 155" stroke-width="28"/>
    <path d="M200 190 L170 160" stroke-width="28"/>
  </g>
</svg>`;

async function generateIcons() {
  console.log('🎨 Gerando ícones do Cartback...\n');

  // Garantir que os diretórios existem
  [appIconsDir, faviconsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Gerar App Icons iOS
  console.log('📱 Gerando App Icons iOS...');
  const uniqueSizes = [...new Set(iosAppIconSizes.map(s => s.size))];
  
  for (const size of uniqueSizes) {
    const outputPath = path.join(appIconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(mainIconSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${size}x${size}`);
  }

  // Gerar Favicons
  console.log('\n🌐 Gerando Favicons...');
  for (const size of faviconSizes) {
    const outputPath = path.join(faviconsDir, `favicon-${size}x${size}.png`);
    await sharp(Buffer.from(faviconSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ ${size}x${size}`);
  }

  // Apple Touch Icon
  const appleTouchPath = path.join(faviconsDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(faviconSvg))
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('  ✅ apple-touch-icon.png (180x180)');

  // Android Chrome icons
  for (const size of [192, 512]) {
    const androidPath = path.join(faviconsDir, `android-chrome-${size}x${size}.png`);
    await sharp(Buffer.from(faviconSvg))
      .resize(size, size)
      .png()
      .toFile(androidPath);
    console.log(`  ✅ android-chrome-${size}x${size}.png`);
  }

  // MS Tile
  const msTilePath = path.join(faviconsDir, 'mstile-150x150.png');
  await sharp(Buffer.from(faviconSvg))
    .resize(150, 150)
    .png()
    .toFile(msTilePath);
  console.log('  ✅ mstile-150x150.png');

  console.log('\n✨ Todos os ícones foram gerados com sucesso!');
  
  // Listar arquivos gerados
  console.log('\n📁 Arquivos gerados:');
  console.log('\nApp Icons:');
  fs.readdirSync(appIconsDir).forEach(f => console.log(`  - ${f}`));
  console.log('\nFavicons:');
  fs.readdirSync(faviconsDir).forEach(f => console.log(`  - ${f}`));
}

generateIcons().catch(console.error);
