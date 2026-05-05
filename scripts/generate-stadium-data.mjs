import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZHZldG9mYnNveW5rZnBybG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Mjc0NDEsImV4cCI6MjA2MTMwMzQ0MX0.Moy2MzlEQ0w1cqvnMs3qAV6Mzdm8R1v_YSo7Zw93mG8';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'stadium.json');
const HEROES_PATH = path.join(ROOT, 'src', 'data', 'heroes.json');
const CACHE_DIR = path.join(ROOT, '.next', 'cache');
const TRANSLATION_CACHE_PATH = path.join(CACHE_DIR, 'stadium-translation-cache.json');

const STADIUM_HERO_IDS = [
  'dva',
  'doomfist',
  'hazard',
  'junkerqueen',
  'orisa',
  'reinhardt',
  'sigma',
  'winston',
  'zarya',
  'ashe',
  'cassidy',
  'freja',
  'genji',
  'junkrat',
  'mei',
  'pharah',
  'reaper',
  'sojourn',
  'soldier76',
  'torbjorn',
  'tracer',
  'vendetta',
  'ana',
  'brigitte',
  'juno',
  'kiriko',
  'lucio',
  'mercy',
  'moira',
  'wuyang',
  'zenyatta',
];

const FILTERED_HERO_IDS = process.env.STADIUM_HERO_FILTER
  ? process.env.STADIUM_HERO_FILTER.split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  : STADIUM_HERO_IDS;

const SUPABASE_HEADERS = {
  authorization: `Bearer ${API_KEY}`,
  apikey: API_KEY,
  'content-profile': 'public',
  'content-type': 'application/json',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
};

const FETCH_HEADERS = {
  'user-agent': SUPABASE_HEADERS['user-agent'],
  accept: 'application/json,text/plain,*/*',
};

const MODE_LABELS = {
  competitive: '7 раундов',
  quick_play: '5 раундов',
};

const MODE_ROUND_COUNT = {
  competitive: 7,
  quick_play: 5,
};

const STAT_LABELS_RU = {
  LIFE: 'Здоровье',
  'Total LIFE': 'Общее здоровье',
  Armor: 'Броня',
  Shield: 'Щит',
  'Weapon Power': 'Сила оружия',
  'Ability Power': 'Сила способностей',
  'Attack Speed': 'Скорость атаки',
  'Move Speed': 'Скорость передвижения',
  'Cooldown Reduction': 'Сокращение восстановления',
  'Weapon Lifesteal': 'Похищение здоровья оружием',
  'Ability Lifesteal': 'Похищение здоровья способностями',
  'Critical Damage': 'Критический урон',
  'Melee Damage': 'Урон в ближнем бою',
  'Reload Speed': 'Скорость перезарядки',
  'Max Ammo': 'Боезапас',
};

const HERO_NAME_RU = {
  'D.Va': 'Дива',
  Doomfist: 'Кулак Смерти',
  Hazard: 'Хазард',
  'Junker Queen': 'Королева Хлама',
  Orisa: 'Ориса',
  Reinhardt: 'Райнхардт',
  Sigma: 'Сигма',
  Winston: 'Уинстон',
  Zarya: 'Заря',
  Ashe: 'Эш',
  Cassidy: 'Кэссиди',
  Freja: 'Фрея',
  Genji: 'Гэндзи',
  Junkrat: 'Крысавчик',
  Mei: 'Мэй',
  Pharah: 'Фарра',
  Reaper: 'Жнец',
  Sojourn: 'Соджорн',
  'Soldier: 76': 'Солдат-76',
  Torbjörn: 'Торбьорн',
  Torbjorn: 'Торбьорн',
  Tracer: 'Трейсер',
  Vendetta: 'Вендетта',
  Ana: 'Ана',
  Brigitte: 'Бригитта',
  Juno: 'Джуно',
  Kiriko: 'Кирико',
  Lúcio: 'Лусио',
  Lucio: 'Лусио',
  Mercy: 'Ангел',
  Moira: 'Мойра',
  Wuyang: 'Вуянг',
  Zenyatta: 'Дзенъятта',
};

const REPLACEMENTS = [
  ['Quick Play', 'Быстрая игра'],
  ['Competitive', 'Соревновательная игра'],
  ['Weapon Power', 'сила оружия'],
  ['Ability Power', 'сила способностей'],
  ['Attack Speed', 'скорость атаки'],
  ['Move Speed', 'скорость передвижения'],
  ['Cooldown Reduction', 'сокращение восстановления'],
  ['Weapon Lifesteal', 'похищение здоровья оружием'],
  ['Ability Lifesteal', 'похищение здоровья способностями'],
  ['Critical Damage', 'критический урон'],
  ['Overhealth', 'дополнительное здоровье'],
  ['Damage Reduction', 'снижение урона'],
  ['Total Health', 'общее здоровье'],
  ['Health', 'здоровье'],
  ['Armor', 'броня'],
  ['Shield', 'щит'],
  ['Life', 'здоровье'],
  ['Strong Against', 'Сильно против'],
  ['Weak Against', 'Слабо против'],
  ['Round Notes', 'Заметки к раунду'],
  ['Powers', 'Силы'],
  ['Items', 'Предметы'],
  ['Optional Items', 'Дополнительные предметы'],
  ['Optional Powers', 'Дополнительные силы'],
  ['Forge Code', 'Код сборки'],
  ['Last updated', 'Обновлено'],
  ['Views', 'Просмотры'],
  ['Likes', 'Оценки'],
  ['Comments', 'Комментарии'],
];

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanText(value) {
  return value
    ?.replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim() ?? '';
}

function formatViews(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  }

  return String(value);
}

function ageDays(value) {
  return (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24);
}

function recencyScore(value) {
  const days = ageDays(value);

  if (days <= 3) return 1.2;
  if (days <= 7) return 1;
  if (days <= 14) return 0.8;
  if (days <= 30) return 0.55;
  if (days <= 45) return 0.35;
  if (days <= 60) return 0.15;

  return 0;
}

function buildScore(build) {
  const views = build.view_count || 0;
  const likes = build.like_count || 0;

  return (
    (build.hotness_score || 0) * 4 +
    Math.log10(views + 10) * 1.5 +
    Math.log2(likes + 1) * 1.25 +
    recencyScore(build.updated_at) +
    (build.build_tag === 'Meta' ? 0.75 : 0) +
    (build.has_any_notes ? 0.2 : 0)
  );
}

function powerNames(build) {
  return (build.final_round_powers || []).map((power) => power?.name).filter(Boolean);
}

function powerSignature(build) {
  return powerNames(build).slice(0, 3).join('|');
}

function pickDistinctBuilds(candidates, count) {
  const filtered = candidates
    .filter((build) => ageDays(build.updated_at) <= 200)
    .sort((a, b) => buildScore(b) - buildScore(a));
  const preferred = filtered.filter((build) => powerNames(build).length >= 2);
  const source = preferred.length >= count ? preferred : filtered;

  const picked = [];
  const usedSignatures = new Set();

  for (const build of source) {
    const signature = powerSignature(build) || build.id;
    if (usedSignatures.has(signature)) continue;

    picked.push(build);
    usedSignatures.add(signature);

    if (picked.length === count) {
      return picked;
    }
  }

  for (const build of source) {
    if (picked.some((entry) => entry.id === build.id)) continue;
    picked.push(build);
    if (picked.length === count) break;
  }

  return picked;
}

function hasCyrillic(value) {
  return /[А-Яа-яЁё]/.test(value);
}

function postProcessTranslation(value) {
  let result = cleanText(value);

  for (const [from, to] of REPLACEMENTS) {
    result = result.replaceAll(from, to);
  }

  for (const [from, to] of Object.entries(HERO_NAME_RU)) {
    result = result.replaceAll(from, to);
  }

  return cleanText(
    result
      .replaceAll('D.Va', 'Дива')
      .replaceAll('Face Tanking', 'Facetanking'),
  );
}

function normalizeBuildTitle(title) {
  return cleanText(
    title
      .replace(/^[\p{Extended_Pictographic}\s]+/gu, '')
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/\bQuick Play\b[:\s-]*/gi, '')
      .replace(/\b(?:5\s*ROUND|7\s*ROUND|BO5|BO7|QP|COMP)\b[:\s-]*/gi, '')
      .replace(/\[(?:LEGEND|UPDATED|GUIDE|S\d+|QP|COMP|T500|TOP ?500|ALL-STAR|HARD CARRY|DETAILED GUIDE)[^\]]*\]/gi, '')
      .replace(/\((?:Updated|Season|Legend|Guide|Top ?500|Quick Play|Comp|QP|BO5|BO7)[^)]*\)/gi, '')
      .replace(/\b(?:Legend|Guide To Win|Detailed Guide|Updated|Top ?500|Carry your team on|carry build)\b/gi, '')
      .replace(/[|]+/g, ' ')
      .replace(/[!]{2,}/g, '!')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  );
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function loadTranslationCache() {
  try {
    return JSON.parse(await fs.readFile(TRANSLATION_CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function saveTranslationCache(cache) {
  await ensureCacheDir();
  await fs.writeFile(TRANSLATION_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      ...FETCH_HEADERS,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  return response.json();
}

async function postSupabase(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: SUPABASE_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  return response.json();
}

async function getSupabase(url) {
  const response = await fetch(url, {
    headers: SUPABASE_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  return response.json();
}

async function fetchModeCandidates(heroId, mode) {
  return postSupabase(
    'https://qkdvetofbsoynkfprlos.supabase.co/rest/v1/rpc/filter_builds_public_v17',
    {
      p_hero_ids: [heroId],
      p_search_text: null,
      p_stat_names: null,
      p_sort_by: 'hotness',
      p_sort_direction: 'desc',
      p_offset: 0,
      p_limit: 40,
      p_filter_type: 'all',
      p_updated_after: null,
      p_item_ids: null,
      p_item_filter_mode: 'all',
      p_average_cost: null,
      p_matchup_hero_ids: null,
      p_mode: mode,
      p_build_code: null,
      p_show_only_with_notes: false,
    },
  );
}

async function getBuildApiDetail(id) {
  const baseUrl = `https://stadiumbuilds.io/api/builds/${id}?bust-cache=true`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const url = `${baseUrl}&t=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        ...FETCH_HEADERS,
        'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8',
        referer: `https://stadiumbuilds.io/build/${id}`,
        origin: 'https://stadiumbuilds.io',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429 || response.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }

    throw new Error(`${response.status} ${url}`);
  }

  throw new Error(`429 ${baseUrl}`);
}

async function getAllItems() {
  return postSupabase(
    'https://qkdvetofbsoynkfprlos.supabase.co/rest/v1/rpc/get_items_by_locale',
    { p_locale: 'ru' },
  );
}

function normalizedUrl(value) {
  return value?.split('?')[0] ?? '';
}

function buildItemsIndex(items, localizedItems) {
  const byUrl = new Map();
  const byName = new Map();
  const byId = new Map();

  for (const item of items) {
    const localizedEntry = localizedItems[item.id] || {};
    const merged = {
      ...item,
      localizedName: localizedEntry.name || item.name,
      localizedDescription: localizedEntry.description || item.description || '',
    };

    if (item.portrait_url) {
      byUrl.set(normalizedUrl(item.portrait_url), merged);
    }

    byName.set(normalizeName(item.name), merged);
    byId.set(item.id, merged);
  }

  return { byId, byUrl, byName };
}

async function translateText(text, cache) {
  const normalized = cleanText(text);

  if (!normalized) return '';
  if (hasCyrillic(normalized)) return postProcessTranslation(normalized);
  if (cache[normalized]) return cache[normalized];

  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(normalized)}`;
  let response;

  try {
    response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    cache[normalized] = postProcessTranslation(normalized);
    return cache[normalized];
  }

  if (!response.ok) {
    cache[normalized] = postProcessTranslation(normalized);
    return cache[normalized];
  }

  const payload = await response.json();
  const translated = cleanText((payload?.[0] || []).map((entry) => entry?.[0] || '').join(''));
  cache[normalized] = postProcessTranslation(translated || normalized);
  return cache[normalized];
}

function computeStatImpact(slots) {
  const totals = new Map();

  for (const slot of slots) {
    if (!slot?.sourceItem?.stat_changes) continue;

    for (const [label, value] of Object.entries(slot.sourceItem.stat_changes)) {
      const numericValue = Number(value);
      if (!numericValue) continue;
      totals.set(label, (totals.get(label) || 0) + numericValue);
    }
  }

  return Array.from(totals.entries())
    .slice(0, 6)
    .map(([label, value]) => ({
      label: STAT_LABELS_RU[label] || postProcessTranslation(label),
      value: Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`,
      iconAlt: label,
      iconUrl: null,
    }));
}

function stripSourceItem(value) {
  const slot = { ...value };
  delete slot.sourceItem;
  return slot;
}

async function mapSlot(item, slotType, itemsIndex, translationCache, badge = null) {
  if (!item?.portrait_url) {
    return null;
  }

  const sourceItem =
    itemsIndex.byId.get(item.id) ||
    itemsIndex.byUrl.get(normalizedUrl(item.portrait_url)) ||
    itemsIndex.byName.get(normalizeName(item.name));
  const localizedName = sourceItem?.localizedName || item.name;
  const localizedDescription = sourceItem?.localizedDescription || sourceItem?.description || '';

  return {
    id: sourceItem?.id || item.id,
    nameEn: item.name,
    nameRu: hasCyrillic(localizedName)
      ? postProcessTranslation(localizedName)
      : await translateText(localizedName || item.name, translationCache),
    iconUrl: item.portrait_url,
    slotType,
    descriptionRu: localizedDescription
      ? (hasCyrillic(localizedDescription)
        ? postProcessTranslation(localizedDescription)
        : '')
      : '',
    badge,
    sourceItem,
  };
}

async function translateParagraphs(paragraphs, translationCache) {
  return Promise.all(
    (paragraphs || []).map((paragraph) =>
      hasCyrillic(paragraph)
        ? Promise.resolve(postProcessTranslation(paragraph))
        : translateText(paragraph, translationCache),
    ),
  );
}

function stripNoteMarkup(value) {
  return cleanText(
    value
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\[color:[^\]]+\]|\[\/color\]/gi, '')
      .replace(/\[(.*?)\]\((?:item|stat)_[^)]+\)/g, '$1')
      .replace(/\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '$1')
      .replace(/^\|.*\|$/gm, '')
      .replace(/^\s*[-_]{3,}\s*$/gm, '')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/[>*`]/g, '')
      .replace(/\|/g, ' ')
      .replace(/\n+/g, ' '),
  );
}

function extractNoteParagraphs(markdown) {
  return markdown
    .split(/\n{2,}/)
    .map(stripNoteMarkup)
    .filter(Boolean)
    .filter((entry) => !['Power Description', 'Item Description'].includes(entry))
    .slice(0, 3);
}

function splitRoundUpgrades(round) {
  const upgrades = round.round_upgrades || [];

  return {
    powers: upgrades
      .filter((entry) => entry.items && (entry.power_slot !== null || entry.items.rarity === 'power'))
      .sort((left, right) => (left.power_slot ?? 99) - (right.power_slot ?? 99)),
    purchases: upgrades
      .filter((entry) => entry.items && (entry.items.cost || 0) > 0 && entry.action === 'buy')
      .sort((left, right) => (left.purchase_order ?? 99) - (right.purchase_order ?? 99)),
    optionals: upgrades
      .filter((entry) => entry.items && (entry.items.cost || 0) > 0 && entry.action === 'optional')
      .sort((left, right) => (left.purchase_order ?? 99) - (right.purchase_order ?? 99)),
  };
}

function buildRoundNotes(round, roundSlots) {
  const notes = [];
  const powerNames = roundSlots.powerSlots.map((slot) => slot.nameRu);
  const itemNames = roundSlots.itemSlots.map((slot) => slot.nameRu);
  const flexNames = roundSlots.flexItems.map((slot) => slot.nameRu);
  const cleanParagraphs = (round.noteParagraphs || []).filter(
    (entry) => !/ability_|hero_|item_|stat_|\]\(|\[[A-Za-z]/.test(entry),
  );
  const powerDetails = (round.powerDetails || [])
    .filter((entry) => entry.name && entry.description)
    .map((entry) => `${entry.name}: ${entry.description}`);
  const itemDetails = (round.itemDetails || [])
    .filter((entry) => entry.name && entry.description)
    .map((entry) => `${entry.name}: ${entry.description}`);

  if (powerNames.length > 0) {
    notes.push(`Выбор силы: ${powerNames.join(', ')}.`);
  }

  if (itemNames.length > 0) {
    notes.push(`Покупки раунда: ${itemNames.join(', ')}.`);
  }

  if (flexNames.length > 0) {
    notes.push(`Дополнительные предметы под матчап: ${flexNames.join(', ')}.`);
  }

  if (powerDetails.length > 0) {
    notes.push(`Подсказки по силе: ${powerDetails.join(' ')}`);
  }

  if (itemDetails.length > 0) {
    notes.push(`Подсказки по предметам: ${itemDetails.join(' ')}`);
  }

  if (cleanParagraphs.length > 0) {
    notes.push(cleanParagraphs.join(' '));
  }

  return cleanText(notes.join(' ')) || 'Подробности для этого раунда в исходной сборке не указаны.';
}

function buildBuildSummary(candidate, localizedHeroName, coreNames) {
  const core = coreNames.slice(0, 2).join(' + ');
  if (candidate.build_tag === 'Meta') {
    return `${localizedHeroName}: метовая сборка через ${core || 'основной набор сил'}.`;
  }

  return `${localizedHeroName}: популярная сборка через ${core || 'основной набор сил'}.`;
}

function matchupsToNames(relations) {
  return unique(
    (relations || [])
      .map((entry) => entry.heroes?.name)
      .map((name) => HERO_NAME_RU[name] || name),
  );
}

function topNonEmptySlots(rounds, key) {
  const seen = new Map();

  for (const round of rounds) {
    for (const slot of round[key]) {
      seen.set(slot.id, slot);
    }
  }

  return Array.from(seen.values()).slice(0, key === 'powerSlots' ? 4 : 3);
}

function ensureModeBuilds(builds, expectedCount, heroId, mode) {
  if (builds.length !== expectedCount) {
    throw new Error(`${heroId} ${mode} has ${builds.length} builds instead of ${expectedCount}`);
  }
}

async function writeDataset(heroes) {
  const dataset = {
    seasonLabel: 'Сезон Stadium 17',
    lastUpdated: '2026-03-13',
    heroCount: heroes.length,
    overview:
      'Официальный пул Stadium от Blizzard и актуальные популярные сборки StadiumBuilds. Переключай режим 7 или 5 раундов и открывай подробную страницу каждой сборки.',
    rankingNote:
      'Сначала отбираются свежие public builds, затем ранжируются по hotness, просмотрам, лайкам и свежести обновления. При нехватке 5-раундовых сборок недостающие слоты добираются из общего пула и помечаются как fallback.',
    sources: [
      {
        name: 'Blizzard Stadium',
        url: 'https://overwatch.blizzard.com/en-us/stadium/',
        kind: 'официальный пул героев',
        updatedAt: '2026-03-13',
      },
      {
        name: 'StadiumBuilds.io',
        url: 'https://stadiumbuilds.io/browse',
        kind: 'популярные public builds',
        updatedAt: '2026-03-13',
      },
    ],
    heroes,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
}

function isNewStadiumSchema(dataset) {
  return Array.isArray(dataset?.heroes) && dataset.heroes.every((hero) => hero.heroIcon && hero.buildsByMode);
}

async function main() {
  console.log('Stadium generator started');
  const localHeroes = await readJson(HEROES_PATH);
  const translationCache = await loadTranslationCache();
  let existingDataset = null;
  try {
    existingDataset = await readJson(OUTPUT_PATH);
  } catch {}

  const [remoteHeroes, localizedItemsData, allItems] = await Promise.all([
    getSupabase(
      'https://qkdvetofbsoynkfprlos.supabase.co/rest/v1/heroes?select=id,name,role&enabled=eq.true&order=name.asc',
    ),
    fetchJson('https://stadiumbuilds.io/locales/ru/items.json'),
    getAllItems(),
  ]);

  const remoteHeroByName = new Map(
    remoteHeroes.map((hero) => [normalizeName(hero.name), hero]),
  );
  const itemsIndex = buildItemsIndex(allItems, localizedItemsData.items || {});

  const buildDetailCache = new Map();
  const outputHeroes = isNewStadiumSchema(existingDataset)
    ? existingDataset.heroes.filter((entry) => !FILTERED_HERO_IDS.includes(entry.heroId))
    : [];
  const problems = [];
  const completedHeroIds = new Set(outputHeroes.map((entry) => entry.heroId));

  for (const heroId of FILTERED_HERO_IDS) {
    if (completedHeroIds.has(heroId)) {
      continue;
    }

    console.log(`Processing hero ${heroId}`);

    const localHero = localHeroes.find((hero) => hero.id === heroId);
    if (!localHero) {
      problems.push(`Local hero missing: ${heroId}`);
      continue;
    }

    const remoteHero = remoteHeroByName.get(normalizeName(localHero.name));
    if (!remoteHero) {
      problems.push(`No remote hero match for ${heroId} (${localHero.name})`);
      continue;
    }

    const buildsByMode = {
      competitive: [],
      quick_play: [],
    };

    for (const mode of ['competitive', 'quick_play']) {
      console.log(`  Mode ${mode}`);
      const candidates = await fetchModeCandidates(remoteHero.id, mode);
      let picked = pickDistinctBuilds(candidates, 3);

      if (picked.length < 3) {
        const fallbackCandidates = await fetchModeCandidates(remoteHero.id, null);
        const fallbackPool = fallbackCandidates.filter(
          (build) => !picked.some((entry) => entry.id === build.id),
        );
        const supplemented = pickDistinctBuilds(fallbackPool, 3);
        picked = [
          ...picked,
          ...supplemented.filter((build) => !picked.some((entry) => entry.id === build.id)),
        ].slice(0, 3);
      }

      if (picked.length < 3) {
        problems.push(`${heroId} ${mode} only has ${picked.length} builds after fallback`);
        continue;
      }

      for (const candidate of picked) {
        console.log(`    Build ${candidate.id}`);
        let buildApi = buildDetailCache.get(candidate.id);
        if (!buildApi) {
          buildApi = await getBuildApiDetail(candidate.id);
          buildDetailCache.set(candidate.id, buildApi);
        }

        const buildRecord = buildApi.data.build;
        const fallback = candidate.mode !== mode;
        const rounds = [];
        const apiRounds = [...(buildApi.data.rounds || [])].sort(
          (left, right) => left.round_number - right.round_number,
        );
        const seenPowerIds = new Set();
        const seenItemIds = new Set();

        for (const round of apiRounds.slice(0, MODE_ROUND_COUNT[mode])) {
          const { powers, purchases, optionals } = splitRoundUpgrades(round);
          const powerSlots = [];
          const itemSlots = [];
          const flexItems = [];

          for (const entry of powers) {
            if (seenPowerIds.has(entry.items.id)) {
              continue;
            }

            const slot = await mapSlot(entry.items, 'power', itemsIndex, translationCache);
            if (slot) {
              powerSlots.push(slot);
              seenPowerIds.add(entry.items.id);
            }
          }

          for (const entry of purchases) {
            if (seenItemIds.has(entry.items.id)) {
              continue;
            }

            const slot = await mapSlot(entry.items, 'item', itemsIndex, translationCache);
            if (slot) {
              itemSlots.push(slot);
              seenItemIds.add(entry.items.id);
            }
          }

          for (const entry of optionals) {
            const slot = await mapSlot(entry.items, 'flex', itemsIndex, translationCache);
            if (slot) {
              flexItems.push(slot);
            }
          }

          const translatedParagraphs = await translateParagraphs(
            extractNoteParagraphs(round.notes || ''),
            translationCache,
          );
          const roundCost = itemSlots.reduce(
            (total, entry) => total + Number(entry.sourceItem?.cost || 0),
            0,
          );

          rounds.push({
            round: round.round_number,
            label: `Раунд ${round.round_number}`,
            roundCost: roundCost > 0 ? roundCost : null,
            roundNotes: buildRoundNotes(
              {
                powerDetails: [],
                itemDetails: [],
                noteParagraphs: translatedParagraphs,
              },
              {
                powerSlots,
                itemSlots,
                flexItems,
              },
            ),
            powerSlots: powerSlots.map(stripSourceItem),
            itemSlots: itemSlots.map(stripSourceItem),
            flexItems: flexItems.map(stripSourceItem),
            statsImpact: computeStatImpact([...powerSlots, ...itemSlots, ...flexItems]),
          });
        }

        while (rounds.length < MODE_ROUND_COUNT[mode]) {
          rounds.push({
            round: rounds.length + 1,
            label: `Раунд ${rounds.length + 1}`,
            roundCost: null,
            roundNotes: 'Подробности для этого раунда в исходной сборке не указаны.',
            powerSlots: [],
            itemSlots: [],
            flexItems: [],
            statsImpact: [],
          });
        }

        const corePowers = topNonEmptySlots(rounds, 'powerSlots');
        const coreItems = topNonEmptySlots(rounds, 'itemSlots');

        buildsByMode[mode].push({
          id: candidate.id,
          mode,
          sourceMode: candidate.mode,
          fallback,
          rawTitle: candidate.title,
          displayTitle: normalizeBuildTitle(candidate.title) || candidate.title,
          detailPath: `/stadium/${heroId}/${mode}/${candidate.id}`,
          summaryRu: buildBuildSummary(
            candidate,
            localHero.nameRu,
            corePowers.map((slot) => slot.nameRu),
          ),
          whenToPickRu: matchupsToNames(buildRecord.build_good_against || []).length > 0
            ? `Лучше всего заходит против ${matchupsToNames(buildRecord.build_good_against || []).slice(0, 3).join(', ')}.`
            : `Выбирай в ${MODE_LABELS[mode].toLowerCase()}, когда нужен стабильный метовый план и сильная экономика по раундам.`,
          heroNoteRu: fallback
            ? `Источник этой карточки взят из режима ${candidate.mode === 'competitive' ? '7 раундов' : '5 раундов'}, потому что для ${MODE_LABELS[mode].toLowerCase()} не хватило трёх популярных public builds.`
            : null,
          goodAgainst: matchupsToNames(buildRecord.build_good_against || []),
          weakAgainst: matchupsToNames(buildRecord.build_bad_against || []),
          synergiesWith: matchupsToNames(buildRecord.build_synergizes_with || []),
          buildCode: candidate.build_code || buildRecord.build_code || null,
          source: {
            name: 'StadiumBuilds.io',
            url: `https://stadiumbuilds.io/build/${candidate.id}`,
          },
          popularity: {
            views: candidate.view_count || buildRecord.view_count || 0,
            likes: candidate.like_count || buildRecord.likes || 0,
            viewsLabel: formatViews(candidate.view_count || buildRecord.view_count || 0),
            averageCost: candidate.average_cost,
            buildTag: candidate.build_tag || null,
            seasonLabel: candidate.season_abbr || `S${candidate.season_number || ''}`.trim(),
            updatedAt: candidate.updated_at.slice(0, 10),
            author: candidate.user_username,
            lastVerified: '2026-03-13',
          },
          roundCount: MODE_ROUND_COUNT[mode],
          rounds,
          corePowers,
          coreItems,
        });
      }

      ensureModeBuilds(buildsByMode[mode], 3, heroId, mode);
    }

    outputHeroes.push({
      heroId,
      heroIcon: localHero.portrait,
      lastVerified: '2026-03-13',
      heroNote: 'Сборки отсортированы по свежести, hotness, просмотрам и лайкам среди public StadiumBuilds.',
      buildsByMode,
    });

    completedHeroIds.add(heroId);
    await saveTranslationCache(translationCache);
    await writeDataset(outputHeroes);
  }
  await saveTranslationCache(translationCache);

  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }

  await writeDataset(outputHeroes);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
