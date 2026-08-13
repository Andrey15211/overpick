import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import CounterList from '@/components/CounterList';
import SynergyBlock from '@/components/SynergyBlock';
import heroesData from '@/data/heroes.json';
import countersData from '@/data/counters.json';
import metaData from '@/data/meta.json';
import synergiesData from '@/data/synergies.json';
import { Hero, HeroRole, ROLE_LABELS, SUBROLE_LABELS, HeroCounters, HeroSynergies } from '@/types/heroes';
import { HeroMeta, Tier, TierInfo } from '@/types/meta';
import { buildHeroById, formatDateRu } from '@/lib/display';
import styles from './page.module.css';

// Типизация данных
const heroes = heroesData as Hero[];
const counters = countersData as HeroCounters[];
const synergies = synergiesData as HeroSynergies;
const meta = metaData as {
  season: number;
  seasonName: string;
  patch: string;
  lastUpdated: string;
  tiers: Record<Tier, TierInfo>;
  heroes: HeroMeta[];
};

const NEW_HEROES = ['dmon'];
const heroById = buildHeroById(heroes);
const countersByHeroId = new Map(counters.map((counter) => [counter.heroId, counter]));
const metaByHeroId = new Map(meta.heroes.map((heroMeta) => [heroMeta.heroId, heroMeta]));
const lastUpdatedRu = formatDateRu(meta.lastUpdated);

// Иконки ролей
const ROLE_ICONS: Record<HeroRole, string> = {
  Tank: '🛡️',
  Damage: '⚔️',
  Support: '💚',
};

const HERO_GUIDES: Record<string, { intro: string; abilities: { name: string; description: string }[] }> = {
  dmon: {
    intro: 'D.Mon — лидер MEKA Squad и танк Season 4. Она удерживает фронт Power Barrier, чередует меч и Fusion Repeater, а Limit Break открывает команде окно для фокуса.',
    abilities: [
      { name: 'Plasma Saber', description: 'Быстрое энергетическое оружие ближнего боя.' },
      { name: 'Portable Fusion Repeater', description: 'Тяжёлый пулемёт для давления до входа в мили-дистанцию.' },
      { name: 'Power Barrier', description: 'Барьер, который прикрывает D.Mon и союзников в направлении фронта.' },
      { name: 'Surging Strike', description: 'Рывок с ударом, сбивающий позицию противника и создающий окно для продолжения атаки.' },
      { name: 'Propulsors', description: 'Мобильность с ограниченным топливом для входа, выхода и смены угла.' },
      { name: 'Limit Break', description: 'Широкий удар мечом: накладывает уязвимость на врагов и даёт D.Mon дополнительное здоровье.' },
    ],
  },
};

// Генерация метаданных
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const hero = heroById.get(id);
  
  if (!hero) {
    return { title: 'Герой не найден' };
  }
  
  return {
    title: `${hero.nameRu} - Контрпики`,
    description: `Узнай, кто контрит ${hero.nameRu} в Overwatch. Лучшие контрпики и мета-заметки для Season 4, актуально на ${lastUpdatedRu}.`,
  };
}

// Генерация статических путей
export async function generateStaticParams() {
  return heroes.map((hero) => ({
    id: hero.id,
  }));
}

// Страница героя
export default async function HeroDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Найти героя
  const hero = heroById.get(id);
  if (!hero) {
    notFound();
  }
  
  // Найти контрпики для этого героя
  const heroCounters = countersByHeroId.get(id);
  
  // Найти мета-информацию
  const heroMeta = metaByHeroId.get(id);
  
  // Найти синергии
  const heroSynergies = synergies[id] || [];
  const heroGuide = HERO_GUIDES[id];
  
  const isNew = NEW_HEROES.includes(hero.id);
  
  return (
    <div className={styles.heroDetailPage}>
      <div className={styles.heroDetailContainer}>
        {/* Кнопка назад */}
        <Link href="/" className={styles.heroDetailBack} aria-label="Вернуться на главную">
          ← На главную
        </Link>
        
        {/* Шапка героя */}
        <header className={styles.heroDetailHeader}>
          <div className={`${styles.heroDetailAvatar} ${styles[`heroDetailAvatar--${hero.role}`]}`}>
            <Image
              src={hero.portrait}
              alt={hero.nameRu}
              width={120}
              height={120}
              className={styles.heroDetailAvatarImg}
              priority
            />
          </div>
          
          <div className={styles.heroDetailInfo}>
            <h1 className={styles.heroDetailName}>
              {hero.nameRu}
              {isNew && <span className="new-badge">НОВОЕ</span>}
            </h1>
            
            <div className={styles.heroDetailMeta}>
              <span className={`${styles.heroDetailBadge} ${styles['heroDetailBadge--role']} ${styles[`heroDetailBadge--${hero.role}`]}`}>
                {ROLE_ICONS[hero.role]} {ROLE_LABELS[hero.role]}
              </span>
              
              {/* Подроль */}
              {hero.subrole && (
                <span 
                  className={`${styles.heroDetailBadgeSubrole} ${styles[`heroDetailBadgeSubrole--${hero.subrole}`] || ''}`}
                >
                  {SUBROLE_LABELS[hero.subrole] || hero.subrole}
                </span>
              )}
              
              {heroMeta && (
                <span className={`${styles.heroDetailBadge} ${styles['heroDetailBadge--tier']} ${styles[`heroDetailBadge--tier-${heroMeta.tier}`]}`}>
                  {heroMeta.tier} тир
                </span>
              )}
            </div>
            
            {/* Статистика */}
            {heroMeta && (
              <div className={styles.heroDetailStats}>
                <div className={styles.heroDetailStat}>
                  <div className={styles.heroDetailStatValue}>{heroMeta.pickRate}%</div>
                  <div className={styles.heroDetailStatLabel}>Частота выбора</div>
                </div>
                <div className={styles.heroDetailStat}>
                  <div className={styles.heroDetailStatValue}>{heroMeta.winRate}%</div>
                  <div className={styles.heroDetailStatLabel}>Винрейт</div>
                </div>
                <div className={styles.heroDetailStat}>
                  <div className={styles.heroDetailStatValue}>{heroMeta.banRate}%</div>
                  <div className={styles.heroDetailStatLabel}>Бан-рейт</div>
                </div>
              </div>
            )}
            {/* Имба-связки */}
            {heroSynergies.length > 0 && (
              <SynergyBlock synergies={heroSynergies} heroes={heroes} />
            )}
          </div>
        </header>

        {heroGuide && (
          <section className={styles.heroGuide} aria-labelledby="guide-heading">
            <div>
              <p className={styles.heroGuideKicker}>Season 4 / Heroes of Busan</p>
              <h2 id="guide-heading" className={styles.heroDetailSectionTitle}>Как работает {hero.nameRu}</h2>
              <p className={styles.heroGuideIntro}>{heroGuide.intro}</p>
            </div>
            <div className={styles.heroGuideGrid}>
              {heroGuide.abilities.map((ability) => (
                <article key={ability.name} className={styles.heroGuideCard}>
                  <h3>{ability.name}</h3>
                  <p>{ability.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        
        {/* Контрпики */}
        <section className={styles.heroDetailSection} aria-labelledby="counters-heading">
          <h2 id="counters-heading" className={styles.heroDetailSectionTitle}>
            Кто контрит {hero.nameRu}
          </h2>
          <p className={styles.heroDetailSectionDesc}>
            Выбери одного из этих героев, чтобы получить преимущество против {hero.nameRu}
          </p>
          
          {heroCounters && heroCounters.counters.length > 0 ? (
            <CounterList 
              counters={heroCounters.counters}
              heroes={heroes}
              title=""
            />
          ) : (
            <p className={styles.noCountersText}>
              Контрпики для этого героя пока не добавлены
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
