import Link from 'next/link';
import Image from 'next/image';
import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import patchesData from '@/data/patches.json';
import { Hero, SUBROLE_LABELS } from '@/types/heroes';
import { HeroMeta, Patch, Tier, TierInfo } from '@/types/meta';
import { buildHeroById, formatDateRu } from '@/lib/display';
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
const patches = patchesData as Patch[];

const NEW_HEROES = ['sierra'];

export default function Home() {
  const heroById = buildHeroById(heroes);
  const lastUpdatedRu = formatDateRu(meta.lastUpdated);
  const topHeroes = meta.heroes.filter((heroMeta) => heroMeta.tier === 'S');
  const topPerformer = [...meta.heroes].sort((left, right) => right.winRate - left.winRate)[0];
  const topPerformerHero = topPerformer ? heroById.get(topPerformer.heroId) : undefined;
  const latestPatch = patches[0];
  const roleCounts = heroes.reduce(
    (acc, hero) => {
      acc[hero.role] += 1;
      return acc;
    },
    { Tank: 0, Damage: 0, Support: 0 } as Record<Hero['role'], number>,
  );
  
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroShell}>
          <div className={styles.heroCopy}>
            <p className={styles.heroSystemLine}>
              {meta.seasonName} / патч {meta.patch} / обновлено {lastUpdatedRu}
            </p>
            <h1 className={styles.heroTitle}>
              Контрпик за раунд
            </h1>
            <p className={styles.heroSubtitle}>
              Быстрый выбор героя, текущий тир и свежие сигналы Blizzard Hero Statistics без ручного пересчёта после каждого патча.
            </p>
            <div className={styles.heroCta} aria-label="Основные действия">
              <Link href="/heroes" className={styles.heroCtaPrimary}>
                Найти контрпик
              </Link>
              <Link href="/meta" className={styles.heroCtaSecondary}>
                Открыть тир-лист
              </Link>
            </div>
          </div>

          <div className={styles.commandPanel} aria-label="Сводка текущей меты">
            <div className={styles.commandPanelHeader}>
              <span>Live meta desk</span>
              <strong>{meta.lastUpdated}</strong>
            </div>
            <div className={styles.signalGrid}>
              <div className={styles.signalCard}>
                <span className={styles.signalLabel}>Героев</span>
                <strong>{heroes.length}</strong>
              </div>
              <div className={styles.signalCard}>
                <span className={styles.signalLabel}>S тир</span>
                <strong>{topHeroes.length}</strong>
              </div>
              <div className={styles.signalCard}>
                <span className={styles.signalLabel}>Свежий патч</span>
                <strong>{latestPatch ? formatDateRu(latestPatch.date) : 'нет данных'}</strong>
              </div>
            </div>

            {topPerformer && topPerformerHero && (
              <Link href={`/hero/${topPerformerHero.id}`} className={styles.featuredHero}>
                <span className={styles.featuredTier}>{topPerformer.tier}</span>
                <span>
                  <strong>{topPerformerHero.nameRu}</strong>
                  <small>{topPerformer.winRate}% win rate / {topPerformer.pickRate}% pick rate</small>
                </span>
              </Link>
            )}

            <div className={styles.roleStrip} aria-label="Распределение героев по ролям">
              <span>Танк {roleCounts.Tank}</span>
              <span>Урон {roleCounts.Damage}</span>
              <span>Поддержка {roleCounts.Support}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.quickPick}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Выбери героя</h2>
            <p className={styles.sectionSubtitle}>
              Сетка сразу показывает роль и тир, чтобы перейти к контрпикам без лишних экранов.
            </p>
          </div>
          <p className={styles.sectionSubtitle}>
            Найдено {heroes.length} героев / данные обновлены {lastUpdatedRu}
          </p>
        </div>
        <HeroGrid 
          heroes={heroes}
          metaHeroes={meta.heroes}
          showTiers={true}
          groupByRole={true}
        />
      </section>

      <section className={styles.topMeta}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Герои высшего тира</h2>
            <p className={styles.sectionSubtitle}>Текущий S-tier из live-среза и экспертных сигналов.</p>
          </div>
          <Link href="/meta" className={styles.sectionLink}>
            Полный тир-лист
          </Link>
        </div>
        <div className={styles.topMetaGrid}>
          {topHeroes.slice(0, 9).map((heroMeta, index) => {
            const hero = heroById.get(heroMeta.heroId);
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
          <span className={styles.statValue}>{lastUpdatedRu}</span>
          <span className={styles.statLabel}>Дата обновления</span>
        </div>
      </section>
    </main>
  );
}
