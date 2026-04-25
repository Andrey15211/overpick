'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ComputedHeroMeta, HeroMeta, MetaFilters, Tier, TIER_ORDER } from '@/types/meta';
import { Hero, HeroRole, ROLE_LABELS } from '@/types/heroes';
import {
  GAME_MODE_OPTIONS,
  INPUT_OPTIONS,
  MAP_GROUPS,
  META_SOURCE_NOTES,
  REGION_OPTIONS,
  RANK_TIER_OPTIONS,
  computeFilteredMeta,
} from '@/data/metaFilters';
import '../styles/TierList.css';

interface TierListProps {
  metaHeroes: HeroMeta[];
  heroes: Hero[];
}

type RoleFilter = 'all' | HeroRole;

export default function TierList({ metaHeroes, heroes }: TierListProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedHero, setSelectedHero] = useState<ComputedHeroMeta | null>(null);
  const [filters, setFilters] = useState<MetaFilters>({
    input: 'pc',
    gameMode: 'competitive',
    rankTier: 'all',
    map: 'all-maps',
    region: 'europe',
  });

  const heroRoleById = useMemo(() => {
    return new Map(heroes.map((hero) => [hero.id, hero.role]));
  }, [heroes]);

  // Получить информацию о герое по ID
  const getHeroInfo = (heroId: string): Hero | undefined => {
    return heroes.find(h => h.id === heroId);
  };

  const computedHeroes = useMemo(() => {
    return computeFilteredMeta(metaHeroes, heroRoleById, filters);
  }, [filters, heroRoleById, metaHeroes]);

  // Фильтрация героев по роли
  const filteredHeroes = roleFilter === 'all'
    ? computedHeroes
    : computedHeroes.filter(mh => {
        const hero = getHeroInfo(mh.heroId);
        return hero?.role === roleFilter;
      });

  // Группировка героев по тирам
  const heroesByTier = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = filteredHeroes.filter(h => h.tier === tier);
    return acc;
  }, {} as Record<Tier, ComputedHeroMeta[]>);

  const activeMode = GAME_MODE_OPTIONS.find((option) => option.value === filters.gameMode)?.label;
  const activeRank = RANK_TIER_OPTIONS.find((option) => option.value === filters.rankTier)?.label;
  const activeInput = INPUT_OPTIONS.find((option) => option.value === filters.input)?.label;
  const activeRegion = REGION_OPTIONS.find((option) => option.value === filters.region)?.label;
  const activeMap = MAP_GROUPS
    .flatMap((group) => group.options)
    .find((option) => option.value === filters.map)?.label;

  const setFilter = <K extends keyof MetaFilters>(key: K, value: MetaFilters[K]) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === 'gameMode' && value === 'quick-play') {
        next.rankTier = 'all';
      }
      return next;
    });
  };

  // Иконка роли
  const getRoleIcon = (role: HeroRole): string => {
    switch (role) {
      case 'Tank': return '🛡️';
      case 'Damage': return '⚔️';
      case 'Support': return '💚';
    }
  };

  return (
    <div className="tierList">
      <div className="tierControlPanel" aria-label="Фильтры тир-листа">
        <div className="tierControlGrid">
          <label className="tierSelectField">
            <span className="tierSelectLabel">Role</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="tierSelect"
            >
              <option value="all">All Roles</option>
              {(['Tank', 'Damage', 'Support'] as HeroRole[]).map(role => (
                <option key={role} value={role}>
                  {getRoleIcon(role)} {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="tierSelectField">
            <span className="tierSelectLabel">Input</span>
            <select
              value={filters.input}
              onChange={(event) => setFilter('input', event.target.value as MetaFilters['input'])}
              className="tierSelect"
            >
              {INPUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="tierSelectField">
            <span className="tierSelectLabel">Game Mode</span>
            <select
              value={filters.gameMode}
              onChange={(event) => setFilter('gameMode', event.target.value as MetaFilters['gameMode'])}
              className="tierSelect"
            >
              {GAME_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {filters.gameMode === 'competitive' && (
            <label className="tierSelectField">
              <span className="tierSelectLabel">Tier</span>
              <select
                value={filters.rankTier}
                onChange={(event) => setFilter('rankTier', event.target.value as MetaFilters['rankTier'])}
                className="tierSelect"
              >
                {RANK_TIER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}

          <label className="tierSelectField">
            <span className="tierSelectLabel">Map</span>
            <select
              value={filters.map}
              onChange={(event) => setFilter('map', event.target.value as MetaFilters['map'])}
              className="tierSelect"
            >
              {MAP_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="tierSelectField">
            <span className="tierSelectLabel">Region</span>
            <select
              value={filters.region}
              onChange={(event) => setFilter('region', event.target.value as MetaFilters['region'])}
              className="tierSelect"
            >
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="tierActiveSlice">
          <span>Срез: {activeInput}</span>
          <span>{activeMode}</span>
          {filters.gameMode === 'competitive' && <span>{activeRank}</span>}
          <span>{activeMap}</span>
          <span>{activeRegion}</span>
        </div>

        <details className="tierMethodology">
          <summary>Статистика + экспертная мета + pro-сигналы</summary>
          <div className="tierMethodologyBody">
            {META_SOURCE_NOTES.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <strong>{source.label}</strong>
                <span>{source.weight}</span>
              </a>
            ))}
          </div>
        </details>
      </div>

      {/* Тир-ряды */}
      {TIER_ORDER.map(tier => {
        const heroesInTier = heroesByTier[tier];
        if (heroesInTier.length === 0) return null;
        
        return (
          <div key={tier} className="tierRow">
            <div className={`tierLabel tierLabel--${tier}`}>
              {tier}
            </div>
            <div className="tierHeroes">
              {heroesInTier.map(metaHero => {
                const hero = getHeroInfo(metaHero.heroId);
                if (!hero) return null;
                
                return (
                  <Link 
                    key={metaHero.heroId} 
                    href={`/hero/${hero.id}`}
                    className="tierHeroCard"
                    onMouseEnter={() => setSelectedHero(metaHero)}
                    onMouseLeave={() => setSelectedHero(null)}
                    aria-label={`${hero.nameRu} — ${metaHero.tier} тир`}
                  >
                    <div className={`tierHeroAvatar tierHeroAvatar--${hero.role}`}>
                      <Image
                        src={hero.portrait}
                        alt={hero.nameRu}
                        width={56}
                        height={56}
                        className="tierHeroAvatarImg"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                    <span className="tierHeroName">{hero.nameRu}</span>
                    <div className="tierHeroStats">
                      <span className="tierHeroStat tierHeroStat--pick">
                        {metaHero.pickRate}%
                      </span>
                      <span className="tierHeroStat tierHeroStat--win">
                        {metaHero.winRate}%
                      </span>
                    </div>
                    <span className="tierHeroScore">
                      score {Math.round(metaHero.finalScore * 100)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Тултип при наведении */}
      {selectedHero && (
        <div className="tierTooltip" role="tooltip">
          <div className="tierTooltipTitle">
            {getHeroInfo(selectedHero.heroId)?.nameRu}
          </div>
          <div className="tierTooltipMeta">
            <strong>Почему в мете:</strong><br />
            {selectedHero.whyMeta}
            <br /><br />
            <strong>Частота выбора:</strong> {selectedHero.pickRate}%<br />
            <strong>Винрейт:</strong> {selectedHero.winRate}%<br />
            <strong>Исходный тир:</strong> {selectedHero.sourceTier}<br />
            <strong>Сигнал источников:</strong> {selectedHero.dataConfidence === 'high' ? 'высокий' : selectedHero.dataConfidence === 'medium' ? 'средний' : 'ограниченный'}
          </div>
          <div className="tierTooltipHint">Нажмите для контрпиков</div>
        </div>
      )}
    </div>
  );
}
