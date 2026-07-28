'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import patchesData from '@/data/patches.json';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import { Hero } from '@/types/heroes';
import { Patch, ChangeType, CHANGE_TYPE_LABELS } from '@/types/meta';
import { buildHeroById, formatDateRu } from '@/lib/display';
import styles from './page.module.css';

// Типизация
const patches = patchesData as Patch[];
const heroes = heroesData as Hero[];
const meta = metaData as { lastUpdated: string };

type TypeFilter = 'all' | ChangeType;
type PatchChange = Patch['changes'][number];
type IndexedChange = {
  change: PatchChange;
  searchText: string;
};
type IndexedPatch = {
  patch: Patch;
  changes: IndexedChange[];
};

type SubjectKind = 'hero' | 'map' | 'system';
type SubjectGroup = {
  key: string;
  kind: SubjectKind;
  label: string;
  categoryLabel: string;
  hero?: Hero;
  changes: PatchChange[];
};
type AbilityGroup = {
  key: string;
  label: string;
  changes: PatchChange[];
};

const MAP_LABELS: Record<string, string> = {
  'neon-junction': 'Neon Junction',
};

/** Склонение слова по количеству */
function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs >= 11 && abs <= 19) return `${n} ${many}`;
  if (lastDigit === 1) return `${n} ${one}`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function countByType(changes: PatchChange[]) {
  const stats = { buffs: 0, nerfs: 0, reworks: 0, maps: 0, systems: 0 };

  for (const change of changes) {
    if (change.type === 'buff') stats.buffs += 1;
    else if (change.type === 'nerf') stats.nerfs += 1;
    else if (change.type === 'rework') stats.reworks += 1;
    else if (change.type === 'map') stats.maps += 1;
    else if (change.type === 'system') stats.systems += 1;
  }

  return stats;
}

function summarizeTypes(changes: PatchChange[]): string {
  const stats = countByType(changes);
  const labels = [
    stats.buffs > 0 ? pluralize(stats.buffs, 'бафф', 'баффа', 'баффов') : '',
    stats.nerfs > 0 ? pluralize(stats.nerfs, 'нерф', 'нерфа', 'нерфов') : '',
    stats.reworks > 0 ? pluralize(stats.reworks, 'реворк', 'реворка', 'реворков') : '',
    stats.maps > 0 ? pluralize(stats.maps, 'изменение карты', 'изменения карты', 'изменений карты') : '',
    stats.systems > 0 ? pluralize(stats.systems, 'системный пункт', 'системных пункта', 'системных пунктов') : '',
  ].filter(Boolean);

  if (labels.length === 0) return `${changes.length} пунктов`;
  return labels.join(', ');
}

function groupChangesBySubject(changes: PatchChange[], heroById: Map<string, Hero>): SubjectGroup[] {
  const groups = new Map<string, SubjectGroup>();

  for (const change of changes) {
    const kind: SubjectKind = change.heroId ? 'hero' : change.mapId ? 'map' : 'system';
    const key = change.heroId ? `hero:${change.heroId}` : change.mapId ? `map:${change.mapId}` : 'system';
    const hero = change.heroId ? heroById.get(change.heroId) : undefined;
    const label = hero?.nameRu || (change.mapId ? MAP_LABELS[change.mapId] || change.mapId : 'Системные изменения');

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        kind,
        label,
        categoryLabel: kind === 'hero' ? 'Герой' : kind === 'map' ? 'Карта / режим' : 'Система',
        hero,
        changes: [],
      });
    }

    groups.get(key)?.changes.push(change);
  }

  return [...groups.values()];
}

function groupChangesByAbility(changes: PatchChange[]): AbilityGroup[] {
  const groups = new Map<string, AbilityGroup>();

  for (const change of changes) {
    const label = change.ability?.trim() || 'Общие изменения';
    const key = label.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { key, label, changes: [] });
    }
    groups.get(key)?.changes.push(change);
  }

  return [...groups.values()];
}

function getSubjectSummary(subject: SubjectGroup): string {
  if (subject.kind === 'hero') {
    return `${subject.label}: ${summarizeTypes(subject.changes)}. Ниже изменения разложены по способностям и отдельным характеристикам.`;
  }
  if (subject.kind === 'map') {
    return `${subject.label}: ${summarizeTypes(subject.changes)}. Каждый пункт относится к правилам карты или режима.`;
  }
  return `Системный раздел: ${summarizeTypes(subject.changes)}. Пункты собраны по теме, чтобы было понятно, к какой части обновления они относятся.`;
}

export default function PatchesPage() {
  const [heroFilter, setHeroFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Ключ = "patchId:subject:ability:changeIdx" для открытых dev-комментариев
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const heroById = useMemo(() => buildHeroById(heroes), []);
  const lastUpdatedRu = formatDateRu(meta.lastUpdated);

  // Получить героя
  const getHero = useCallback((heroId: string): Hero | undefined => {
    return heroById.get(heroId);
  }, [heroById]);

  // Получить имя героя
  const getHeroName = useCallback((heroId: string): string => {
    return getHero(heroId)?.nameRu || heroId;
  }, [getHero]);

  const getChangeSubject = useCallback((change: Patch['changes'][number]): string => {
    if (change.heroId) return getHeroName(change.heroId);
    return change.mapId || 'Обновление';
  }, [getHeroName]);

  const indexedPatches = useMemo<IndexedPatch[]>(() => {
    return patches.map((patch) => {
      const indexedChanges = patch.changes.map((change) => {
        const subject = getChangeSubject(change);
        const searchText = `${subject} ${change.description} ${change.ability || ''} ${change.values || ''}`.toLowerCase();
        return { change, searchText };
      });

      return {
        patch,
        changes: indexedChanges,
      };
    });
  }, [getChangeSubject]);

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
    const query = searchQuery.trim().toLowerCase();

    return indexedPatches.map(({ patch, changes }) => {
      const filteredChanges = changes.filter(({ change, searchText }) => {
        if (heroFilter !== 'all' && change.heroId !== heroFilter) return false;
        if (typeFilter !== 'all' && change.type !== typeFilter) return false;
        if (query && !searchText.includes(query)) return false;
        return true;
      }).map(({ change }) => change);

      return { ...patch, changes: filteredChanges };
    }).filter((patch) => patch.changes.length > 0);
  }, [heroFilter, typeFilter, searchQuery, indexedPatches]);

  const totalChanges = useMemo(() => {
    return filteredPatches.reduce((acc, patch) => acc + patch.changes.length, 0);
  }, [filteredPatches]);

  return (
    <div className={styles.patchesPage}>
      <div className={styles.patchesContainer}>
        {/* Заголовок */}
        <header className={styles.patchesHeader}>
          <h1 className={styles.patchesTitle}>
            История <span>Патчей</span>
          </h1>
          <p className={styles.patchesSubtitle}>
            Баффы, нерфы, реворки и системные hotfix-обновления Overwatch 2. Страница синхронизирована с Season 3 и актуальным состоянием на {lastUpdatedRu}.
          </p>
        </header>

        {/* Фильтры */}
        <div className={styles.patchesFilters}>
          {/* Поиск */}
          <div className={styles.patchesFilterGroup}>
            <label className={styles.patchesFilterLabel} htmlFor="patch-search">Поиск</label>
            <input
              id="patch-search"
              type="text"
              className={styles.patchesFilterInput}
              placeholder="Герой или описание..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Фильтр по герою */}
          <div className={styles.patchesFilterGroup}>
            <label className={styles.patchesFilterLabel} htmlFor="patch-hero-filter">Герой</label>
            <select
              id="patch-hero-filter"
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
              {(['buff', 'nerf', 'rework', 'map', 'system'] as ChangeType[]).map(type => (
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
                        {stats.maps > 0 && (
                          <span className={`${styles.patchStatBadge} ${styles['patchStatBadge--map']}`}>
                            ▣ {pluralize(stats.maps, 'изменение карты', 'изменения карты', 'изменений карты')}
                          </span>
                        )}
                        {stats.systems > 0 && (
                          <span className={`${styles.patchStatBadge} ${styles['patchStatBadge--system']}`}>
                            ✦ {pluralize(stats.systems, 'обновление', 'обновления', 'обновлений')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Семантическая иерархия: раздел → герой/объект → способность → пункты */}
                    <div className={styles.patchCardChanges}>
                      {groupChangesBySubject(patch.changes, heroById).map((subject, subjectIndex) => {
                        const subjectId = `${patch.patchId}-subject-${subjectIndex}`;
                        return (
                          <section key={subject.key} className={styles.patchSubject} aria-labelledby={`${subjectId}-title`}>
                            <div className={styles.patchSubjectHeader}>
                              <div className={styles.patchSubjectIdentity}>
                                <span className={styles.patchSubjectKicker}>{subject.categoryLabel}</span>
                                <div className={styles.patchSubjectTitleRow}>
                                  {subject.hero?.portrait && (
                                    <Image
                                      src={subject.hero.portrait}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className={styles.changeHeroPortrait}
                                    />
                                  )}
                                  <h3 id={`${subjectId}-title`} className={styles.patchSubjectTitle}>{subject.label}</h3>
                                </div>
                              </div>
                              <div className={styles.patchSubjectTypes} aria-label="Типы изменений">
                                {[...new Set(subject.changes.map((change) => change.type))].map((type) => (
                                  <span key={type} className={`${styles.changeType} ${styles[`changeType--${type}`]}`}>
                                    {CHANGE_TYPE_LABELS[type].icon} {CHANGE_TYPE_LABELS[type].label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className={styles.patchSubjectSummary}>{getSubjectSummary(subject)}</p>

                            <div className={styles.patchAbilityList}>
                              {groupChangesByAbility(subject.changes).map((abilityGroup, abilityIndex) => {
                                const abilityId = `${subjectId}-ability-${abilityIndex}`;
                                return (
                                  <section key={abilityGroup.key} className={styles.patchAbility} aria-labelledby={abilityId}>
                                    <div className={styles.patchAbilityHeader}>
                                      <h4 id={abilityId} className={styles.patchAbilityTitle}>{abilityGroup.label}</h4>
                                      <span className={styles.patchAbilityCount}>{pluralize(abilityGroup.changes.length, 'пункт', 'пункта', 'пунктов')}</span>
                                    </div>
                                    <ul className={styles.patchChangeList}>
                                      {abilityGroup.changes.map((change, idx) => {
                                      const commentKey = `${patch.patchId}:${subject.key}:${abilityGroup.key}:${idx}`;
                                      const isCommentOpen = openComments.has(commentKey);
                                      return (
                                        <li key={`${commentKey}:${change.description}`} className={styles.patchChangeItem}>
                                          <div className={styles.patchChangeTopline}>
                                            <span className={`${styles.changeType} ${styles[`changeType--${change.type}`]}`}>
                                              {CHANGE_TYPE_LABELS[change.type].icon} {CHANGE_TYPE_LABELS[change.type].label}
                                            </span>
                                            {change.values && <span className={styles.changeValues}>{change.values}</span>}
                                            {change.devComment && (
                                              <button
                                                type="button"
                                                className={`${styles.devCommentToggle} ${isCommentOpen ? styles['devCommentToggle--active'] : ''}`}
                                                onClick={() => toggleComment(commentKey)}
                                                aria-expanded={isCommentOpen}
                                                aria-label="Комментарий разработчика"
                                              >
                                                Dev
                                              </button>
                                            )}
                                          </div>
                                          <p className={styles.changeDesc}>{change.description}</p>

                                          {change.devComment && isCommentOpen && (
                                            <div className={`${styles.devCommentSection} ${styles['devCommentSection--open']}`}>
                                              <div className={styles.devCommentInner}>
                                                <div className={styles.devCommentContent}>
                                                  <span className={styles.devCommentLabel}>Разработчик:</span>
                                                  {change.devComment}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      );
                                      })}
                                    </ul>
                                  </section>
                                );
                              })}
                            </div>
                          </section>
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
