// Типы данных для меты и патчей

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export type MetaInput = 'pc' | 'console';
export type MetaGameMode = 'quick-play' | 'competitive';
export type MetaRankTier =
  | 'all'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster';
export type MetaRegion = 'americas' | 'asia' | 'europe';
export type MetaMap =
  | 'all-maps'
  | 'antarctic-peninsula'
  | 'busan'
  | 'ilios'
  | 'lijiang-tower'
  | 'nepal'
  | 'oasis'
  | 'samoa'
  | 'circuit-royal'
  | 'dorado'
  | 'havana'
  | 'junkertown'
  | 'rialto'
  | 'route-66'
  | 'shambali-monastery'
  | 'watchpoint-gibraltar'
  | 'aatlis'
  | 'new-junk-city'
  | 'suravasa'
  | 'blizzard-world'
  | 'eichenwalde'
  | 'hollywood'
  | 'kings-row'
  | 'midtown'
  | 'numbani'
  | 'paraiso'
  | 'colosseo'
  | 'esperanca'
  | 'new-queen-street'
  | 'runasapi';

export interface TierInfo {
  label: string;
  description: string;
  color: string;
}

export interface HeroMeta {
  heroId: string;
  tier: Tier;
  pickRate: number;
  winRate: number;
  whyMeta: string;
}

export interface MetaFilters {
  input: MetaInput;
  gameMode: MetaGameMode;
  rankTier: MetaRankTier;
  map: MetaMap;
  region: MetaRegion;
}

export interface HeroMetaSignal {
  expertTier: Tier;
  proSignal: 0 | 1 | 2 | 3;
  notes: string;
  sourceIds: string[];
  mapTags?: string[];
  highRankBias?: number;
}

export interface ComputedHeroMeta extends HeroMeta {
  statScore: number;
  expertScore: number;
  proScore: number;
  finalScore: number;
  sourceTier: Tier;
  signals: HeroMetaSignal;
  dataConfidence: 'high' | 'medium' | 'limited';
}

export interface MetaData {
  season: number;
  seasonName?: string;
  patch: string;
  lastUpdated: string;
  metaDescription?: string;
  sources?: string[];
  tiers: Record<Tier, TierInfo>;
  heroes: HeroMeta[];
}

export type ChangeType = 'buff' | 'nerf' | 'rework';

export interface PatchChange {
  heroId: string;
  type: ChangeType;
  description: string;
}

export interface Patch {
  patchId: string;
  date: string;
  version: string;
  title: string;
  changes: PatchChange[];
}

// Константы для UI
export const TIER_ORDER: Tier[] = ['S', 'A', 'B', 'C', 'D'];

export const CHANGE_TYPE_LABELS: Record<ChangeType, { label: string; color: string; icon: string }> = {
  buff: { label: 'Бафф', color: '#27AE60', icon: '↑' },
  nerf: { label: 'Нерф', color: '#E74C3C', icon: '↓' },
  rework: { label: 'Реворк', color: '#9B59B6', icon: '⟳' },
};
