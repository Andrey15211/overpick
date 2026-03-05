'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeroMeta, Tier, TIER_ORDER } from '@/types/meta';
import { Hero, HeroRole, ROLE_LABELS } from '@/types/heroes';
import '../styles/TierList.css';

interface TierListProps {
  metaHeroes: HeroMeta[];
  heroes: Hero[];
}

type RoleFilter = 'all' | HeroRole;

export default function TierList({ metaHeroes, heroes }: TierListProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedHero, setSelectedHero] = useState<HeroMeta | null>(null);

  // Получить информацию о герое по ID
  const getHeroInfo = (heroId: string): Hero | undefined => {
    return heroes.find(h => h.id === heroId);
  };

  // Фильтрация героев по роли
  const filteredHeroes = roleFilter === 'all' 
    ? metaHeroes 
    : metaHeroes.filter(mh => {
        const hero = getHeroInfo(mh.heroId);
        return hero?.role === roleFilter;
      });

  // Группировка героев по тирам
  const heroesByTier = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = filteredHeroes.filter(h => h.tier === tier);
    return acc;
  }, {} as Record<Tier, HeroMeta[]>);

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
      {/* Фильтры по ролям */}
      <div className="tierFilters" role="group" aria-label="Фильтр по ролям">
        <button 
          className={`tierFilterBtn ${roleFilter === 'all' ? 'tierFilterBtn--active' : ''}`}
          onClick={() => setRoleFilter('all')}
          aria-pressed={roleFilter === 'all'}
        >
          Все роли
        </button>
        {(['Tank', 'Damage', 'Support'] as HeroRole[]).map(role => (
          <button 
            key={role}
            className={`tierFilterBtn ${roleFilter === role ? 'tierFilterBtn--active' : ''}`}
            onClick={() => setRoleFilter(role)}
            aria-pressed={roleFilter === role}
          >
            {getRoleIcon(role)} {ROLE_LABELS[role]}
          </button>
        ))}
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
                    aria-label={`${hero.nameRu} - ${metaHero.tier}-Tier`}
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
            <strong>Pick Rate:</strong> {selectedHero.pickRate}%<br />
            <strong>Win Rate:</strong> {selectedHero.winRate}%
          </div>
          <div className="tierTooltipHint">Нажмите для контрпиков</div>
        </div>
      )}
    </div>
  );
}
