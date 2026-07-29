import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';

const PORT = Number(process.env.OVERPICK_VERIFY_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 45000;
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 900 },
  { name: 'desktop', width: 1440, height: 1000 },
];

const ROUTES = [
  { path: '/', expectedText: ['Сион открывает мету Season 3', 'ЛУЧШИЙ ТАНК', '2 ЛУЧШИХ DPS'] },
  { path: '/heroes', expectedText: ['Все Герои', 'Королева Хлама', 'B тир', 'Сион'] },
  { path: '/meta', expectedText: ['Текущая Мета', 'Королева Хлама', 'Сион'] },
  { path: '/patches', expectedText: ['История Патчей', 'Найдено:'] },
  { path: '/hero/junkerqueen', expectedText: ['Королева Хлама', 'Кто контрит Королева Хлама'] },
  { path: '/hero/shion', expectedText: ['Сион', 'Кто контрит Сион'] },
];

const liveMeta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'meta.json'), 'utf8'));
const liveTierTextByRoute = Object.fromEntries(
  ['/hero/junkerqueen', '/hero/shion'].map((routePath) => {
    const heroId = routePath.split('/').at(-1);
    const hero = liveMeta.heroes.find((entry) => entry.heroId === heroId);
    return [routePath, hero ? `${hero.tier} тир` : null];
  }),
);

function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

async function verifyRoute(page, route, viewportName) {
  const response = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
  if (!response?.ok()) {
    throw new Error(`${route.path} returned ${response?.status() ?? 'no response'} on ${viewportName}`);
  }

  const text = await page.locator('body').innerText();
  for (const expected of route.expectedText) {
    if (!text.includes(expected)) {
      throw new Error(`${route.path} is missing expected text on ${viewportName}: ${expected}`);
    }
  }

  const expectedLiveTier = liveTierTextByRoute[route.path];
  if (expectedLiveTier && !text.includes(expectedLiveTier)) {
    throw new Error(`${route.path} is missing current meta tier on ${viewportName}: ${expectedLiveTier}`);
  }

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  if (hasHorizontalOverflow) {
    throw new Error(`${route.path} has horizontal overflow on ${viewportName}`);
  }
}

async function verifyOptimizedImages(page, viewportName) {
  await page.goto(`${BASE_URL}/heroes`, { waitUntil: 'networkidle' });

  const imageStats = await page.evaluate(() => {
    const images = [...document.querySelectorAll('img')];
    return {
      total: images.length,
      optimized: images.filter((image) => image.currentSrc.includes('/_next/image')).length,
      broken: images.filter((image) => image.naturalWidth === 0 || image.naturalHeight === 0).length,
    };
  });

  if (imageStats.total === 0) {
    throw new Error(`No hero images rendered on /heroes on ${viewportName}`);
  }
  if (imageStats.optimized === 0) {
    throw new Error(`No optimized next/image URLs rendered on /heroes on ${viewportName}`);
  }
  if (imageStats.broken > 0) {
    throw new Error(`${imageStats.broken} hero images are broken on /heroes on ${viewportName}`);
  }
}

async function main() {
  const nextCli = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const server = spawn(process.execPath, [nextCli, 'start', '-p', String(PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      OVERPICK_ALLOW_LOCAL_IMAGE_IP: process.env.OVERPICK_ALLOW_LOCAL_IMAGE_IP || '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/`, START_TIMEOUT_MS);

    const browserErrors = [];
    const browser = await chromium.launch({ headless: true });

    try {
      for (const viewport of VIEWPORTS) {
        const { name: viewportName, ...viewportSize } = viewport;
        const page = await browser.newPage({ viewport: viewportSize });

        page.on('console', (message) => {
          if (message.type() === 'error') {
            browserErrors.push(`[${viewportName}] ${message.text()}`);
          }
        });
        page.on('pageerror', (error) => {
          browserErrors.push(`[${viewportName}] ${error.message}`);
        });

        for (const route of ROUTES) {
          await verifyRoute(page, route, viewportName);
        }
        await verifyOptimizedImages(page, viewportName);
        await page.close();
      }
    } finally {
      await browser.close();
    }

    if (browserErrors.length > 0) {
      throw new Error(`Browser errors:\n${browserErrors.join('\n')}`);
    }

    console.log(`Built site verification passed at ${BASE_URL}.`);
  } catch (error) {
    console.error(serverOutput);
    throw error;
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
