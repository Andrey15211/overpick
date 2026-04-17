'use client';

import { useState, useMemo } from 'react';
import HeroCard from './HeroCard';
import { Hero, HeroRole, ROLE_LABELS } from '@/types/heroes';
import { HeroMeta, Tier } from '@/types/meta';
import '../styles/HeroGrid.css';

interface HeroGridProps {
  heroes: Hero[];
  metaHeroes?: HeroMeta[];
  showTiers?: boolean;
  groupByRole?: boolean;
}

type RoleFilter = 'all' | HeroRole;

const ROLE_ICONS: Record<HeroRole, string> = {
  Tank: '🛡️',
  Damage: '⚔️',
  Support: '💚',
};

export default function HeroGrid({ 
  heroes, 
  metaHeroes,
  showTiers = false,
  groupByRole = false 
}: HeroGridProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const tierByHeroId = useMemo(() => {
    const map = new Map<string, Tier>();

    for (const metaHero of metaHeroes ?? []) {
      map.set(metaHero.heroId, metaHero.tier);
    }

    return map;
  }, [metaHeroes]);

  // Фильтрация героев
  const filteredHeroes = useMemo(() => {
    return heroes.filter(hero => {
      // Фильтр по поиску
      const matchesSearch = search === '' || 
        hero.name.toLowerCase().includes(search.toLowerCase()) ||
        hero.nameRu.toLowerCase().includes(search.toLowerCase());
      
      // Фильтр по роли
      const matchesRole = roleFilter === 'all' || hero.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [heroes, search, roleFilter]);

  // Группировка по ролям
  const groupedHeroes = useMemo(() => {
    if (!groupByRole) return null;
    
    return {
      Tank: filteredHeroes.filter(h => h.role === 'Tank'),
      Damage: filteredHeroes.filter(h => h.role === 'Damage'),
      Support: filteredHeroes.filter(h => h.role === 'Support'),
    };
  }, [filteredHeroes, groupByRole]);

  return (
    <div className="heroGrid">
      {/* Панель управления */}
      <div className="heroGridControls">
        {/* Поиск */}
        <div className="heroGridSearch">
          <span className="heroGridSearchIcon">🔍</span>
          <input
            type="text"
            className="heroGridSearchInput"
            placeholder="Поиск героя..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Фильтры */}
        <div className="heroGridFilters">
          <button
            className={`heroGridFilterBtn ${roleFilter === 'all' ? 'heroGridFilterBtn--active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Все
          </button>
          {(['Tank', 'Damage', 'Support'] as HeroRole[]).map(role => (
            <button
              key={role}
              className={`heroGridFilterBtn heroGridFilterBtn--${role} ${roleFilter === role ? 'heroGridFilterBtn--active' : ''}`}
              onClick={() => setRoleFilter(role)}
            >
              {ROLE_ICONS[role]} {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        {/* Результаты */}
        <div className="heroGridResults">
          Найдено: <span className="heroGridResultsCount">{filteredHeroes.length}</span>
        </div>
      </div>

      {/* Контент */}
      {filteredHeroes.length === 0 ? (
        <div className="heroGridEmpty">
          <div className="heroGridEmptyIcon">🔍</div>
          <div className="heroGridEmptyText">Герои не найдены</div>
        </div>
      ) : groupByRole && groupedHeroes ? (
        // Группированный вид
        <>
          {(['Tank', 'Damage', 'Support'] as HeroRole[]).map(role => {
            const roleHeroes = groupedHeroes[role];
            if (roleHeroes.length === 0) return null;
            
            return (
              <div key={role} className="heroGridGroup">
                <h3 className="heroGridGroupTitle">
                  <span className="heroGridGroupIcon">{ROLE_ICONS[role]}</span>
                  {ROLE_LABELS[role]}
                  <span className="heroGridGroupCount">({roleHeroes.length})</span>
                </h3>
                <div className="heroGridContainer">
                  {roleHeroes.map((hero, idx) => (
                    <div key={hero.id} className="heroGridItem" style={{ animationDelay: `${idx * 0.02}s` }}>
                      <HeroCard 
                        hero={hero} 
                        tier={tierByHeroId.get(hero.id)}
                        showTier={showTiers}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        // Обычная сетка
        <div className="heroGridContainer">
          {filteredHeroes.map((hero, idx) => (
            <div key={hero.id} className="heroGridItem" style={{ animationDelay: `${idx * 0.02}s` }}>
              <HeroCard 
                hero={hero} 
                tier={tierByHeroId.get(hero.id)}
                showTier={showTiers}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
