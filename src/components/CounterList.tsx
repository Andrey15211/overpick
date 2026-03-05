'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CounterInfo, Hero, HeroRole, ROLE_LABELS } from '@/types/heroes';
import '../styles/CounterList.css';

interface CounterListProps {
  counters: CounterInfo[];
  heroes: Hero[];
  title?: string;
}

type SortOrder = 'effectiveness' | 'name';

export default function CounterList({ counters, heroes, title = 'Контрпики' }: CounterListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('effectiveness');
  const [activeRole, setActiveRole] = useState<HeroRole | 'All'>('All');

  const heroesById = useMemo(() => {
    const map = new Map<string, Hero>();
    for (const hero of heroes) {
      map.set(hero.id, hero);
    }
    return map;
  }, [heroes]);

  // Получить информацию о герое
  const getHero = (heroId: string): Hero | undefined => {
    return heroesById.get(heroId);
  };

  // Фильтрация и сортировка контрпиков
  const filteredCounters = useMemo(() => {
    let result = [...counters];

    // Фильтр по роли
    if (activeRole !== 'All') {
      result = result.filter(c => c.counterRole === activeRole);
    }
    
    // Сортировка
    if (sortOrder === 'effectiveness') {
      // Сортировка по эффективности (S > A > B > C) и затем по effectiveness (числу)
      const tierOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
      
      result.sort((a, b) => {
        // Если есть tier, используем его приоритет
        if (a.tier && b.tier && a.tier !== b.tier) {
          return tierOrder[b.tier] - tierOrder[a.tier];
        }
        // Иначе по number value
        return b.effectiveness - a.effectiveness;
      });
    } else {
      result.sort((a, b) => {
        const heroA = heroesById.get(a.heroId);
        const heroB = heroesById.get(b.heroId);
        return (heroA?.nameRu || '').localeCompare(heroB?.nameRu || '', 'ru');
      });
    }
    
    return result;
  }, [counters, sortOrder, activeRole, heroesById]);

  // Рендер шкалы эффективности (звезды)
  const renderEffectiveness = (effectiveness: number) => {
    return (
      <div className="counterItemEffectiveness" aria-label={`Эффективность: ${effectiveness} из 5`}>
        {[1, 2, 3, 4, 5].map(star => (
          <div 
            key={star}
            className={`counterItemStar counterItemStar--${effectiveness} ${star <= effectiveness ? 'counterItemStar--filled' : ''}`}
          />
        ))}
      </div>
    );
  };

  if (counters.length === 0) {
    return (
      <div className="counterListEmpty">
        Контрпики не найдены
      </div>
    );
  }

  return (
    <div className="counterList">
      {/* Заголовок и сортировка */}
      {title && (
        <div className="counterListHeader">
          <h3 className="counterListTitle">{title}</h3>
          <div className="counterListSort" role="group" aria-label="Сортировка">
            <button
              className={`counterListSortBtn ${sortOrder === 'effectiveness' ? 'counterListSortBtn--active' : ''}`}
              onClick={() => setSortOrder('effectiveness')}
              aria-pressed={sortOrder === 'effectiveness'}
            >
              По силе
            </button>
            <button
              className={`counterListSortBtn ${sortOrder === 'name' ? 'counterListSortBtn--active' : ''}`}
              onClick={() => setSortOrder('name')}
              aria-pressed={sortOrder === 'name'}
            >
              По имени
            </button>
          </div>
        </div>
      )}

      {/* Фильтр по ролям */}
      <div className="counterListTabs" role="tablist">
        {(['All', 'Tank', 'Damage', 'Support'] as const).map((role) => (
          <button
            key={role}
            className={`counterListTab ${activeRole === role ? 'counterListTab--active' : ''}`}
            onClick={() => setActiveRole(role)}
            role="tab"
            aria-selected={activeRole === role}
            aria-controls={`panel-${role}`}
          >
            {role === 'All' ? 'Все' : ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {/* Список контрпиков */}
      {filteredCounters.length > 0 ? (
        filteredCounters.map((counter) => {
          const hero = getHero(counter.heroId);
          if (!hero) return null;
          
          return (
            <Link 
              key={counter.heroId} 
              href={`/hero/${hero.id}`}
              className="counterItem"
              aria-label={`${hero.nameRu} - Тир ${counter.tier || '?'} (${counter.effectiveness} из 5)`}
            >
              <div className={`counterItemTier counterItemTier--${counter.tier || 'C'}`}>
                {counter.tier || '?'}
              </div>
              
              <div className={`counterItemAvatar counterItemAvatar--${hero.role}`}>
                <Image
                  src={hero.portrait}
                  alt={hero.nameRu}
                  width={48}
                  height={48}
                  className="counterItemAvatarImg"
                  loading="lazy"
                  unoptimized
                />
              </div>
              
              <div className="counterItemInfo">
                <div className="counterItemName">{hero.nameRu}</div>
                <div className="counterItemRole">{ROLE_LABELS[hero.role]}</div>
              </div>
              
              <div className="counterItemReason">
                {counter.reason}
              </div>
              
              {renderEffectiveness(counter.effectiveness)}
            </Link>
          );
        })
      ) : (
        <div className="counterListEmpty">
          Нет героев в этой категории
        </div>
      )}
    </div>
  );
}
