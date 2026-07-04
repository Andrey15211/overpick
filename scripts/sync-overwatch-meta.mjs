import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const META_PATH = path.join(ROOT, 'src', 'data', 'meta.json');
const HEROES_PATH = path.join(ROOT, 'src', 'data', 'heroes.json');
const BLIZZARD_RATES_URL =
  'https://overwatch.blizzard.com/en-us/rates/?input=PC&map=all-maps&region=Europe&role=All&rq=0&tier=All';

const ROLE_LABELS_RU = {
  Tank: 'танка',
  Damage: 'DPS',
  Support: 'саппорта',
};

function fetchText(url) {
  return fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  });
}

function parseRates(html) {
  const match = html.match(/allrows="([^"]*)"/);
  if (!match) {
    throw new Error('Could not locate Blizzard Hero Statistics rows in HTML');
  }
  return JSON.parse(match[1].replace(/&quot;/g, '"'));
}

function normalizeDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function round1(value) {
  return Number(value.toFixed(1));
}

async function main() {
  const [metaRaw, heroesRaw, ratesHtml] = await Promise.all([
    fs.readFile(META_PATH, 'utf8'),
    fs.readFile(HEROES_PATH, 'utf8'),
    fetchText(BLIZZARD_RATES_URL),
  ]);

  const meta = JSON.parse(metaRaw);
  const heroes = JSON.parse(heroesRaw);
  const rates = parseRates(ratesHtml);
  const heroById = new Map(rates.map((row) => [row.id, row]));
  const heroNameById = new Map(heroes.map((hero) => [hero.id, hero.nameRu]));
  const heroRoleById = new Map(heroes.map((hero) => [hero.id, hero.role]));
  const today = normalizeDate(new Date());

  meta.lastUpdated = today;
  meta.sources = [
    `Blizzard Hero Statistics: PC, Europe, live Hero Stats page crawled on ${today}`,
    `Overwatch live patch notes reviewed on ${today}`,
    ...meta.sources.filter(
      (source) =>
        !source.startsWith('Blizzard Hero Statistics:') &&
        !source.startsWith('Overwatch live patch notes reviewed on '),
    ),
  ];
  meta.metaDescription =
    `Тир-лист обновлён под актуальный публичный срез Blizzard Hero Statistics для PC (Europe) на ${today}. ` +
    'В основе лежат свежие win rate и pick rate по всем героям с учётом текущего патча Season 3.';

  meta.heroes = meta.heroes.map((hero) => {
    const row = heroById.get(hero.heroId);
    if (!row) return hero;
    const winRate = round1(Number(row.cells.winrate));
    const pickRate = round1(Number(row.cells.pickrate));
    const nameRu = heroNameById.get(hero.heroId) || hero.heroId;
    const role = heroRoleById.get(hero.heroId) || 'Damage';
    return {
      ...hero,
      winRate,
      pickRate,
      whyMeta: `${nameRu} по текущему срезу Blizzard выглядит как ${hero.tier}-тир ${ROLE_LABELS_RU[role] || role}: ${winRate}% win rate и ${pickRate}% pick rate.`,
    };
  });

  await fs.writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Synced ${meta.heroes.length} heroes for ${today}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
