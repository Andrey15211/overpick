import Link from 'next/link';
import Image from 'next/image';
import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import patchesData from '@/data/patches.json';
import { computeFilteredMeta } from '@/data/metaFilters';
import { Hero, SUBROLE_LABELS } from '@/types/heroes';
import { ComputedHeroMeta, HeroMeta, MetaFilters, Patch, Tier, TierInfo } from '@/types/meta';
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
const SEASON_HERO_ART =
  'https://blz-contentstack-images.akamaized.net/v3/assets/blt2477dcaf4ebd440c/blt8a44cee96c28a435/6a28a8e3f1f5dd6cddd650b4/1600_Shion.png';

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
  const topHeroes = computedMeta.filter((heroMeta) => heroMeta.tier === 'S');
  const topTank = pickByRole(computedMeta, heroById, 'Tank', 1);
  const topDamage = pickByRole(computedMeta, heroById, 'Damage', 2);
  const topSupport = pickByRole(computedMeta, heroById, 'Support', 2);
  const roleSpotlight = [
    { label: 'Лучший танк', rows: topTank },
    { label: '2 лучших DPS', rows: topDamage },
    { label: '2 лучших саппорта', rows: topSupport },
  ];
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
              {meta.seasonName} / Into the Tiger&apos;s Den / {heroes.length} героя
            </p>
            <h1 className={styles.heroTitle}>
              Сион открывает мету Season 3
            </h1>
            <p className={styles.heroSubtitle}>
              Новый фланкер уже в live-статистике Blizzard. Overpick сводит win rate, pick rate, экспертный tier и pro/high-rank сигналы в один счёт, чтобы быстрее выбрать пик под текущий патч.
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
              width={1600}
              height={736}
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
            <span className={styles.signalLabel}>Обновлено</span>
            <strong>{lastUpdatedRu}</strong>
          </div>
          <div className={styles.signalCard}>
            <span className={styles.signalLabel}>S тир</span>
            <strong>{topHeroes.length}</strong>
          </div>
          <div className={styles.signalCard}>
            <span className={styles.signalLabel}>Свежий патч</span>
            <strong>{latestPatch ? formatDateRu(latestPatch.date) : 'нет данных'}</strong>
          </div>
          <div className={styles.signalCard}>
            <span className={styles.signalLabel}>Роли</span>
            <strong>{roleCounts.Tank}/{roleCounts.Damage}/{roleCounts.Support}</strong>
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
                        <small>{row.finalScore.toFixed(2)} score / {row.tier} тир</small>
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
              Плотная витрина портретов: сначала S-tier и герои с максимальным итоговым счётом, затем полный ростер.
            </p>
          </div>
          <Link href="/meta" className={styles.sectionLink}>
            Полный тир-лист
          </Link>
        </div>
        <div className={styles.topMetaGrid}>
          {computedMeta.slice(0, 12).map((heroMeta, index) => {
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
                    {heroMeta.winRate}% WR / {heroMeta.pickRate}% PR
                  </span>
                </div>
                <span className={styles.topMetaScore}>
                  {heroMeta.finalScore.toFixed(2)}
                </span>
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

      <section className={styles.quickPick}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Полный ростер</h2>
            <p className={styles.sectionSubtitle}>
              Все {heroes.length} героя с текущим тиром. Карточка ведёт на контрпики, синергии и причину положения в мете.
            </p>
          </div>
          <p className={styles.sectionSubtitle}>
            Blizzard Hero Statistics / PC Europe / {lastUpdatedRu}
          </p>
        </div>
        <HeroGrid
          heroes={heroes}
          metaHeroes={meta.heroes}
          showTiers={true}
          groupByRole={true}
        />
      </section>
    </main>
  );
}
