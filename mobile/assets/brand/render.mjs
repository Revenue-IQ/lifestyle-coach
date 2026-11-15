/**
 * Renders the icon files from mark.svg: app icon, favicon, splash icon and the
 * Android adaptive icon layers, plus a lockup PNG for the README. Uses the
 * Playwright install in docs/demo (the demo video needs it anyway), so run
 * `npm install` there first. Run from the repo root:
 *   node mobile/assets/brand/render.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const ASSETS = path.resolve(HERE, '..');
const { chromium } = createRequire(path.join(REPO, 'docs/demo/package.json'))('playwright');

const PAPER = '#FBF8F3';
const INK = '#1F2933';
const markSvg = readFileSync(path.join(HERE, 'mark.svg'), 'utf8').replace(/<!--[\s\S]*?-->\s*/, '');
const font = readFileSync(path.join(REPO, 'node_modules/@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf')).toString('base64');

/** The mark at `scale` of the canvas, centred, over `bg` (or transparent). */
function markPage(size, scale, bg, color) {
  const svg = color ? markSvg.replace(/#2F855A/g, color) : markSvg;
  const m = Math.round(size * scale);
  return `<html><body style="margin:0;width:${size}px;height:${size}px;background:${bg ?? 'transparent'};display:flex;align-items:center;justify-content:center">
    <div style="width:${m}px;height:${m}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`;
}

/** Mark and name on paper, for the README. */
function lockupPage(width, height) {
  const m = Math.round(height * 0.62);
  return `<html><head><style>@font-face{font-family:Geist;font-weight:600;src:url(data:font/ttf;base64,${font}) format('truetype')}</style></head>
  <body style="margin:0;width:${width}px;height:${height}px;background:${PAPER};display:flex;align-items:center;justify-content:center;font-family:Geist,sans-serif;color:${INK}">
    <div style="width:${m}px;height:${m}px">${markSvg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    <div style="font-size:${Math.round(height * 0.34)}px;font-weight:600;margin-left:${Math.round(height * 0.1)}px;letter-spacing:-0.01em">Inner Weather</div>
  </body></html>`;
}

const jobs = [
  // iOS/app icon: paper background, no transparency (Apple masks the corners itself).
  { file: 'icon.png', size: 1024, html: markPage(1024, 0.72, PAPER) },
  // Web favicon: the mark alone, transparent, so it sits well on a light or dark tab bar.
  { file: 'favicon.png', size: 64, html: markPage(64, 1, null) },
  { file: 'splash-icon.png', size: 512, html: markPage(512, 0.8, null) },
  // Android adaptive: the foreground must keep to the centre 66% safe zone.
  { file: 'android-icon-foreground.png', size: 1024, html: markPage(1024, 0.5, null) },
  { file: 'android-icon-background.png', size: 1024, html: markPage(1024, 0, PAPER) },
  { file: 'android-icon-monochrome.png', size: 1024, html: markPage(1024, 0.5, null, '#FFFFFF') },
  { file: 'brand/lockup.png', size: null, width: 1200, height: 320, html: lockupPage(1200, 320) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const j of jobs) {
  const width = j.width ?? j.size;
  const height = j.height ?? j.size;
  await page.setViewportSize({ width, height });
  await page.setContent(j.html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } });
  writeFileSync(path.join(ASSETS, j.file), png);
  console.log(`wrote mobile/assets/${j.file} (${width}x${height})`);
}
await browser.close();
