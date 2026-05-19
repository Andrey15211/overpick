import HeroGrid from '@/components/HeroGrid';
import heroesData from '@/data/heroes.json';
import metaData from '@/data/meta.json';
import { Hero } from '@/types/heroes';
import { HeroMeta, Tier, TierInfo } from '@/types/meta';
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

export default function HeroesPage() {
  return (
    <div className={styles.heroesPage}>
      <div className={styles.heroesContainer}>
        {/* Заголовок */}
        <header className={styles.heroesHeader}>
          <h1 className={styles.heroesTitle}>
            Все <span>Герои</span>
          </h1>
          <p className={styles.heroesSubtitle}>
            Выбери героя для просмотра контрпиков и информации о мете по состоянию на 20 мая 2026 года
          </p>
        </header>

        {/* Сетка героев */}
        <HeroGrid 
          heroes={heroes}
          metaHeroes={meta.heroes}
          showTiers={true}
          groupByRole={true}
        />
      </div>
    </div>
  );
}
