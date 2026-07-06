// Типы данных для Overwatch героев и контрпиков

export type HeroRole = 'Tank' | 'Damage' | 'Support';

// Подроли, которые используются в новом цикле сезонов Overwatch 2026
export type HeroSubrole = 
  | 'Initiator' | 'Bruiser' | 'Stalwart'  // Танки
  | 'Specialist' | 'Recon' | 'Flanker' | 'Sharpshooter'  // DD
  | 'Medic' | 'Guardian' | 'Tempo' | 'Tactician' | 'Survivor'
  | undefined;

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
  S: 'var(--color-tier-s)',
  A: 'var(--color-tier-a)',
  B: 'var(--color-tier-b)',
  C: 'var(--color-tier-c)',
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
  { value: 5, label: 'Жёсткий контр', color: 'var(--color-tier-s)' },
  { value: 4, label: 'Сильный контр', color: 'var(--color-tier-a)' },
  { value: 3, label: 'Умеренный контр', color: 'var(--color-tier-b)' },
  { value: 2, label: 'Слабый контр', color: 'var(--color-tier-c)' },
  { value: 1, label: 'Минимальный контр', color: 'var(--color-tier-d)' },
];

export const ROLE_LABELS: Record<HeroRole, string> = {
  Tank: 'Танк',
  Damage: 'Урон',
  Support: 'Поддержка',
};

export const ROLE_COLORS: Record<HeroRole, string> = {
  Tank: 'var(--color-role-tank)',
  Damage: 'var(--color-role-damage)',
  Support: 'var(--color-role-support)',
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
  Medic: 'Лекарь',
  Guardian: 'Защитник',
  Tempo: 'Темпо',
  Tactician: 'Тактик',
  Survivor: 'Сейвер',
};

export const SUBROLE_COLORS: Record<string, string> = {
  Initiator: 'var(--color-subrole-initiator)',
  Bruiser: 'var(--color-subrole-bruiser)',
  Stalwart: 'var(--color-subrole-stalwart)',
  Specialist: 'var(--color-subrole-specialist)',
  Recon: 'var(--color-subrole-recon)',
  Flanker: 'var(--color-subrole-flanker)',
  Sharpshooter: 'var(--color-subrole-sharpshooter)',
  Medic: 'var(--color-subrole-medic)',
  Guardian: 'var(--color-subrole-guardian)',
  Tempo: 'var(--color-subrole-tempo)',
  Tactician: 'var(--color-subrole-tactician)',
  Survivor: 'var(--color-subrole-survivor)',
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
