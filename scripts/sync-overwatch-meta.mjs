import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const META_PATH = path.join(ROOT, "src", "data", "meta.json");
const HEROES_PATH = path.join(ROOT, "src", "data", "heroes.json");
const PATCHES_PATH = path.join(ROOT, "src", "data", "patches.json");
const META_FILTERS_PATH = path.join(ROOT, "src", "data", "metaFilters.ts");
const BLIZZARD_RATES_URL =
  // rq=1 is Blizzard's competitive queue view; rq=0 is the all-modes view
  // and returns a zero placeholder for every ban-rate cell.
  "https://overwatch.blizzard.com/en-us/rates/?input=PC&map=all-maps&region=Europe&role=All&rq=1&tier=All";

const ROLE_LABELS_RU = {
  Tank: "танка",
  Damage: "DPS",
  Support: "саппорта",
};

const HERO_NAME_RU_OVERRIDES = {
  Shion: "Сион",
  "D.Mon": "D.Mon",
};

const BLIZZARD_HERO_ID_ALIASES = {
  "jetpack-cat": "jetpackcat",
  "junker-queen": "junkerqueen",
  "soldier-76": "soldier76",
  "wrecking-ball": "wreckingball",
};

const TIER_RANK = {
  D: 0,
  C: 1,
  B: 2,
  A: 3,
  S: 4,
};

const RANK_TIER = ["D", "C", "B", "A", "S"];

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function fetchText(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
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
    throw new Error("Could not locate Blizzard Hero Statistics rows in HTML");
  }
  return JSON.parse(match[1].replace(/&quot;/g, '"'));
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#39;", "'");
}

function stripHtml(html) {
  return (
    decodeHtmlEntities(html)
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      // Blizzard wraps every patch block with a "Top of post" back-to-top anchor and
      // renders before/after map previews as image captions. Neither carries meaning.
      .replace(/Top of post/gi, "")
      .replace(/Before and After/gi, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

function extractListItems(html) {
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((match) =>
    stripHtml(match[1]),
  );
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildHeroNameMap(heroes) {
  const map = new Map();
  for (const hero of heroes) {
    map.set(normalizeName(hero.name), hero.id);
  }
  return map;
}

function localHeroIdFromBlizzardId(heroId) {
  return BLIZZARD_HERO_ID_ALIASES[heroId] || heroId;
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

  return `${match[3]}-${String(monthIndex + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function formatHotfixTitle(dateIso) {
  const [, month, day] = dateIso.split("-");
  const monthLabel = MONTH_NAMES_EN[Number(month) - 1] || "July";
  return `🔥 Overwatch Season 4 - Hotfix ${monthLabel} ${Number(day)}`;
}

function translateHeroName(name) {
  return HERO_NAME_RU_OVERRIDES[name] || name;
}

function translateSectionTitle(title) {
  if (title === "Hotfix Update") return "Горячий фикс";
  if (title === "Bug Fixes") return "Исправления";
  if (title === "Community Crafted Event") return "Событие Community Crafted";
  return title;
}

function pluralHeroes(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "героев";
  if (mod10 === 1) return "герой";
  if (mod10 >= 2 && mod10 <= 4) return "героя";
  return "героев";
}

function pluralizeCount(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} ${many}`;
  if (mod10 === 1) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

function buildPatchSummary(changes, heroNameRuById, hotfixNote) {
  const heroIds = [
    ...new Set(
      changes.filter((change) => change.heroId).map((change) => change.heroId),
    ),
  ];
  const buffs = changes.filter((change) => change.type === "buff").length;
  const nerfs = changes.filter((change) => change.type === "nerf").length;
  const reworks = changes.filter((change) => change.type === "rework").length;

  if (heroIds.length === 0) {
    if (/replay codes (?:have been wiped|were wiped)/i.test(hotfixNote)) {
      return "Патч без балансных правок героев: исправления и системные изменения. Реплей-коды сброшены.";
    }
    if (/replay codes[^.]*still available/i.test(hotfixNote)) {
      return "Патч без балансных правок героев: исправления и системные изменения. Реплей-коды предыдущего патча по-прежнему доступны.";
    }
    return "Патч без балансных правок героев: исправления и системные изменения.";
  }

  const names = heroIds.map((id) => heroNameRuById.get(id) || id);
  const shown =
    names.length <= 5
      ? names.join(", ")
      : `${names.slice(0, 5).join(", ")} и ещё ${names.length - 5}`;
  const parts = [];
  if (buffs) parts.push(pluralizeCount(buffs, "бафф", "баффа", "баффов"));
  if (nerfs) parts.push(pluralizeCount(nerfs, "нерф", "нерфа", "нерфов"));
  if (reworks)
    parts.push(pluralizeCount(reworks, "реворк", "реворка", "реворков"));
  const balance = parts.length ? parts.join(", ") : "точечные правки";

  return `Балансный хотфикс затронул ${heroIds.length} ${pluralHeroes(heroIds.length)} (${shown}): ${balance}. Все правки разложены ниже по способностям.`;
}

function translateChange(sectionTitle, text) {
  if (sectionTitle === "Community Crafted Event") {
    if (text.includes("Streamer Luck")) {
      return 'Требование испытания "Streamer Luck" (победа на разных героях в Community Crafted) снижено с 20 до 3.';
    }
    if (text.includes("Chat, Are We Cooked?")) {
      return 'Требование мета-испытания "Chat, Are We Cooked?" снижено с 14 до 13 выполнений.';
    }
    if (text.includes("Clickbait Mitigation")) {
      return 'Требование по поглощению урона в испытании "Clickbait Mitigation" снижено с 15 000 до 5 000.';
    }
  }

  if (
    sectionTitle === "Bug Fixes" &&
    text.includes("Shion") &&
    text.includes("Execution")
  ) {
    return "Исправлена ошибка, из-за которой Сион не могла использовать Execution во время перезарядки.";
  }

  return stripHtml(text);
}

function stripLeadingSectionTitle(text, sectionTitle) {
  const cleanText = text.trim();
  const cleanTitle = stripHtml(sectionTitle).trim();
  if (
    !cleanTitle ||
    !cleanText.toLowerCase().startsWith(cleanTitle.toLowerCase())
  ) {
    return cleanText;
  }

  return cleanText.slice(cleanTitle.length).trim();
}

// Метрики, рост которых улучшает героя (урон, лечение, запас здоровья, длительность и т.п.).
const BENEFIT_METRICS = [
  "damage",
  "healing",
  "health",
  "overhealth",
  "barrier",
  "shield",
  "regen",
  "regenerat",
  "lifesteal",
  "rate",
  "speed",
  "range",
  "radius",
  "duration",
  "armor",
  "ammo",
  "energy",
  "bonus",
  "amount",
  "projectile size",
  "size",
  "width",
  "degrees",
  "shots",
];

// Метрики, рост которых ухудшает героя: это стоимость/задержка, а не награда.
const PENALTY_METRICS = [
  "cooldown",
  "recovery",
  "cast time",
  "activation time",
  "spread",
  "delay",
  "drain",
  "cost",
  "penalty",
  "lock on",
  "lock-on",
  "reload",
  "charge time",
];

function changeDirection(text) {
  // "gain" is deliberately excluded: it is usually a noun ("collateral range gain
  // reduced …"), so treating it as an increase verb inverts real nerfs.
  const up = text.match(
    /\b(increas\w*|grant\w*|add\w*|buff\w*|rais\w*|improv\w*|up)\b/,
  );
  const down = text.match(
    /\b(reduc\w*|decreas\w*|lower\w*|remov\w*|nerf\w*|shorten\w*|less|down)\b/,
  );

  if (up && down) return up.index <= down.index ? "up" : "down";
  if (up) return "up";
  if (down) return "down";
  return null;
}

function firstMetricPolarity(text) {
  let first = null;
  const scan = (list, polarity) => {
    for (const metric of list) {
      const index = text.indexOf(metric);
      if (index !== -1 && (!first || index < first.index)) {
        first = { index, polarity };
      }
    }
  };
  scan(BENEFIT_METRICS, "benefit");
  scan(PENALTY_METRICS, "penalty");
  return first ? first.polarity : null;
}

// "from X to Y" states the numeric direction outright, so it beats verb guessing
// for compound lines like "Deploy turrets increased throw range reduced from 50% to 25%".
function numericDirection(text) {
  const match = text.match(/from\s+([\d.]+)\D+?to\s+([\d.]+)/);
  if (!match) return null;
  const from = Number(match[1]);
  const to = Number(match[2]);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to)
    return null;
  return to < from ? "down" : "up";
}

function classifyChangeType(text, hasHeroId, sectionTitle) {
  if (
    !hasHeroId ||
    sectionTitle === "Hotfix Update" ||
    sectionTitle === "Community Crafted Event"
  ) {
    return "system";
  }

  const normalized = text.toLowerCase();
  if (normalized.includes("rework") || normalized.includes("moved from")) {
    return "rework";
  }

  // Blizzard Stadium/Power lines end with "(Up from …)" or "(Down from …)", which
  // names the direction unambiguously regardless of noun phrasing ("Charge gain
  // reduced … (Down from 25%)"). Trust that marker over verb guessing.
  const deltaDirection = normalized.match(/\((up|down) from[^)]*\)/);
  if (deltaDirection) {
    return deltaDirection[1] === "up" ? "buff" : "nerf";
  }

  const direction = numericDirection(normalized) || changeDirection(normalized);
  if (!direction) {
    return "system";
  }

  // Направление изменения всегда относим к семантике метрики: рост cooldown — это
  // nerf, снижение урона — nerf, тогда как рост урона или снижение кулдауна — buff.
  const polarity = firstMetricPolarity(normalized);
  if (!polarity) {
    return direction === "up" ? "buff" : "nerf";
  }
  if (polarity === "benefit") {
    return direction === "up" ? "buff" : "nerf";
  }
  return direction === "up" ? "nerf" : "buff";
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
    if (html.includes("PatchNotes-patchTitle")) {
      return { html, url };
    }
  }

  throw new Error("Could not locate live Blizzard patch notes page");
}

function parsePatchBlocks(html) {
  const starts = [
    ...html.matchAll(/<div class="PatchNotes-patch PatchNotes-live">/g),
  ]
    .map((match) => match.index)
    .filter((value) => value !== undefined);
  const blocks = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end =
      index + 1 < starts.length
        ? starts[index + 1]
        : html.indexOf('<div class="PatchNotesTop">', start);
    blocks.push(html.slice(start, end === -1 ? html.length : end));
  }

  return blocks;
}

// Hero-level "general updates" carry armor, health, ultimate-cost and perk changes
// (e.g. "Armor reduced from 325 to 275", "Focused Fusion - Major Perk"). The old
// parser ignored them entirely, silently dropping balance changes.
function parseHeroGeneralUpdates(heroBlock, heroId, sectionTitle, devComment) {
  const changes = [];
  const generalHtml =
    heroBlock.match(
      /<div class="PatchNotesHeroUpdate-generalUpdates">([\s\S]*?)<\/div>/,
    )?.[1] || "";
  if (!generalHtml) return changes;

  // Each "<p>Label</p>" names the perk/subgroup that the list below it belongs to.
  // Items before any such label are base changes, so they keep a neutral name.
  const segments = generalHtml.split(/(?=<p>)/);
  for (const segment of segments) {
    const labelMatch = segment.match(/<p>([\s\S]*?)<\/p>/);
    const abilityName = labelMatch
      ? stripHtml(labelMatch[1])
      : "Общие изменения";

    for (const detail of extractListItems(segment)) {
      const description = stripHtml(detail);
      if (!description) continue;
      changes.push({
        ...(heroId ? { heroId } : {}),
        type: classifyChangeType(description, Boolean(heroId), sectionTitle),
        ability: abilityName,
        description,
        ...(devComment ? { devComment } : {}),
      });
    }
  }

  return changes;
}

// Blizzard renders bug-fix sections as pairs of "title" + "description" divs with no
// separator between them, which used to glue headers onto the first line ("HeroesMercy").
function buildGenericSectionText(sectionHtml) {
  const titles = [
    ...sectionHtml.matchAll(
      /<div class="PatchNotesGeneralUpdate-title">([\s\S]*?)<\/div>/g,
    ),
  ].map((match) => stripHtml(match[1]));
  const descriptions = [
    ...sectionHtml.matchAll(
      /<div class="PatchNotesGeneralUpdate-description">([\s\S]*?)<\/div>/g,
    ),
  ].map((match) => stripHtml(match[1]));

  if (titles.length === 0 && descriptions.length === 0) {
    return "";
  }

  const count = Math.max(titles.length, descriptions.length);
  const parts = [];
  for (let index = 0; index < count; index += 1) {
    const combined = [titles[index] || "", descriptions[index] || ""]
      .filter(Boolean)
      .join("\n");
    if (combined) parts.push(combined);
  }
  return parts.join("\n");
}

function parsePatchChanges(sectionHtml, sectionTitle, heroNameById) {
  const changes = [];
  const heroUpdateStarts = [
    ...sectionHtml.matchAll(/<div class="PatchNotesHeroUpdate">/g),
  ]
    .map((match) => match.index)
    .filter((value) => value !== undefined);

  if (heroUpdateStarts.length > 0) {
    for (let index = 0; index < heroUpdateStarts.length; index += 1) {
      const start = heroUpdateStarts[index];
      const end =
        index + 1 < heroUpdateStarts.length
          ? heroUpdateStarts[index + 1]
          : sectionHtml.length;
      const heroBlock = sectionHtml.slice(start, end);
      const heroName = heroBlock.match(
        /<h5 class="PatchNotesHeroUpdate-name">([^<]+)<\/h5>/,
      )?.[1];
      const heroId = heroName
        ? heroNameById.get(normalizeName(heroName))
        : undefined;
      const devComment = stripHtml(
        heroBlock.match(
          /<div class="PatchNotes-dev PatchNotesHeroUpdate-dev">([\s\S]*?)<\/div>/,
        )?.[1] || "",
      );

      changes.push(
        ...parseHeroGeneralUpdates(heroBlock, heroId, sectionTitle, devComment),
      );

      const abilityMatches = [
        ...heroBlock.matchAll(
          /<div class="PatchNotesAbilityUpdate-name">([^<]+)<\/div>[\s\S]*?<div class="PatchNotesAbilityUpdate-detailList">([\s\S]*?)<\/div>/g,
        ),
      ];

      for (const abilityMatch of abilityMatches) {
        const abilityName = stripHtml(abilityMatch[1]);
        const details = extractListItems(abilityMatch[2]);

        for (const detail of details) {
          const description = translateChange(sectionTitle, detail);
          changes.push({
            ...(heroId ? { heroId } : {}),
            type: classifyChangeType(
              description,
              Boolean(heroId),
              sectionTitle,
            ),
            ability: abilityName,
            description,
            ...(devComment ? { devComment } : {}),
          });
        }
      }
    }

    return changes;
  }

  const heroName = sectionHtml.match(
    /<h5 class="PatchNotesHeroUpdate-name">([^<]+)<\/h5>/,
  )?.[1];
  const heroId = heroName
    ? heroNameById.get(normalizeName(heroName))
    : undefined;
  const abilityMatches = [
    ...sectionHtml.matchAll(
      /<div class="PatchNotesAbilityUpdate-name">([^<]+)<\/div>[\s\S]*?<div class="PatchNotesAbilityUpdate-detailList">([\s\S]*?)<\/div>/g,
    ),
  ];

  if (sectionTitle === "Hotfix Update") {
    return changes;
  }

  if (sectionTitle === "Community Crafted Event") {
    const listItems = extractListItems(sectionHtml);
    for (const item of listItems) {
      changes.push({
        type: "system",
        ability: translateSectionTitle(sectionTitle),
        description: translateChange(sectionTitle, item),
      });
    }
    return changes;
  }

  if (sectionTitle === "Bug Fixes" && heroName && abilityMatches.length > 0) {
    for (const abilityMatch of abilityMatches) {
      const abilityName = abilityMatch[1];
      const detailText = translateChange(
        sectionTitle,
        stripHtml(abilityMatch[2]),
      );
      changes.push({
        ...(heroId ? { heroId } : {}),
        type: classifyChangeType(detailText, Boolean(heroId), sectionTitle),
        ability: heroId
          ? abilityName
          : `${translateHeroName(heroName)} / ${abilityName}`,
        description: detailText,
      });
    }
    return changes;
  }

  const genericText = buildGenericSectionText(sectionHtml);
  if (genericText) {
    changes.push({
      type: "system",
      ability: translateSectionTitle(sectionTitle),
      description: translateChange(sectionTitle, genericText),
    });
    return changes;
  }

  const sectionText = stripLeadingSectionTitle(
    stripHtml(sectionHtml),
    sectionTitle,
  );
  if (sectionText) {
    changes.push({
      type: "system",
      ability: translateSectionTitle(sectionTitle),
      description: translateChange(sectionTitle, sectionText),
    });
  }

  return changes;
}

function parseLivePatches(html, heroNameById, heroNameRuById) {
  const blocks = parsePatchBlocks(html);
  const patches = [];

  for (const block of blocks) {
    const dateText = block.match(
      /<div class="PatchNotes-date">([^<]+)<\/div>/,
    )?.[1];
    if (!dateText) continue;

    const dateIso = parseIsoDate(dateText);
    if (!dateIso) continue;

    const sections = [
      ...block.matchAll(
        /<div class="PatchNotes-section PatchNotes-section-([^"]+)">/g,
      ),
    ]
      .map((match) => ({ index: match.index ?? 0, kind: match[1] }))
      .sort((left, right) => left.index - right.index);

    let hotfixNote = "";
    const changes = [];

    for (let index = 0; index < sections.length; index += 1) {
      const sectionStart = sections[index].index;
      const sectionEnd =
        index + 1 < sections.length ? sections[index + 1].index : block.length;
      const sectionHtml = block.slice(sectionStart, sectionEnd);
      const sectionTitle =
        sectionHtml.match(
          /<h4 class="PatchNotes-sectionTitle">([^<]+)<\/h4>/,
        )?.[1] || "";
      const descriptionHtml =
        sectionHtml.match(
          /<div class="PatchNotes-sectionDescription">([\s\S]*?)<\/div>/,
        )?.[1] || "";
      const descriptionText = stripHtml(descriptionHtml);

      if (
        !hotfixNote &&
        /this is a (?:hotfix|bug fix|bugfix) (?:patch|update)/i.test(
          descriptionText,
        )
      ) {
        hotfixNote = descriptionText;
      }

      changes.push(
        ...parsePatchChanges(sectionHtml, sectionTitle, heroNameById),
      );
    }

    patches.push({
      patchId: `ow-s4-hotfix-${dateIso}`,
      date: dateIso,
      version: "4.0",
      title: formatHotfixTitle(dateIso),
      summary: buildPatchSummary(changes, heroNameRuById, hotfixNote),
      changes,
    });
  }

  return patches;
}

function normalizeDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateRu(date) {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const year = parts.find((part) => part.type === "year")?.value || "";
  return `${day} ${month} ${year}`.trim();
}

function round1(value) {
  return Number(value.toFixed(1));
}

function parseMetaSignals(source) {
  const start = source.indexOf("export const HERO_META_SIGNALS");
  const end = source.indexOf("};", start);
  if (start === -1 || end === -1) {
    throw new Error(
      "Could not locate HERO_META_SIGNALS in src/data/metaFilters.ts",
    );
  }

  const block = source.slice(start, end);
  const signals = new Map();
  const signalPattern =
    /^\s*([a-z0-9]+):\s*\{[^}]*expertTier:\s*'([SABCD])'[^}]*proSignal:\s*([0-3])/gm;

  for (const match of block.matchAll(signalPattern)) {
    signals.set(match[1], {
      expertTier: match[2],
      proSignal: Number(match[3]),
    });
  }

  return signals;
}

function statisticalTierFromRates(winRate, pickRate) {
  if (winRate >= 54.5 && pickRate >= 1.5) return "S";
  if (winRate >= 51 && pickRate >= 3) return "A";
  if (winRate >= 48.5) return "B";
  if (winRate >= 46.5) return "C";
  return "D";
}

function deriveTier({ winRate, pickRate, currentTier, signal }) {
  const statTier = statisticalTierFromRates(winRate, pickRate);

  if (!signal) {
    return statTier || currentTier;
  }

  const statRank = TIER_RANK[statTier];
  const expertRank = TIER_RANK[signal.expertTier];

  if (statTier === "S") {
    return "S";
  }

  if (
    expertRank <= TIER_RANK.B &&
    statRank > expertRank &&
    signal.proSignal <= 1 &&
    pickRate < 8
  ) {
    return signal.expertTier;
  }

  if (
    expertRank >= TIER_RANK.A &&
    statRank < expertRank &&
    winRate >= 50 &&
    signal.proSignal >= 1
  ) {
    return RANK_TIER[Math.min(TIER_RANK.A, statRank + 1)];
  }

  if (expertRank === TIER_RANK.S && winRate < 47) {
    return statTier;
  }

  return statTier || currentTier;
}

async function main() {
  const [metaRaw, heroesRaw, patchesRaw, signalSource, ratesHtml] =
    await Promise.all([
      fs.readFile(META_PATH, "utf8"),
      fs.readFile(HEROES_PATH, "utf8"),
      fs.readFile(PATCHES_PATH, "utf8"),
      fs.readFile(META_FILTERS_PATH, "utf8"),
      fetchText(BLIZZARD_RATES_URL),
    ]);

  const meta = JSON.parse(metaRaw);
  const heroes = JSON.parse(heroesRaw);
  const patches = JSON.parse(patchesRaw);
  const rates = parseRates(ratesHtml);
  const hasBanRateValues = rates.some((row) => Number(row.cells?.banrate) > 0);
  const metaSignals = parseMetaSignals(signalSource);
  const localHeroIds = new Set(heroes.map((hero) => hero.id));
  const unknownRateHeroIds = rates
    .map((row) => localHeroIdFromBlizzardId(row.id))
    .filter((heroId) => !localHeroIds.has(heroId));
  if (unknownRateHeroIds.length > 0) {
    throw new Error(
      `Blizzard Hero Statistics contains heroes missing from src/data/heroes.json: ${unknownRateHeroIds.join(", ")}`,
    );
  }

  const heroById = new Map(
    rates.map((row) => [localHeroIdFromBlizzardId(row.id), row]),
  );
  const heroNameById = new Map(heroes.map((hero) => [hero.id, hero.nameRu]));
  const heroRoleById = new Map(heroes.map((hero) => [hero.id, hero.role]));
  const today = normalizeDate(new Date());
  const livePatchResponse = await fetchLivePatchNotesHtml();
  const livePatches = parseLivePatches(
    livePatchResponse.html,
    buildHeroNameMap(heroes),
    heroNameById,
  );
  const livePatchIds = new Set(livePatches.map((patch) => patch.patchId));
  const existingPatches = patches.filter(
    (patch) => !livePatchIds.has(patch.patchId),
  );

  meta.season = 4;
  meta.seasonName = "Сезон 4: Герои Пусана";
  meta.patch = "4.0";
  meta.lastUpdated = today;
  meta.sources = [
    `Blizzard Hero Statistics: PC, Europe, Competitive queue (rq=1), live Hero Stats page crawled on ${formatDateRu(new Date())}`,
    "Blizzard D.Mon hero page: official abilities, role and lore",
    "Blizzard Season 4: Heroes of Busan launch notes",
    ...livePatches.map((patch) => patch.title),
    ...meta.sources.filter(
      (source) =>
        !source.startsWith("Blizzard Hero Statistics:") &&
        !source.startsWith("Overwatch Retail Patch Notes") &&
        !source.startsWith("Overwatch live patch notes reviewed on "),
    ),
  ].filter((source, index, all) => all.indexOf(source) === index);
  meta.metaDescription =
    `Тир-лист обновлён под актуальный публичный срез Blizzard Hero Statistics для PC (Europe) на ${formatDateRu(new Date())} года. ` +
    `В основе лежат свежие win rate и pick rate${hasBanRateValues ? ", а также competitive ban rate" : "; Blizzard сейчас не публикует ban rate"} по всем героям с учётом текущего патча Season 4.`;

  meta.heroes = meta.heroes.map((hero) => {
    const row = heroById.get(hero.heroId);
    if (!row) return hero;
    const winRate = round1(Number(row.cells.winrate));
    const pickRate = round1(Number(row.cells.pickrate));
    const banRate = round1(Number(row.cells.banrate));
    const nameRu = heroNameById.get(hero.heroId) || hero.heroId;
    const role = heroRoleById.get(hero.heroId) || "Damage";
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
      banRate,
      whyMeta: `${nameRu} по текущему срезу Blizzard выглядит как ${tier}-тир ${ROLE_LABELS_RU[role] || role}: ${winRate}% win rate, ${pickRate}% pick rate${hasBanRateValues ? ` и ${banRate}% ban rate` : ""}.`,
    };
  });

  // Новые герои могут появиться в Blizzard Hero Statistics раньше, чем в
  // сохранённом meta.json. Добавляем их автоматически, чтобы сезонный sync
  // не терял D.Mon и следующие релизы.
  const mappedHeroIds = new Set(meta.heroes.map((hero) => hero.heroId));
  for (const [heroId, row] of heroById) {
    if (mappedHeroIds.has(heroId)) continue;
    const winRate = round1(Number(row.cells.winrate));
    const pickRate = round1(Number(row.cells.pickrate));
    const banRate = round1(Number(row.cells.banrate));
    const nameRu = heroNameById.get(heroId) || heroId;
    const role = heroRoleById.get(heroId) || "Damage";
    const tier = deriveTier({
      winRate,
      pickRate,
      currentTier: "B",
      signal: metaSignals.get(heroId),
    });
    meta.heroes.push({
      heroId,
      tier,
      pickRate,
      winRate,
      banRate,
      whyMeta: `${nameRu} по текущему срезу Blizzard выглядит как ${tier}-тир ${ROLE_LABELS_RU[role] || role}: ${winRate}% win rate, ${pickRate}% pick rate${hasBanRateValues ? ` и ${banRate}% ban rate` : ""}.`,
    });
  }

  await fs.writeFile(
    PATCHES_PATH,
    `${JSON.stringify([...livePatches, ...existingPatches], null, 2)}\n`,
  );
  await fs.writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(
    `Synced ${meta.heroes.length} heroes and ${livePatches.length} live patches for ${today}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
