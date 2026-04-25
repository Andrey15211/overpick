import Link from 'next/link';
import Image from 'next/image';
import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import { Hero, SUBROLE_LABELS } from '@/types/heroes';
import { HeroMeta, Tier, TierInfo } from '@/types/meta';
import styles from './page.module.css';

// Типизация данных
const heroes = heroesData as Hero[];
const meta = metaData as {
  season: number;
  seasonName: string;
  patch: string;
  lastUpdated: string;
  tiers: Record<Tier, TierInfo>;
  heroes: HeroMeta[];
};

const NEW_HEROES = ['sierra'];

export default function Home() {
  // Топ-герои по ролям
  const topHeroes = meta.heroes.filter(h => h.tier === 'S');
  
  return (
    <main className={styles.main}>
      {/* Hero секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeIcon}>◆</span>
            {meta.seasonName}
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleAccent}>Overpick</span>
            <br />Контрпики Overwatch
          </h1>
          <p className={styles.heroSubtitle}>
            Season 2: Summit, hotfix от 23 апреля 2026. Контрпики, актуальный тир-лист и разбор свежей меты для {heroes.length} героев.
          </p>
          <div className={styles.heroCta}>
            <Link href="/heroes" className={styles.heroCtaPrimary}>
              Найти контрпик
            </Link>
            <Link href="/meta" className={styles.heroCtaSecondary}>
              Тир-лист
            </Link>
          </div>
        </div>
      </section>

      {/* Быстрый выбор героя */}
      <section className={styles.quickPick}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Выбери героя</h2>
          <p className={styles.sectionSubtitle}>
            Выбери героя и сразу посмотри, кем его контрить на текущем патче
          </p>
        </div>
        <HeroGrid 
          heroes={heroes}
          metaHeroes={meta.heroes}
          showTiers={true}
          groupByRole={true}
        />
      </section>

      {/* Топ меты */}
      <section className={styles.topMeta}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Герои высшего тира</h2>
          <Link href="/meta" className={styles.sectionLink}>
            Полный тир-лист →
          </Link>
        </div>
        <div className={styles.topMetaGrid}>
          {topHeroes.slice(0, 9).map((heroMeta, index) => {
            const hero = heroes.find(h => h.id === heroMeta.heroId);
            if (!hero) return null;
            const isNew = NEW_HEROES.includes(hero.id);
            return (
              <Link 
                key={hero.id} 
                href={`/hero/${hero.id}`}
                className={styles.topMetaCard}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className={styles.topMetaAvatar}>
                  <Image
                    src={hero.portrait}
                    alt={hero.nameRu}
                    width={48}
                    height={48}
                    className={styles.topMetaAvatarImg}
                    loading="lazy"
                    unoptimized
                  />
                </div>
                <div className={styles.topMetaInfo}>
                  <span className={styles.topMetaName}>
                    {hero.nameRu}
                    {isNew && <span className="new-badge">НОВОЕ</span>}
                  </span>
                  <span className={styles.topMetaStats}>
                    {heroMeta.winRate}% винрейт
                  </span>
                </div>
                {hero.subrole && (
                  <span className={styles.topMetaSubrole}>
                    {SUBROLE_LABELS[hero.subrole] || hero.subrole}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Статистика */}
      <section className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{heroes.length}</span>
          <span className={styles.statLabel}>Героев</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{meta.seasonName}</span>
          <span className={styles.statLabel}>Актуальная мета</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{meta.lastUpdated}</span>
          <span className={styles.statLabel}>Дата обновления</span>
        </div>
      </section>
    </main>
  );
}
