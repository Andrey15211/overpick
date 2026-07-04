import { chromium } from 'playwright';

const BLIZZARD_RATES_URL =
  'https://overwatch.blizzard.com/en-us/rates/?input=PC&map=all-maps&region=Europe&role=All&rq=0&tier=All';

function getPatchNoteUrls() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  return [
    `https://overwatch.blizzard.com/en-us/news/patch-notes/live/${year}/${month}/`,
    `https://overwatch.blizzard.com/en-us/news/patch-notes/live/${previousYear}/${previousMonth}/`,
  ];
}

async function verifyRates(page) {
  await page.goto(BLIZZARD_RATES_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('blz-data-table').waitFor({ state: 'visible', timeout: 30000 });

  const text = await page.locator('main').innerText();
  if (!text.includes('HERO STATISTICS')) {
    throw new Error('Hero statistics heading is missing from the live Blizzard rates page');
  }
  if (!text.includes('WIN RATE') || !text.includes('PICK RATE')) {
    throw new Error('Hero statistics columns are missing from the live Blizzard rates page');
  }
}

async function verifyPatchNotes(page) {
  for (const url of getPatchNoteUrls()) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const titles = await page.locator('.PatchNotes-patchTitle').allTextContents();
    if (titles.length === 0) {
      continue;
    }

    const text = await page.locator('main').innerText();
    if (!text.includes('PATCH NOTES')) {
      throw new Error(`Patch notes shell is missing on ${url}`);
    }

    return;
  }

  throw new Error('No live Blizzard patch notes page with content could be found');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await verifyRates(page);
    await verifyPatchNotes(page);
    console.log('Browser verification passed.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
