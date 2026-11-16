import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('e:/Virtual Campus FPT Poly/apps/web/node_modules/@playwright/test');

const stage = process.argv[2] || 'before'; // 'before' or 'after'
const outDir = path.join(process.cwd(), 'docs', 'ui-redesign', 'reports', 'screenshots', `${stage}-c1`);
fs.mkdirSync(outDir, { recursive: true });

const ROUTES = [
  { name: 'homepage', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'admin', path: '/admin' },
  { name: 'portal', path: '/portal' },
];

async function capture() {
  console.log(`Capturing ${stage.toUpperCase()} screenshots for Phase C1...`);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  for (const r of ROUTES) {
    const url = `http://localhost:3000${r.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      const filePath = path.join(outDir, `${r.name}-${stage}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      const stat = fs.statSync(filePath);
      console.log(`✓ Saved ${r.name}-${stage}.png (${(stat.size / 1024).toFixed(1)} KB) from ${url}`);
    } catch (e) {
      console.error(`✗ Error on ${url}:`, e.message);
    }
  }

  await browser.close();
  console.log(`Completed ${stage.toUpperCase()} screenshots!`);
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
