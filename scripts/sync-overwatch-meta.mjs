import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const META_PATH = path.join(ROOT, 'src', 'data', 'meta.json');
const HEROES_PATH = path.join(ROOT, 'src', 'data', 'heroes.json');
const PATCHES_PATH = path.join(ROOT, 'src', 'data', 'patches.json');
const META_FILTERS_PATH = path.join(ROOT, 'src', 'data', 'metaFilters.ts');
const BLIZZARD_RATES_URL =
  'https://overwatch.blizzard.com/en-us/rates/?input=PC&map=all-maps&region=Europe&role=All&rq=0&tier=All';

const ROLE_LABELS_RU = {
  Tank: 'танка',
  Damage: 'DPS',
  Support: 'саппорта',
};

const HERO_NAME_RU_OVERRIDES = {
  Shion: 'Шион',
};

const TIER_RANK = {
  D: 0,
  C: 1,
  B: 2,
  A: 3,
  S: 4,
};

const RANK_TIER = ['D', 'C', 'B', 'A', 'S'];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

async function fetchText(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timed out fetching ${url} after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRates(html) {
  const match = html.match(/allrows="([^"]*)"/);
  if (!match) {
    throw new Error('Could not locate Blizzard Hero Statistics rows in HTML');
  }
  return JSON.parse(match[1].replace(/&quot;/g, '"'));
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#39;', "'");
}

function stripHtml(html) {
  return decodeHtmlEntities(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function extractListItems(html) {
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((match) => stripHtml(match[1]));
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildHeroNameMap(heroes) {
  const map = new Map();
  for (const hero of heroes) {
    map.set(normalizeName(hero.name), hero.id);
  }
  return map;
}

function parseIsoDate(dateText) {
  const match = dateText.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  if (!match) {
    return null;
  }

  const monthIndex = MONTH_NAMES_EN.indexOf(match[1]);
  if (monthIndex === -1) {
    return null;
  }

  return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}

function formatHotfixTitle(dateIso) {
  const [, month, day] = dateIso.split('-');
  const monthLabel = MONTH_NAMES_EN[Number(month) - 1] || 'July';
  return `🔥 Overwatch Season 3 - Hotfix ${monthLabel} ${Number(day)}`;
}

function translateHeroName(name) {
  return HERO_NAME_RU_OVERRIDES[name] || name;
}

function translateSectionTitle(title) {
  if (title === 'Hotfix Update') return 'Горячий фикс';
  if (title === 'Bug Fixes') return 'Исправления';
  if (title === 'Community Crafted Event') return 'Событие Community Crafted';
  return title;
}

function translateSummary(sectionTitle, text) {
  if (/This is a hot(?:fi|if)x update/i.test(text)) {
    return 'Горячий фикс без изменений баланса. Реплей-коды от патча 30 июня по-прежнему доступны.';
  }

  if (sectionTitle === 'Hotfix Update') {
    return stripHtml(text);
  }

  return stripHtml(text);
}

function translateChange(sectionTitle, text) {
  if (sectionTitle === 'Community Crafted Event') {
    if (text.includes('Streamer Luck')) {
      return 'Требование испытания "Streamer Luck" (победа на разных героях в Community Crafted) снижено с 20 до 3.';
    }
    if (text.includes('Chat, Are We Cooked?')) {
      return 'Требование мета-испытания "Chat, Are We Cooked?" снижено с 14 до 13 выполнений.';
    }
    if (text.includes('Clickbait Mitigation')) {
      return 'Требование по поглощению урона в испытании "Clickbait Mitigation" снижено с 15 000 до 5 000.';
    }
  }

  if (sectionTitle === 'Bug Fixes' && text.includes('Shion') && text.includes('Execution')) {
    return 'Исправлена ошибка, из-за которой Шион не могла использовать Execution во время перезарядки.';
  }

  return stripHtml(text);
}

function classifyChangeType(text, hasHeroId, sectionTitle) {
  if (!hasHeroId || sectionTitle === 'Hotfix Update' || sectionTitle === 'Community Crafted Event') {
    return 'system';
  }

  const normalized = text.toLowerCase();
  if (normalized.includes('reworked') || normalized.includes('rework') || normalized.includes('moved from')) {
    return 'rework';
  }
  if (normalized.includes('decreased') || normalized.includes('reduced') || normalized.includes('removed') || normalized.includes('lowered')) {
    return 'nerf';
  }
  if (normalized.includes('increased') || normalized.includes('added') || normalized.includes('buffed') || normalized.includes('granted')) {
    return 'buff';
  }
  return 'system';
}

function getLivePatchNoteUrls() {
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

async function fetchLivePatchNotesHtml() {
  for (const url of getLivePatchNoteUrls()) {
    const html = await fetchText(url);
    if (html.includes('PatchNotes-patchTitle')) {
      return { html, url };
    }
  }

  throw new Error('Could not locate live Blizzard patch notes page');
}

function parsePatchBlocks(html) {
  const starts = [...html.matchAll(/<div class="PatchNotes-patch PatchNotes-live">/g)]
    .map((match) => match.index)
    .filter((value) => value !== undefined);
  const blocks = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = index + 1 < starts.length ? starts[index + 1] : html.indexOf('<div class="PatchNotesTop">', start);
    blocks.push(html.slice(start, end === -1 ? html.length : end));
  }

  return blocks;
}

function parsePatchChanges(sectionHtml, sectionTitle, heroNameById) {
  const changes = [];
  const heroName = sectionHtml.match(/<h5 class="PatchNotesHeroUpdate-name">([^<]+)<\/h5>/)?.[1];
  const heroId = heroName ? heroNameById.get(normalizeName(heroName)) : undefined;
  const abilityMatches = [...sectionHtml.matchAll(/<div class="PatchNotesAbilityUpdate-name">([^<]+)<\/div>[\s\S]*?<div class="PatchNotesAbilityUpdate-detailList">([\s\S]*?)<\/div>/g)];

  if (sectionTitle === 'Hotfix Update') {
    return changes;
  }

  if (sectionTitle === 'Community Crafted Event') {
    const listItems = extractListItems(sectionHtml);
    for (const item of listItems) {
      changes.push({
        type: 'system',
        ability: translateSectionTitle(sectionTitle),
        description: translateChange(sectionTitle, item),
      });
    }
    return changes;
  }

  if (sectionTitle === 'Bug Fixes' && heroName && abilityMatches.length > 0) {
    for (const abilityMatch of abilityMatches) {
      const abilityName = abilityMatch[1];
      const detailText = translateChange(sectionTitle, stripHtml(abilityMatch[2]));
      changes.push({
        ...(heroId ? { heroId } : {}),
        type: classifyChangeType(detailText, Boolean(heroId), sectionTitle),
        ability: heroId ? abilityName : `${translateHeroName(heroName)} / ${abilityName}`,
        description: detailText,
      });
    }
    return changes;
  }

  const sectionText = stripHtml(sectionHtml);
  if (sectionText) {
    changes.push({
      type: 'system',
      ability: translateSectionTitle(sectionTitle),
      description: translateChange(sectionTitle, sectionText),
    });
  }

  return changes;
}

function parseLivePatches(html, heroNameById) {
  const blocks = parsePatchBlocks(html);
  const patches = [];

  for (const block of blocks) {
    const dateText = block.match(/<div class="PatchNotes-date">([^<]+)<\/div>/)?.[1];
    if (!dateText) continue;

    const dateIso = parseIsoDate(dateText);
    if (!dateIso) continue;

    const sections = [...block.matchAll(/<div class="PatchNotes-section PatchNotes-section-([^"]+)">/g)]
      .map((match) => ({ index: match.index ?? 0, kind: match[1] }))
      .sort((left, right) => left.index - right.index);

    let summary = '';
    const changes = [];

    for (let index = 0; index < sections.length; index += 1) {
      const sectionStart = sections[index].index;
      const sectionEnd = index + 1 < sections.length ? sections[index + 1].index : block.length;
      const sectionHtml = block.slice(sectionStart, sectionEnd);
      const sectionTitle = sectionHtml.match(/<h4 class="PatchNotes-sectionTitle">([^<]+)<\/h4>/)?.[1] || '';
      const descriptionHtml = sectionHtml.match(/<div class="PatchNotes-sectionDescription">([\s\S]*?)<\/div>/)?.[1] || '';
      const descriptionText = stripHtml(descriptionHtml);

      if (!summary && sectionTitle === 'Hotfix Update') {
        summary = translateSummary(sectionTitle, descriptionText);
      }

      changes.push(...parsePatchChanges(sectionHtml, sectionTitle, heroNameById));
    }

    patches.push({
      patchId: `ow-s3-hotfix-${dateIso}`,
      date: dateIso,
      version: '3.0',
      title: formatHotfixTitle(dateIso),
      summary: summary || `Обновление, синхронизированное с Blizzard на ${dateIso}.`,
      changes,
    });
  }

  return patches;
}

function normalizeDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateRu(date) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const year = parts.find((part) => part.type === 'year')?.value || '';
  return `${day} ${month} ${year}`.trim();
}

function round1(value) {
  return Number(value.toFixed(1));
}

function parseMetaSignals(source) {
  const start = source.indexOf('export const HERO_META_SIGNALS');
  const end = source.indexOf('};', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not locate HERO_META_SIGNALS in src/data/metaFilters.ts');
  }

  const block = source.slice(start, end);
  const signals = new Map();
  const signalPattern = /^\s*([a-z0-9]+):\s*\{[^}]*expertTier:\s*'([SABCD])'[^}]*proSignal:\s*([0-3])/gm;

  for (const match of block.matchAll(signalPattern)) {
    signals.set(match[1], {
      expertTier: match[2],
      proSignal: Number(match[3]),
    });
  }

  return signals;
}

function statisticalTierFromRates(winRate, pickRate) {
  if (winRate >= 54.5 && pickRate >= 1.5) return 'S';
  if (winRate >= 51 && pickRate >= 3) return 'A';
  if (winRate >= 48.5) return 'B';
  if (winRate >= 46.5) return 'C';
  return 'D';
}

function deriveTier({ winRate, pickRate, currentTier, signal }) {
  const statTier = statisticalTierFromRates(winRate, pickRate);

  if (!signal) {
    return statTier || currentTier;
  }

  const statRank = TIER_RANK[statTier];
  const expertRank = TIER_RANK[signal.expertTier];

  if (statTier === 'S') {
    return 'S';
  }

  if (expertRank <= TIER_RANK.B && statRank > expertRank && signal.proSignal <= 1 && pickRate < 8) {
    return signal.expertTier;
  }

  if (expertRank >= TIER_RANK.A && statRank < expertRank && winRate >= 50 && signal.proSignal >= 1) {
    return RANK_TIER[Math.min(TIER_RANK.A, statRank + 1)];
  }

  if (expertRank === TIER_RANK.S && winRate < 47) {
    return statTier;
  }

  return statTier || currentTier;
}

async function main() {
  const [metaRaw, heroesRaw, patchesRaw, signalSource, ratesHtml] = await Promise.all([
    fs.readFile(META_PATH, 'utf8'),
    fs.readFile(HEROES_PATH, 'utf8'),
    fs.readFile(PATCHES_PATH, 'utf8'),
    fs.readFile(META_FILTERS_PATH, 'utf8'),
    fetchText(BLIZZARD_RATES_URL),
  ]);

  const meta = JSON.parse(metaRaw);
  const heroes = JSON.parse(heroesRaw);
  const patches = JSON.parse(patchesRaw);
  const rates = parseRates(ratesHtml);
  const metaSignals = parseMetaSignals(signalSource);
  const heroById = new Map(rates.map((row) => [row.id, row]));
  const heroNameById = new Map(heroes.map((hero) => [hero.id, hero.nameRu]));
  const heroRoleById = new Map(heroes.map((hero) => [hero.id, hero.role]));
  const today = normalizeDate(new Date());
  const livePatchResponse = await fetchLivePatchNotesHtml();
  const livePatches = parseLivePatches(livePatchResponse.html, buildHeroNameMap(heroes));
  const livePatchIds = new Set(livePatches.map((patch) => patch.patchId));
  const existingPatches = patches.filter((patch) => !livePatchIds.has(patch.patchId));

  meta.lastUpdated = today;
  meta.sources = [
    `Blizzard Hero Statistics: PC, Europe, live Hero Stats page crawled on ${formatDateRu(new Date())}`,
    ...livePatches.map((patch) => patch.title),
    ...meta.sources.filter(
      (source) =>
        !source.startsWith('Blizzard Hero Statistics:') &&
        !source.startsWith('Overwatch Retail Patch Notes') &&
        !source.startsWith('Overwatch live patch notes reviewed on '),
    ),
  ].filter((source, index, all) => all.indexOf(source) === index);
  meta.metaDescription =
    `Тир-лист обновлён под актуальный публичный срез Blizzard Hero Statistics для PC (Europe) на ${formatDateRu(new Date())} года. ` +
    'В основе лежат свежие win rate и pick rate по всем героям с учётом текущего патча Season 3.';

  meta.heroes = meta.heroes.map((hero) => {
    const row = heroById.get(hero.heroId);
    if (!row) return hero;
    const winRate = round1(Number(row.cells.winrate));
    const pickRate = round1(Number(row.cells.pickrate));
    const nameRu = heroNameById.get(hero.heroId) || hero.heroId;
    const role = heroRoleById.get(hero.heroId) || 'Damage';
    const tier = deriveTier({
      winRate,
      pickRate,
      currentTier: hero.tier,
      signal: metaSignals.get(hero.heroId),
    });

    return {
      ...hero,
      tier,
      winRate,
      pickRate,
      whyMeta: `${nameRu} по текущему срезу Blizzard выглядит как ${tier}-тир ${ROLE_LABELS_RU[role] || role}: ${winRate}% win rate и ${pickRate}% pick rate.`,
    };
  });

  await fs.writeFile(PATCHES_PATH, `${JSON.stringify([...livePatches, ...existingPatches], null, 2)}\n`);
  await fs.writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Synced ${meta.heroes.length} heroes and ${livePatches.length} live patches for ${today}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
