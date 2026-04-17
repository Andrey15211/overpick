'use client';

import { useState, useMemo } from 'react';
import patchesData from '@/data/patches.json';
import heroesData from '@/data/heroes.json';
import { Hero } from '@/types/heroes';
import { Patch, ChangeType, CHANGE_TYPE_LABELS } from '@/types/meta';
import styles from './page.module.css';

// Типизация
const patches = patchesData as Patch[];
const heroes = heroesData as Hero[];

type TypeFilter = 'all' | ChangeType;

export default function PatchesPage() {
  const [heroFilter, setHeroFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Получить имя героя
  const getHeroName = (heroId: string): string => {
    const hero = heroes.find(h => h.id === heroId);
    return hero?.nameRu || heroId;
  };

  // Фильтрация патчей
  const filteredPatches = useMemo(() => {
    return patches.map(patch => {
      const filteredChanges = patch.changes.filter(change => {
        // Фильтр по герою
        if (heroFilter !== 'all' && change.heroId !== heroFilter) return false;
        
        // Фильтр по типу
        if (typeFilter !== 'all' && change.type !== typeFilter) return false;
        
        // Поиск
        if (searchQuery) {
          const heroName = getHeroName(change.heroId).toLowerCase();
          const desc = change.description.toLowerCase();
          const query = searchQuery.toLowerCase();
          if (!heroName.includes(query) && !desc.includes(query)) return false;
        }
        
        return true;
      });
      
      return { ...patch, changes: filteredChanges };
    }).filter(patch => patch.changes.length > 0);
  }, [heroFilter, typeFilter, searchQuery]);

  // Подсчёт изменений
  const totalChanges = filteredPatches.reduce((acc, p) => acc + p.changes.length, 0);

  return (
    <div className={styles.patchesPage}>
      <div className={styles.patchesContainer}>
        {/* Заголовок */}
        <header className={styles.patchesHeader}>
          <h1 className={styles.patchesTitle}>
            История <span>Патчей</span>
          </h1>
          <p className={styles.patchesSubtitle}>
            Баффы, нерфы и реворки героев Overwatch 2, включая Season 2: Summit
          </p>
        </header>

        {/* Фильтры */}
        <div className={styles.patchesFilters}>
          {/* Поиск */}
          <div className={styles.patchesFilterGroup}>
            <label className={styles.patchesFilterLabel}>Поиск</label>
            <input
              type="text"
              className={styles.patchesFilterInput}
              placeholder="Герой или описание..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Фильтр по герою */}
          <div className={styles.patchesFilterGroup}>
            <label className={styles.patchesFilterLabel}>Герой</label>
            <select
              className={styles.patchesFilterSelect}
              value={heroFilter}
              onChange={(e) => setHeroFilter(e.target.value)}
            >
              <option value="all">Все герои</option>
              {heroes.map(hero => (
                <option key={hero.id} value={hero.id}>{hero.nameRu}</option>
              ))}
            </select>
          </div>

          {/* Фильтр по типу */}
          <div className={styles.patchesFilterGroup}>
            <label className={styles.patchesFilterLabel}>Тип изменения</label>
            <div className={styles.patchesFilterBtns}>
              <button
                className={`${styles.patchesFilterBtn} ${typeFilter === 'all' ? styles['patchesFilterBtn--active'] : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                Все
              </button>
              {(['buff', 'nerf', 'rework'] as ChangeType[]).map(type => (
                <button
                  key={type}
                  className={`${styles.patchesFilterBtn} ${styles[`patchesFilterBtn--${type}`]} ${typeFilter === type ? styles['patchesFilterBtn--active'] : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {CHANGE_TYPE_LABELS[type].icon} {CHANGE_TYPE_LABELS[type].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Результаты */}
        <div className={styles.patchesResults}>
          Найдено: <span className={styles.patchesResultsCount}>{totalChanges}</span> изменений в {filteredPatches.length} патчах
        </div>

        {/* Список патчей */}
        {filteredPatches.length === 0 ? (
          <div className={styles.patchesEmpty}>
            <div className={styles.patchesEmptyIcon}>📋</div>
            <p>Изменения не найдены</p>
          </div>
        ) : (
          <div className={styles.patchesList}>
            {filteredPatches.map(patch => (
              <div key={patch.patchId} className={styles.patchCard}>
                <div className={styles.patchCardHeader}>
                  <h2 className={styles.patchCardTitle}>{patch.title}</h2>
                  <div className={styles.patchCardMeta}>
                    <span className={styles.patchCardVersion}>v{patch.version}</span>
                    <span className={styles.patchCardDate}>{patch.date}</span>
                  </div>
                </div>
                <div className={styles.patchCardChanges}>
                  {patch.changes.map((change, idx) => (
                    <div key={idx} className={styles.changeItem}>
                      <span className={`${styles.changeType} ${styles[`changeType--${change.type}`]}`}>
                        {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].icon} {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].label}
                      </span>
                      <span className={styles.changeHero}>{getHeroName(change.heroId)}</span>
                      <span className={styles.changeDesc}>{change.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
