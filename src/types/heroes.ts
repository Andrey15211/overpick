// Типы данных для Overwatch героев и контрпиков

export type HeroRole = 'Tank' | 'Damage' | 'Support';

// Подроли, которые используются в новом цикле сезонов Overwatch 2026
export type HeroSubrole = 
  | 'Initiator' | 'Bruiser' | 'Stalwart'  // Танки
  | 'Specialist' | 'Recon' | 'Flanker' | 'Sharpshooter'  // DD
  | undefined;  // Саппорты (пока без подролей)

export interface Hero {
  id: string;
  name: string;
  nameRu: string;
  role: HeroRole;
  subrole?: string;
  portrait: string;
}

export type CounterTier = 'S' | 'A' | 'B' | 'C';

export interface CounterInfo {
  heroId: string;
  effectiveness: 1 | 2 | 3 | 4 | 5;
  tier: CounterTier;
  counterRole: HeroRole;
  reason: string;
}

export const TIER_LABELS: Record<CounterTier, string> = {
  S: 'Жёсткий контр',
  A: 'Сильный контр',
  B: 'Умеренный контр',
  C: 'Ситуативный контр',
};

export const TIER_COLORS: Record<CounterTier, string> = {
  S: '#ff4444',
  A: '#ff8844',
  B: '#ffcc44',
  C: '#888888',
};

export interface HeroCounters {
  heroId: string;
  counters: CounterInfo[];
}

// Хелпер-типы для UI
export interface HeroWithCounters extends Hero {
  counters: CounterInfo[];
}

export type EffectivenessLevel = {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
};

export const EFFECTIVENESS_LEVELS: EffectivenessLevel[] = [
  { value: 5, label: 'Жёсткий контр', color: '#ff4444' },
  { value: 4, label: 'Сильный контр', color: '#ff8844' },
  { value: 3, label: 'Умеренный контр', color: '#ffcc44' },
  { value: 2, label: 'Слабый контр', color: '#88cc44' },
  { value: 1, label: 'Минимальный контр', color: '#44aa44' },
];

export const ROLE_LABELS: Record<HeroRole, string> = {
  Tank: 'Танк',
  Damage: 'Урон',
  Support: 'Поддержка',
};

export const ROLE_COLORS: Record<HeroRole, string> = {
  Tank: '#F0B429',
  Damage: '#E74C3C',
  Support: '#27AE60',
};

// Подроли и их описания
export const SUBROLE_LABELS: Record<string, string> = {
  Initiator: 'Инициатор',
  Bruiser: 'Бруйзер',
  Stalwart: 'Стойкий',
  Specialist: 'Специалист',
  Recon: 'Разведчик',
  Flanker: 'Фланкер',
  Sharpshooter: 'Стрелок',
};

export const SUBROLE_COLORS: Record<string, string> = {
  Initiator: '#00BFFF',
  Bruiser: '#FF6B35',
  Stalwart: '#9B59B6',
  Specialist: '#27AE60',
  Recon: '#3498DB',
  Flanker: '#E74C3C',
  Sharpshooter: '#F39C12',
};

// Типы для синергий
export interface Synergy {
  partnerId: string;
  name: string;
  effectiveness: 1 | 2 | 3 | 4 | 5;
  reason: string;
  source: string;
}

export type HeroSynergies = Record<string, Synergy[]>;
