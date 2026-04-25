import { HeroRole } from '@/types/heroes';
import {
  ComputedHeroMeta,
  HeroMeta,
  HeroMetaSignal,
  MetaFilters,
  MetaGameMode,
  MetaInput,
  MetaMap,
  MetaRankTier,
  MetaRegion,
  Tier,
} from '@/types/meta';

export const META_SOURCE_NOTES = [
  {
    id: 'blizzard-rates',
    label: 'Blizzard Hero Statistics',
    url: 'https://overwatch.blizzard.com/en-us/rates/',
    weight: 'Базовая статистика pick rate / win rate по текущему патчу.',
  },
  {
    id: 'pcgamer-2026-04-23',
    label: 'PC Gamer Season 2 Summit tier list',
    url: 'https://www.pcgamer.com/games/fps/overwatch-tier-list/',
    weight: 'Свежий общий tier list с упоминаниями pro/high-rank меты.',
  },
  {
    id: 'playerauctions-2026-04-16',
    label: 'PlayerAuctions Season 2 Summit tier list',
    url: 'https://www.playerauctions.com/overwatch-guide/tips-tricks/season-2-summit-tier-list-is-sierra-broken/',
    weight: 'Ролевая оценка героев после запуска Season 2: Summit.',
  },
  {
    id: 'dexerto-2026-04-15',
    label: 'Dexerto Overwatch role guides',
    url: 'https://www.dexerto.com/wikis/overwatch/best-damage-heroes/',
    weight: 'Дополнительный экспертный сигнал по ролям и consistency.',
  },
  {
    id: 'pockettactics-2026-04-01',
    label: 'Pocket Tactics April 2026 tier list',
    url: 'https://www.pockettactics.com/overwatch-2/tier-list',
    weight: 'Более ранний baseline для проверки расхождений после старта Summit.',
  },
] as const;

export const INPUT_OPTIONS: { value: MetaInput; label: string }[] = [
  { value: 'pc', label: 'Mouse & Keyboard' },
  { value: 'console', label: 'Controller' },
];

export const GAME_MODE_OPTIONS: { value: MetaGameMode; label: string }[] = [
  { value: 'quick-play', label: 'Quick Play - Role Queue' },
  { value: 'competitive', label: 'Competitive - Role Queue' },
];

export const RANK_TIER_OPTIONS: { value: MetaRankTier; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'master', label: 'Master' },
  { value: 'grandmaster', label: 'Grandmaster and Champion' },
];

export const REGION_OPTIONS: { value: MetaRegion; label: string }[] = [
  { value: 'americas', label: 'Americas' },
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
];

export const MAP_GROUPS: { label: string; options: { value: MetaMap; label: string }[] }[] = [
  {
    label: 'General',
    options: [{ value: 'all-maps', label: 'All Maps' }],
  },
  {
    label: 'Control',
    options: [
      { value: 'antarctic-peninsula', label: 'Antarctic Peninsula' },
      { value: 'busan', label: 'Busan' },
      { value: 'ilios', label: 'Ilios' },
      { value: 'lijiang-tower', label: 'Lijiang Tower' },
      { value: 'nepal', label: 'Nepal' },
      { value: 'oasis', label: 'Oasis' },
      { value: 'samoa', label: 'Samoa' },
    ],
  },
  {
    label: 'Escort',
    options: [
      { value: 'circuit-royal', label: 'Circuit Royal' },
      { value: 'dorado', label: 'Dorado' },
      { value: 'havana', label: 'Havana' },
      { value: 'junkertown', label: 'Junkertown' },
      { value: 'rialto', label: 'Rialto' },
      { value: 'route-66', label: 'Route 66' },
      { value: 'shambali-monastery', label: 'Shambali Monastery' },
      { value: 'watchpoint-gibraltar', label: 'Watchpoint: Gibraltar' },
    ],
  },
  {
    label: 'Flashpoint',
    options: [
      { value: 'aatlis', label: 'Aatlis' },
      { value: 'new-junk-city', label: 'New Junk City' },
      { value: 'suravasa', label: 'Suravasa' },
    ],
  },
  {
    label: 'Hybrid',
    options: [
      { value: 'blizzard-world', label: 'Blizzard World' },
      { value: 'eichenwalde', label: 'Eichenwalde' },
      { value: 'hollywood', label: 'Hollywood' },
      { value: 'kings-row', label: "King's Row" },
      { value: 'midtown', label: 'Midtown' },
      { value: 'numbani', label: 'Numbani' },
      { value: 'paraiso', label: 'Paraíso' },
    ],
  },
  {
    label: 'Push',
    options: [
      { value: 'colosseo', label: 'Colosseo' },
      { value: 'esperanca', label: 'Esperança' },
      { value: 'new-queen-street', label: 'New Queen Street' },
      { value: 'runasapi', label: 'Runasapi' },
    ],
  },
];

const TIER_SCORE: Record<Tier, number> = {
  S: 1,
  A: 0.78,
  B: 0.56,
  C: 0.34,
  D: 0.12,
};

const DEFAULT_SIGNAL: HeroMetaSignal = {
  expertTier: 'B',
  proSignal: 0,
  notes: 'Нет сильного экспертного расхождения с базовой статистикой.',
  sourceIds: ['blizzard-rates'],
};

export const HERO_META_SIGNALS: Record<string, HeroMetaSignal> = {
  dva: { expertTier: 'S', proSignal: 2, notes: 'Высокий expert consensus: универсальный танк для темпа и peel.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['dive', 'vertical'], highRankBias: 0.05 },
  domina: { expertTier: 'A', proSignal: 2, notes: 'Сильный poke/frontline pick, но dive и brawl снижают стабильность.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['poke'] },
  doomfist: { expertTier: 'C', proSignal: 1, notes: 'Требует высокого исполнения; в экспертных списках нестабилен.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['dive'], highRankBias: 0.04 },
  hazard: { expertTier: 'A', proSignal: 1, notes: 'Хорошая статистика и стабильный ranked value, но не всегда top pro priority.', sourceIds: ['blizzard-rates', 'pcgamer-2026-04-23'] },
  junkerqueen: { expertTier: 'B', proSignal: 1, notes: 'Работает в агрессивном brawl, но карта и состав сильно решают.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl'] },
  mauga: { expertTier: 'B', proSignal: 0, notes: 'Рабочий ranked pick, но expert consensus не держит его вверху.', sourceIds: ['pcgamer-2026-04-23'] },
  orisa: { expertTier: 'A', proSignal: 0, notes: 'Источники расходятся: статистика слабее, но часть tier-листов ценит стабильность.', sourceIds: ['pcgamer-2026-04-23'] },
  ramattra: { expertTier: 'S', proSignal: 2, notes: 'Сильный tank consensus в Season 2 Summit, особенно в организованной игре.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['brawl', 'poke'], highRankBias: 0.04 },
  reinhardt: { expertTier: 'B', proSignal: 1, notes: 'Силен в ranked brawl и на close-range картах, но менее универсален.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['brawl'] },
  roadhog: { expertTier: 'C', proSignal: 0, notes: 'Нестабилен после быстрых правок Chain Hook; высокий риск просадки.', sourceIds: ['pcgamer-2026-04-23'] },
  sigma: { expertTier: 'S', proSignal: 3, notes: 'Один из самых надёжных pro/high-rank танков для poke и контроля углов.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['poke'], highRankBias: 0.06 },
  winston: { expertTier: 'A', proSignal: 2, notes: 'Dive остаётся сильным на подходящих картах и в координации.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['dive', 'vertical'], highRankBias: 0.05 },
  wreckingball: { expertTier: 'B', proSignal: 1, notes: 'Карта-зависимый disrupt pick с высоким потолком.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['dive'], highRankBias: 0.03 },
  zarya: { expertTier: 'S', proSignal: 2, notes: 'Экспертные списки поднимают её выше сырой статистики из-за carry-потенциала.', sourceIds: ['pcgamer-2026-04-23', 'pockettactics-2026-04-01'], mapTags: ['brawl'] },

  anran: { expertTier: 'A', proSignal: 1, notes: 'Сильнее в агрессивных составах и на картах с быстрыми входами.', sourceIds: ['playerauctions-2026-04-16', 'dexerto-2026-04-15'], mapTags: ['dive'] },
  ashe: { expertTier: 'S', proSignal: 2, notes: 'Высокий expert consensus среди hitscan: безопасный урон и pick potential.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['poke', 'long-range'] },
  bastion: { expertTier: 'B', proSignal: 0, notes: 'Источники расходятся: силён в ranked, но легко наказывается организованными командами.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'] },
  cassidy: { expertTier: 'B', proSignal: 1, notes: 'Высокая популярность, но разные tier-листы спорят о реальной отдаче.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'] },
  echo: { expertTier: 'A', proSignal: 1, notes: 'Сильна при хорошей линии фронта и на вертикальных картах.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['vertical', 'dive'] },
  emre: { expertTier: 'S', proSignal: 2, notes: 'Свежие tier-листы высоко оценивают sustain, давление и стабильность.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16', 'dexerto-2026-04-15'], highRankBias: 0.04 },
  freja: { expertTier: 'D', proSignal: 0, notes: 'Один из самых слабых DPS по свежему expert consensus.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'] },
  genji: { expertTier: 'S', proSignal: 2, notes: 'Высокий ceiling и сильный dive pressure, особенно выше Diamond.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['dive'], highRankBias: 0.06 },
  hanzo: { expertTier: 'B', proSignal: 0, notes: 'Сильный на sightline-картах, но в среднем уступает мобильным DPS.', sourceIds: ['playerauctions-2026-04-16'], mapTags: ['long-range'] },
  junkrat: { expertTier: 'B', proSignal: 0, notes: 'Может выигрывать close-range карты, но нестабилен против дальних линий.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl'] },
  mei: { expertTier: 'A', proSignal: 1, notes: 'Ice Wall даёт сильный fight-winning utility на brawl-картах.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl'] },
  pharah: { expertTier: 'B', proSignal: 1, notes: 'Растёт, когда команды плохо отвечают на vertical pressure.', sourceIds: ['playerauctions-2026-04-16'], mapTags: ['vertical'] },
  reaper: { expertTier: 'A', proSignal: 1, notes: 'Хороший close-range punish в текущем открытом ranked meta.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl'] },
  sojourn: { expertTier: 'S', proSignal: 2, notes: 'Источники спорят со статистикой: pro/high-skill потенциал всё ещё очень высокий.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['poke'], highRankBias: 0.06 },
  soldier76: { expertTier: 'A', proSignal: 1, notes: 'Надёжный ranked DPS, но ceiling ниже топовых carry-пиков.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'] },
  sierra: { expertTier: 'A', proSignal: 2, notes: 'Новый герой с сильной utility и ultimate pressure; тир пока нестабилен после патча.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['poke', 'vertical'], highRankBias: 0.03 },
  sombra: { expertTier: 'C', proSignal: 0, notes: 'Ниша counter-pick; свежие правки пока не вернули её в верх меты.', sourceIds: ['playerauctions-2026-04-16'] },
  symmetra: { expertTier: 'B', proSignal: 1, notes: 'Может быть сильной в coordinated play и на close-range картах.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl'] },
  torbjorn: { expertTier: 'A', proSignal: 1, notes: 'Turret value хорошо наказывает мобильных героев в ranked.', sourceIds: ['playerauctions-2026-04-16', 'dexerto-2026-04-15'] },
  tracer: { expertTier: 'S', proSignal: 3, notes: 'Классический high-rank/pro DPS с сильным ceiling.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['dive'], highRankBias: 0.07 },
  vendetta: { expertTier: 'S', proSignal: 2, notes: 'После нерфов всё ещё сильна, но требует аккуратного исполнения.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], highRankBias: 0.03 },
  venture: { expertTier: 'A', proSignal: 1, notes: 'Ситуативная, но даёт уникальную ценность на objective pressure.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['brawl', 'dive'] },
  widowmaker: { expertTier: 'B', proSignal: 1, notes: 'Сильно зависит от карты и механики игрока.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['long-range'], highRankBias: 0.03 },

  ana: { expertTier: 'S', proSignal: 3, notes: 'Очень сильный utility support; часто упоминается как pro/high-rank staple.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], highRankBias: 0.06 },
  baptiste: { expertTier: 'A', proSignal: 1, notes: 'Статистика слабее, но utility и damage ceiling остаются важными.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['poke'] },
  brigitte: { expertTier: 'A', proSignal: 2, notes: 'Хороша против dive и для защиты второго саппорта.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['anti-dive'] },
  illari: { expertTier: 'A', proSignal: 1, notes: 'Сильная статистика и individual damage value.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['poke'] },
  jetpackcat: { expertTier: 'B', proSignal: 1, notes: 'После переработок ниже релизного пика, но reposition utility ещё полезна.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], mapTags: ['vertical'] },
  juno: { expertTier: 'S', proSignal: 3, notes: 'Speed и AoE sustain держат её в верхушке coordinated meta.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], highRankBias: 0.05 },
  kiriko: { expertTier: 'A', proSignal: 3, notes: 'Suzu остаётся game-saving utility, даже если raw статистика проседает.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], highRankBias: 0.05 },
  lifeweaver: { expertTier: 'C', proSignal: 0, notes: 'Командная ценность слишком зависит от использования союзниками.', sourceIds: ['playerauctions-2026-04-16', 'dexerto-2026-04-15'] },
  lucio: { expertTier: 'S', proSignal: 3, notes: 'Speed boost остаётся ключом для brawl и pro-композиций.', sourceIds: ['pcgamer-2026-04-23', 'dexerto-2026-04-15'], mapTags: ['brawl'], highRankBias: 0.06 },
  mercy: { expertTier: 'A', proSignal: 0, notes: 'Burst heal стал сильнее, но mobility nerf снижает high-rank value.', sourceIds: ['pcgamer-2026-04-23'], mapTags: ['pocket'] },
  mizuki: { expertTier: 'S', proSignal: 1, notes: 'Очень сильная ranked статистика и sustain через damage-to-heal.', sourceIds: ['playerauctions-2026-04-16'] },
  moira: { expertTier: 'C', proSignal: 0, notes: 'Высокие raw numbers, но меньше game-defining utility.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'] },
  wuyang: { expertTier: 'S', proSignal: 3, notes: 'Сильный high-rank/pro support: безопасное лечение и meaningful damage.', sourceIds: ['pcgamer-2026-04-23', 'playerauctions-2026-04-16'], highRankBias: 0.06 },
  zenyatta: { expertTier: 'S', proSignal: 1, notes: 'Discord отлично плавит high-health tanks; статистика подтверждает силу.', sourceIds: ['blizzard-rates', 'playerauctions-2026-04-16'], mapTags: ['poke'] },
};

const MAP_PROFILE: Partial<Record<MetaMap, string[]>> = {
  'antarctic-peninsula': ['brawl', 'vertical'],
  busan: ['brawl', 'poke'],
  ilios: ['brawl', 'vertical'],
  'lijiang-tower': ['brawl'],
  nepal: ['brawl', 'dive'],
  oasis: ['dive', 'vertical'],
  samoa: ['brawl', 'dive'],
  'circuit-royal': ['poke', 'long-range'],
  dorado: ['dive', 'vertical'],
  havana: ['poke', 'long-range'],
  junkertown: ['poke', 'long-range'],
  rialto: ['poke'],
  'route-66': ['poke', 'vertical'],
  'shambali-monastery': ['poke', 'long-range'],
  'watchpoint-gibraltar': ['dive', 'vertical'],
  aatlis: ['brawl', 'dive'],
  'new-junk-city': ['brawl', 'dive'],
  suravasa: ['brawl', 'dive'],
  'blizzard-world': ['poke', 'brawl'],
  eichenwalde: ['brawl'],
  hollywood: ['poke', 'dive'],
  'kings-row': ['brawl'],
  midtown: ['poke', 'brawl'],
  numbani: ['dive', 'vertical'],
  paraiso: ['dive', 'brawl'],
  colosseo: ['poke', 'brawl'],
  esperanca: ['poke', 'dive'],
  'new-queen-street': ['brawl', 'dive'],
  runasapi: ['poke', 'dive'],
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function roundStat(value: number) {
  return Number(value.toFixed(1));
}

function tierFromScore(score: number): Tier {
  if (score >= 0.78) return 'S';
  if (score >= 0.62) return 'A';
  if (score >= 0.46) return 'B';
  if (score >= 0.3) return 'C';
  return 'D';
}

function getWeights(filters: MetaFilters) {
  if (filters.gameMode === 'quick-play') {
    return { stat: 0.7, expert: 0.25, pro: 0.05 };
  }

  if (filters.rankTier === 'master' || filters.rankTier === 'grandmaster') {
    return { stat: 0.35, expert: 0.35, pro: 0.3 };
  }

  if (filters.rankTier === 'diamond') {
    return { stat: 0.42, expert: 0.36, pro: 0.22 };
  }

  return { stat: 0.5, expert: 0.35, pro: 0.15 };
}

function inputAdjustment(input: MetaInput, role: HeroRole, signal: HeroMetaSignal) {
  if (input === 'pc') return 0;
  const tags = signal.mapTags || [];
  if (tags.includes('long-range')) return -0.035;
  if (role === 'Support' && signal.expertTier === 'S') return 0.01;
  if (tags.includes('brawl')) return 0.015;
  return 0;
}

function rankAdjustment(rankTier: MetaRankTier, signal: HeroMetaSignal) {
  if (rankTier === 'all') return 0;
  if (rankTier === 'bronze' || rankTier === 'silver') {
    return signal.proSignal >= 2 ? -0.025 : 0.015;
  }
  if (rankTier === 'master' || rankTier === 'grandmaster') {
    return (signal.highRankBias || 0) + signal.proSignal * 0.015;
  }
  if (rankTier === 'diamond') {
    return (signal.highRankBias || 0) * 0.6 + signal.proSignal * 0.008;
  }
  return 0;
}

function mapAdjustment(map: MetaMap, signal: HeroMetaSignal) {
  if (map === 'all-maps') return 0;
  const profile = MAP_PROFILE[map] || [];
  const tags = signal.mapTags || [];
  const matches = tags.filter((tag) => profile.includes(tag)).length;
  if (matches > 0) return 0.025 * matches;
  if (tags.includes('long-range') && profile.includes('brawl')) return -0.025;
  if (tags.includes('brawl') && profile.includes('long-range')) return -0.02;
  return 0;
}

function regionAdjustment(region: MetaRegion, role: HeroRole, signal: HeroMetaSignal) {
  if (region === 'asia' && signal.proSignal >= 2) return 0.012;
  if (region === 'europe' && (signal.mapTags || []).includes('brawl')) return 0.01;
  if (region === 'americas' && role === 'Damage' && signal.expertTier === 'S') return 0.008;
  return 0;
}

function modeAdjustment(gameMode: MetaGameMode, signal: HeroMetaSignal) {
  if (gameMode === 'competitive') return 0;
  return signal.proSignal >= 2 ? -0.018 : 0.01;
}

export function computeFilteredMeta(
  metaHeroes: HeroMeta[],
  heroRoleById: Map<string, HeroRole>,
  filters: MetaFilters,
): ComputedHeroMeta[] {
  const maxPickRate = Math.max(...metaHeroes.map((entry) => entry.pickRate));
  const weights = getWeights(filters);

  return metaHeroes
    .map((entry) => {
      const role = heroRoleById.get(entry.heroId) || 'Damage';
      const signal = HERO_META_SIGNALS[entry.heroId] || {
        ...DEFAULT_SIGNAL,
        expertTier: entry.tier,
      };
      const modifier =
        inputAdjustment(filters.input, role, signal) +
        rankAdjustment(filters.rankTier, signal) +
        mapAdjustment(filters.map, signal) +
        regionAdjustment(filters.region, role, signal) +
        modeAdjustment(filters.gameMode, signal);

      const adjustedWinRate = roundStat(entry.winRate + modifier * 18);
      const adjustedPickRate = roundStat(Math.max(0.3, entry.pickRate * (1 + modifier * 1.8)));
      const winScore = clamp((adjustedWinRate - 44) / 12);
      const pickScore = clamp(adjustedPickRate / maxPickRate);
      const statScore = clamp(winScore * 0.65 + pickScore * 0.35);
      const expertScore = TIER_SCORE[signal.expertTier];
      const proScore = clamp(signal.proSignal / 3);
      const finalScore = clamp(
        statScore * weights.stat + expertScore * weights.expert + proScore * weights.pro + modifier,
      );
      const tier = tierFromScore(finalScore);
      const dataConfidence: ComputedHeroMeta['dataConfidence'] =
        signal.sourceIds.length >= 3 ? 'high' : signal.sourceIds.length >= 2 ? 'medium' : 'limited';

      return {
        ...entry,
        tier,
        sourceTier: entry.tier,
        pickRate: adjustedPickRate,
        winRate: adjustedWinRate,
        statScore,
        expertScore,
        proScore,
        finalScore,
        signals: signal,
        dataConfidence,
        whyMeta: `${entry.whyMeta} ${signal.notes}`,
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore);
}
