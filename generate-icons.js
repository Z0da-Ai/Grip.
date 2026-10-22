// DISABLED: icons now come from the custom icon (see android/app/src/main/res/drawable-*dpi). Running this would overwrite them.
console.error("generate-icons is disabled"); process.exit(1);

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Background color from user's image: charcoal dark slate #282A30 to #2D3037
// Notice the clean background of the user's image is a sleek solid dark charcoal #2D3038
const bgColor = '#2A2D34';

// 512x512 SVG Master Icon
// Perfectly proportional to the user's uploaded chain link icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Smooth subtle gradient for dark slate background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#32353D" />
      <stop offset="100%" stop-color="#26282E" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- The Chain Link Symbol rotated at 45 degrees matching user's image -->
  <g transform="translate(256, 256) rotate(-45)">
    <!-- Left Loop -->
    <path 
      d="M -16 -62 L -68 -62 A 62 62 0 0 0 -68 62 L -16 62" 
      fill="none" 
      stroke="#FFFFFF" 
      stroke-width="38" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />

    <!-- Right Loop -->
    <path 
      d="M 16 62 L 68 62 A 62 62 0 0 0 68 -62 L 16 -62" 
      fill="none" 
      stroke="#FFFFFF" 
      stroke-width="38" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />

    <!-- Center Connecting Bar -->
    <line 
      x1="-44" 
      y1="0" 
      x2="44" 
      y2="0" 
      stroke="#FFFFFF" 
      stroke-width="38" 
      stroke-linecap="round" 
    />
  </g>
</svg>`;

async function generateAll() {
  const publicDir = path.resolve('public');
  
  // 1. Save master icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
  console.log('Saved icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved pwa-512x512.png');

  // 3. Generate pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved pwa-192x192.png');

  // 4. Generate apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved apple-touch-icon.png');

  // 5. Generate favicon.png (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved favicon.png');

  // 6. Generate maskable icon (safe area padding for Android adaptive icons)
  // For maskable icon, Google requires the core graphic to reside within 80% circle safe zone (inner 410px of 512px)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="url(#bgGrad)" />
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#32353D" />
        <stop offset="100%" stop-color="#26282E" />
      </linearGradient>
    </defs>
    <!-- Scale slightly to 0.82 to perfectly fit inside circular/squircle mask on Android home screen -->
    <g transform="translate(256, 256) scale(0.82) rotate(-45)">
      <path 
        d="M -16 -62 L -68 -62 A 62 62 0 0 0 -68 62 L -16 62" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="38" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
      />
      <path 
        d="M 16 62 L 68 62 A 62 62 0 0 0 68 -62 L 16 -62" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="38" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
      />
      <line 
        x1="-44" 
        y1="0" 
        x2="44" 
        y2="0" 
        stroke="#FFFFFF" 
        stroke-width="38" 
        stroke-linecap="round" 
      />
    </g>
  </svg>`;

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved pwa-maskable-512x512.png');
}

generateAll().catch(console.error);
