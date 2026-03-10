import { Metadata } from 'next';
import TierList from '@/components/TierList';
import metaData from '@/data/meta.json';
import patchesData from '@/data/patches.json';
import heroesData from '@/data/heroes.json';
import { Hero } from '@/types/heroes';
import { HeroMeta, Tier, TierInfo, Patch, TIER_ORDER, CHANGE_TYPE_LABELS } from '@/types/meta';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Мета и Тир-лист',
  description: 'Актуальный тир-лист героев Overwatch Season 1.5. S-tier герои, подроли, pick rate и win rate статистика.',
};

// Типизация данных
const meta = metaData as {
  season: number;
  seasonName: string;
  patch: string;
  lastUpdated: string;
  metaDescription: string;
  tiers: Record<Tier, TierInfo>;
  heroes: HeroMeta[];
};
const patches = patchesData as Patch[];
const heroes = heroesData as Hero[];

// Получить героя по ID
function getHeroName(heroId: string): string {
  const hero = heroes.find(h => h.id === heroId);
  return hero?.nameRu || heroId;
}

export default function MetaPage() {
  return (
    <div className={styles.metaPage}>
      <div className={styles.metaContainer}>
        {/* Заголовок */}
        <header className={styles.metaHeader}>
          <h1 className={styles.metaTitle}>
            Текущая <span>Мета</span>
          </h1>
          <p className={styles.metaSubtitle}>
            Тир-лист героев Overwatch на основе актуальных данных
          </p>
          <div className={styles.metaInfo}>
            <div className={styles.metaInfoItem}>
              <span className={styles.metaInfoLabel}>Сезон:</span>
              <span className={styles.metaInfoValue}>{meta.seasonName}</span>
            </div>
            <div className={styles.metaInfoItem}>
              <span className={styles.metaInfoLabel}>Патч:</span>
              <span className={styles.metaInfoValue}>{meta.patch}</span>
            </div>
            <div className={styles.metaInfoItem}>
              <span className={styles.metaInfoLabel}>Обновлено:</span>
              <span className={styles.metaInfoValue}>{meta.lastUpdated}</span>
            </div>
          </div>
          {/* Описание меты */}
          <div className={styles.metaDesc}>
            <p>{meta.metaDescription}</p>
          </div>
        </header>

        {/* Легенда тиров */}
        <div className={styles.tierLegend}>
          {TIER_ORDER.map(tier => (
            <div key={tier} className={styles.tierLegendItem}>
              <span 
                className={`${styles.tierLegendBadge} ${styles[`tierLegendBadge--${tier}`]}`}
              >
                {tier}
              </span>
              <span className={styles.tierLegendDesc}>
                {meta.tiers[tier].description}
              </span>
            </div>
          ))}
        </div>

        {/* Тир-лист */}
        <section className={styles.metaSection}>
          <h2 className={styles.metaSectionTitle}>Тир-лист героев</h2>
          <TierList 
            metaHeroes={meta.heroes} 
            heroes={heroes}
          />
        </section>

        {/* История патчей */}
        <section className={styles.metaSection}>
          <h2 className={styles.metaSectionTitle}>История патчей</h2>
          <div className={styles.patchList}>
            {patches.slice(0, 5).map(patch => (
              <div key={patch.patchId} className={styles.patchCard}>
                <div className={styles.patchHeader}>
                  <h3 className={styles.patchTitle}>{patch.title}</h3>
                  <div className={styles.patchMeta}>
                    <span className={styles.patchVersion}>v{patch.version}</span>
                    <span>{patch.date}</span>
                  </div>
                </div>
                <div className={styles.patchChanges}>
                  {patch.changes.map((change, idx) => (
                    <div key={idx} className={styles.patchChange}>
                      <span className={`${styles.patchChangeType} ${styles[`patchChangeType--${change.type}`]}`}>
                        {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].icon} {CHANGE_TYPE_LABELS[change.type as keyof typeof CHANGE_TYPE_LABELS].label}
                      </span>
                      <span className={styles.patchChangeHero}>{getHeroName(change.heroId)}</span>
                      <span className={styles.patchChangeDesc}>{change.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
