'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import patchesData from '@/data/patches.json';
import heroesData from '@/data/heroes.json';
import { Hero } from '@/types/heroes';
import { Patch, ChangeType, CHANGE_TYPE_LABELS } from '@/types/meta';
import styles from './page.module.css';

// Типизация
const patches = patchesData as Patch[];
const heroes = heroesData as Hero[];

type TypeFilter = 'all' | ChangeType;

/** Русские названия месяцев в родительном падеже */
const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const;

/** Форматирование даты: "DD MMMM YYYY" по-русски */
function formatDateRu(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yearStr, monthStr, dayStr] = parts;
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  const day = parseInt(dayStr, 10);
  return `${day} ${MONTHS_RU[monthIdx]} ${yearStr}`;
}

/** Склонение слова по количеству */
function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs >= 11 && abs <= 19) return `${n} ${many}`;
  if (lastDigit === 1) return `${n} ${one}`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

export default function PatchesPage() {
  const [heroFilter, setHeroFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Ключ = "patchId:changeIdx" для открытых dev-комментариев
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  // Получить героя
  const getHero = useCallback((heroId: string): Hero | undefined => {
    return heroes.find(h => h.id === heroId);
  }, []);

  // Получить имя героя
  const getHeroName = useCallback((heroId: string): string => {
    return getHero(heroId)?.nameRu || heroId;
  }, [getHero]);

  const getChangeSubject = useCallback((change: Patch['changes'][number]): string => {
    if (change.heroId) return getHeroName(change.heroId);
    return change.mapId || 'Обновление';
  }, [getHeroName]);

  // Переключить видимость dev-комментария
  const toggleComment = useCallback((key: string) => {
    setOpenComments(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

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
          const query = searchQuery.toLowerCase();
          const subject = change.heroId ? getHeroName(change.heroId) : change.mapId || '';
          const desc = change.description.toLowerCase();
          if (!subject.toLowerCase().includes(query) && !desc.includes(query)) return false;
        }
        
        return true;
      });
      
      return { ...patch, changes: filteredChanges };
    }).filter(patch => patch.changes.length > 0);
  }, [heroFilter, typeFilter, searchQuery, getHeroName]);

  // Подсчёт изменений
  const totalChanges = filteredPatches.reduce((acc, p) => acc + p.changes.length, 0);

  /** Подсчитать баффы/нерфы/реворки в списке изменений */
  const countByType = (changes: Patch['changes']) => {
    let buffs = 0, nerfs = 0, reworks = 0, maps = 0;
    for (const c of changes) {
      if (c.type === 'buff') buffs++;
      else if (c.type === 'nerf') nerfs++;
      else if (c.type === 'rework') reworks++;
      else if (c.type === 'map') maps++;
    }
    return { buffs, nerfs, reworks, maps };
  };

  return (
    <div className={styles.patchesPage}>
      <div className={styles.patchesContainer}>
        {/* Заголовок */}
        <header className={styles.patchesHeader}>
          <h1 className={styles.patchesTitle}>
            История <span>Патчей</span>
          </h1>
          <p className={styles.patchesSubtitle}>
            Баффы, нерфы и реворки героев Overwatch 2. Страница синхронизирована с Season 3 и актуальным состоянием на 1 июля 2026 года.
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
            {filteredPatches.map(patch => {
              const stats = countByType(patch.changes);
              const patchSummary = (patch as Patch & { summary?: string }).summary;
              return (
                <div key={patch.patchId} className={styles.patchTimelineItem}>
                  {/* Точка на таймлайне */}
                  <div className={styles.patchTimelineDot} />

                  <div className={styles.patchCard}>
                    {/* Заголовок патча */}
                    <div className={styles.patchCardHeader}>
                      <div className={styles.patchCardHeaderTop}>
                        <h2 className={styles.patchCardTitle}>{patch.title}</h2>
                        <div className={styles.patchCardMeta}>
                          <span className={styles.patchCardVersion}>v{patch.version}</span>
                          <span className={styles.patchCardDate}>{formatDateRu(patch.date)}</span>
                        </div>
                      </div>

                      {/* Краткое описание */}
                      {patchSummary && (
                        <p className={styles.patchCardSummary}>{patchSummary}</p>
                      )}

                      {/* Значки статистики */}
                      <div className={styles.patchCardStats}>
                        {stats.buffs > 0 && (
                          <span className={`${styles.patchStatBadge} ${styles['patchStatBadge--buff']}`}>
                            ↑ {pluralize(stats.buffs, 'бафф', 'баффа', 'баффов')}
                          </span>
                        )}
                        {stats.nerfs > 0 && (
                          <span className={`${styles.patchStatBadge} ${styles['patchStatBadge--nerf']}`}>
                            ↓ {pluralize(stats.nerfs, 'нерф', 'нерфа', 'нерфов')}
                          </span>
                        )}
                        {stats.reworks > 0 && (
                          <span className={`${styles.patchStatBadge} ${styles['patchStatBadge--rework']}`}>
                            ⟳ {pluralize(stats.reworks, 'реворк', 'реворка', 'реворков')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Список изменений */}
                    <div className={styles.patchCardChanges}>
                      {patch.changes.map((change, idx) => {
                        const hero = change.heroId ? getHero(change.heroId) : undefined;
                        const commentKey = `${patch.patchId}:${idx}`;
                        const isCommentOpen = openComments.has(commentKey);

                        return (
                          <div key={idx} className={styles.changeItem}>
                            {/* Основная строка */}
                            <div className={styles.changeItemMain}>
                              {/* Тип изменения */}
                              <span className={`${styles.changeType} ${styles[`changeType--${change.type}`]}`}>
                                {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].icon}{' '}
                                {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].label}
                              </span>

                              {/* Герой с портретом */}
                              <div className={styles.changeHeroBlock}>
                                {hero?.portrait && (
                                  <Image
                                    src={hero.portrait}
                                    alt={hero.nameRu}
                                    width={24}
                                    height={24}
                                    className={styles.changeHeroPortrait}
                                    unoptimized
                                  />
                                )}
                                <span className={styles.changeHero}>{getChangeSubject(change)}</span>
                              </div>

                              {/* Контент: описание + бейджи */}
                              <div className={styles.changeContent}>
                                <span className={styles.changeDesc}>{change.description}</span>

                                {/* Бейдж способности */}
                                {change.ability && (
                                  <span className={styles.changeAbility}>{change.ability}</span>
                                )}

                                {/* Бейдж значений */}
                                {change.values && (
                                  <span className={styles.changeValues}>{change.values}</span>
                                )}

                                {/* Кнопка комментария */}
                                {change.devComment && (
                                  <button
                                    className={`${styles.devCommentToggle} ${isCommentOpen ? styles['devCommentToggle--active'] : ''}`}
                                    onClick={() => toggleComment(commentKey)}
                                    aria-expanded={isCommentOpen}
                                    aria-label="Комментарий разработчика"
                                  >
                                    💬
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Раскрываемый комментарий разработчика */}
                            {change.devComment && (
                              <div className={`${styles.devCommentSection} ${isCommentOpen ? styles['devCommentSection--open'] : ''}`}>
                                <div className={styles.devCommentInner}>
                                  <div className={styles.devCommentContent}>
                                    <span className={styles.devCommentLabel}>Разработчик:</span>
                                    {change.devComment}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
