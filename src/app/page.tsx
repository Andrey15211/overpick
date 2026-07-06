import Link from 'next/link';
import Image from 'next/image';
import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import patchesData from '@/data/patches.json';
import { computeFilteredMeta } from '@/data/metaFilters';
import { Hero, SUBROLE_LABELS } from '@/types/heroes';
import { ComputedHeroMeta, HeroMeta, MetaFilters, Patch, Tier, TierInfo, TIER_ORDER } from '@/types/meta';
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

const NEW_HEROES = ['shion', 'sierra'];
const SEASON_HERO_ID = 'shion';
const SEASON_HERO_ART = '/shion-cutout.png';

const DEFAULT_META_FILTERS: MetaFilters = {
  input: 'pc',
  gameMode: 'competitive',
  rankTier: 'all',
  map: 'all-maps',
  region: 'europe',
};

function pickByRole(rows: ComputedHeroMeta[], heroById: Map<string, Hero>, role: Hero['role'], count: number) {
  return rows.filter((row) => heroById.get(row.heroId)?.role === role).slice(0, count);
}

export default function Home() {
  const heroById = buildHeroById(heroes);
  const lastUpdatedRu = formatDateRu(meta.lastUpdated);
  const heroRoleById = new Map(heroes.map((hero) => [hero.id, hero.role]));
  const computedMeta = computeFilteredMeta(meta.heroes, heroRoleById, DEFAULT_META_FILTERS);
  const computedByHeroId = new Map(computedMeta.map((row) => [row.heroId, row]));
  const seasonHero = heroById.get(SEASON_HERO_ID);
  const seasonHeroMeta = computedByHeroId.get(SEASON_HERO_ID);
  const topTank = pickByRole(computedMeta, heroById, 'Tank', 1);
  const topDamage = pickByRole(computedMeta, heroById, 'Damage', 2);
  const topSupport = pickByRole(computedMeta, heroById, 'Support', 2);
  const roleSpotlight = [
    { label: 'Лучший танк', rows: topTank },
    { label: '2 лучших DPS', rows: topDamage },
    { label: '2 лучших саппорта', rows: topSupport },
  ];
  const latestPatch = patches[0];
  const heroesByTier = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = computedMeta.filter((heroMeta) => heroMeta.tier === tier);
    return acc;
  }, {} as Record<Tier, ComputedHeroMeta[]>);
  const tierRank = new Map(TIER_ORDER.map((tier, index) => [tier, index]));
  const homeRosterHeroes = [...heroes].sort((left, right) => {
    const leftTier = computedByHeroId.get(left.id)?.tier;
    const rightTier = computedByHeroId.get(right.id)?.tier;
    const leftRank = leftTier ? tierRank.get(leftTier) ?? TIER_ORDER.length : TIER_ORDER.length;
    const rightRank = rightTier ? tierRank.get(rightTier) ?? TIER_ORDER.length : TIER_ORDER.length;

    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.nameRu.localeCompare(right.nameRu, 'ru');
  });
  
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroShell}>
          <div className={styles.heroCopy}>
            <p className={styles.heroSystemLine}>
              {meta.seasonName} / Into the Tiger&apos;s Den / {heroes.length} героя
            </p>
            <h1 className={styles.heroTitle}>
              Сион открывает мету Season 3
            </h1>
            <p className={styles.heroSubtitle}>
              Новый герой 3-го сезона Сион, подкласс фланкер.
            </p>
            <div className={styles.heroCta} aria-label="Основные действия">
              <Link href="/heroes" className={styles.heroCtaPrimary}>
                Открыть героев
              </Link>
              <Link href="/meta" className={styles.heroCtaSecondary}>
                Смотреть тир-лист
              </Link>
            </div>

            {seasonHero && seasonHeroMeta && (
              <Link href={`/hero/${seasonHero.id}`} className={styles.seasonHeroChip}>
                <Image
                  src={seasonHero.portrait}
                  alt={seasonHero.nameRu}
                  width={58}
                  height={58}
                  className={styles.seasonHeroChipImg}
                  priority
                />
                <span>
                  <strong>{seasonHero.nameRu}</strong>
                  <small>{seasonHeroMeta.tier} тир / {seasonHeroMeta.winRate}% WR / {seasonHeroMeta.pickRate}% PR</small>
                </span>
              </Link>
            )}
          </div>

          <div className={styles.seasonPoster} aria-label="Новый герой сезона">
            <Image
              src={SEASON_HERO_ART}
              alt="Сион, новый герой Season 3"
              width={1750}
              height={1520}
              className={styles.seasonPosterImg}
              priority
            />
            <div className={styles.posterHud}>
              <span>Hero 52</span>
              <strong>Сион</strong>
              <small>Damage / Flanker</small>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metaDesk} aria-label="Сигналы текущей меты">
        <div className={styles.signalGrid}>
          <div className={styles.signalCard}>
            <span className={styles.signalLabel}>Статистика сайта</span>
            <strong>{lastUpdatedRu}</strong>
          </div>
          <div className={styles.signalCard}>
            <span className={styles.signalLabel}>Последний патч Overwatch</span>
            <strong>{latestPatch ? formatDateRu(latestPatch.date) : 'нет данных'}</strong>
          </div>
        </div>

        <div className={styles.roleSpotlightGrid}>
          {roleSpotlight.map((group) => (
            <article key={group.label} className={styles.roleSpotlight}>
              <h2>{group.label}</h2>
              <div className={styles.roleSpotlightRows}>
                {group.rows.map((row, index) => {
                  const hero = heroById.get(row.heroId);
                  if (!hero) return null;

                  return (
                    <Link key={row.heroId} href={`/hero/${row.heroId}`} className={styles.roleHero}>
                      <span className={styles.roleHeroRank}>{index + 1}</span>
                      <Image
                        src={hero.portrait}
                        alt={hero.nameRu}
                        width={76}
                        height={76}
                        className={styles.roleHeroImg}
                        loading="lazy"
                      />
                      <span className={styles.roleHeroText}>
                        <strong>{hero.nameRu}</strong>
                        <small>{row.tier} тир / {row.winRate}% WR / {row.pickRate}% PR</small>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.topMeta}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Герои верхнего среза</h2>
            <p className={styles.sectionSubtitle}>
              Главная сетка разложена слева направо по тиру: от S до D, без служебных чисел.
            </p>
          </div>
          <Link href="/meta" className={styles.sectionLink}>
            Полный тир-лист
          </Link>
        </div>
        <div className={styles.topMetaGrid}>
          {TIER_ORDER.map((tier) => (
            <section key={tier} className={`${styles.topMetaTierColumn} ${styles[`topMetaTierColumn--${tier}`]}`}>
              <h3 className={styles.topMetaTierHeader}>
                <span>{tier}</span>
                <small>{heroesByTier[tier].length}</small>
              </h3>
              <div className={styles.topMetaTierList}>
                {heroesByTier[tier].map((heroMeta, index) => {
                  const hero = heroById.get(heroMeta.heroId);
                  if (!hero) return null;
                  const isNew = NEW_HEROES.includes(hero.id);

                  return (
                    <Link
                      key={hero.id}
                      href={`/hero/${hero.id}`}
                      className={styles.topMetaCard}
                      style={{ animationDelay: `${index * 36}ms` }}
                    >
                      <div className={styles.topMetaAvatar}>
                        <Image
                          src={hero.portrait}
                          alt={hero.nameRu}
                          width={48}
                          height={48}
                          className={styles.topMetaAvatarImg}
                          loading="eager"
                        />
                      </div>
                      <div className={styles.topMetaInfo}>
                        <span className={styles.topMetaName}>
                          {hero.nameRu}
                          {isNew && <span className="new-badge">НОВОЕ</span>}
                        </span>
                        <span className={styles.topMetaStats}>
                          {heroMeta.winRate}% WR / {heroMeta.pickRate}% PR
                        </span>
                        {hero.subrole && (
                          <span className={styles.topMetaSubrole}>
                            {SUBROLE_LABELS[hero.subrole] || hero.subrole}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.quickPick}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Полный ростер</h2>
            <p className={styles.sectionSubtitle}>
              Все {heroes.length} героя отсортированы от S тира к D тиру. Карточка ведёт на контрпики и синергии.
            </p>
          </div>
          <p className={styles.sectionSubtitle}>
            Blizzard Hero Statistics / PC Europe / {lastUpdatedRu}
          </p>
        </div>
        <HeroGrid
          heroes={homeRosterHeroes}
          metaHeroes={meta.heroes}
          showTiers={true}
          groupByRole={false}
        />
      </section>
    </main>
  );
}
