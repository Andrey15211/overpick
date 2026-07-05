import { Metadata } from 'next';
import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import { Hero } from '@/types/heroes';
import { HeroMeta, Tier, TierInfo } from '@/types/meta';
import { formatDateRu } from '@/lib/display';
import styles from './page.module.css';

// Типизация данных
const heroes = heroesData as Hero[];
const meta = metaData as {
  season: number;
  patch: string;
  lastUpdated: string;
  tiers: Record<Tier, TierInfo>;
  heroes: HeroMeta[];
};

export const metadata: Metadata = {
  title: 'Все герои',
  description: `Полный список героев Overwatch 2 с ролями, текущими тирами и переходом к контрпикам. Данные обновлены ${formatDateRu(meta.lastUpdated)}.`,
};

export default function HeroesPage() {
  const lastUpdatedRu = formatDateRu(meta.lastUpdated);
  const roleCounts = heroes.reduce(
    (acc, hero) => {
      acc[hero.role] += 1;
      return acc;
    },
    { Tank: 0, Damage: 0, Support: 0 } as Record<Hero['role'], number>,
  );
  const tierCounts = meta.heroes.reduce(
    (acc, heroMeta) => {
      acc[heroMeta.tier] += 1;
      return acc;
    },
    { S: 0, A: 0, B: 0, C: 0, D: 0 } as Record<Tier, number>,
  );

  return (
    <div className={styles.heroesPage}>
      <div className={styles.heroesContainer}>
        {/* Заголовок */}
        <header className={styles.heroesHeader}>
          <div className={styles.heroesHeaderCopy}>
            <p className={styles.heroesSystemLine}>
              {heroes.length} героев / патч {meta.patch} / {lastUpdatedRu}
            </p>
            <h1 className={styles.heroesTitle}>
              Все <span>Герои</span>
            </h1>
            <p className={styles.heroesSubtitle}>
              Выбери героя для просмотра контрпиков, роли и текущего тира. Сетка синхронизирована с актуальным срезом меты и сразу ведёт в matchup-разбор.
            </p>
          </div>

          <aside className={styles.heroesBrief} aria-label="Сводка по героям">
            <div className={styles.heroesBriefHeader}>
              <span>Hero desk</span>
              <strong>{meta.lastUpdated}</strong>
            </div>
            <div className={styles.heroesBriefStats}>
              <div>
                <span>Танк</span>
                <strong>{roleCounts.Tank}</strong>
              </div>
              <div>
                <span>Урон</span>
                <strong>{roleCounts.Damage}</strong>
              </div>
              <div>
                <span>Поддержка</span>
                <strong>{roleCounts.Support}</strong>
              </div>
            </div>
            <div className={styles.heroesTierStrip}>
              {(['S', 'A', 'B', 'C', 'D'] as Tier[]).map((tier) => (
                <span key={tier} className={styles[`heroesTierStrip--${tier}`]}>
                  {tier} {tierCounts[tier]}
                </span>
              ))}
            </div>
          </aside>
        </header>

        {/* Сетка героев */}
        <section className={styles.heroesRoster} aria-label="Каталог героев">
          <HeroGrid
            heroes={heroes}
            metaHeroes={meta.heroes}
            showTiers={true}
            groupByRole={true}
          />
        </section>
      </div>
    </div>
  );
}
