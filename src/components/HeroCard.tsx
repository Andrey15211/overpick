import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/types/heroes';
import { Tier } from '@/types/meta';
import '../styles/HeroCard.css';

interface HeroCardProps {
  hero: Hero;
  tier?: Tier;
  showTier?: boolean;
}

export default function HeroCard({ hero, tier, showTier = false }: HeroCardProps) {
  const tierLabel = tier ? `${tier} тир` : 'Нет тира';

  return (
    <Link 
      href={`/hero/${hero.id}`} 
      className={`heroCard heroCard--${hero.role}`}
      aria-label={`Перейти к контрпикам ${hero.nameRu}`}
    >
      <div className={`heroCardAvatar heroCardAvatar--${hero.role}`}>
        <Image
          src={hero.portrait}
          alt={hero.nameRu}
          width={72}
          height={72}
          className="heroCardAvatarImg"
          loading="lazy"
          unoptimized
        />
      </div>
      
      <span className="heroCardName">{hero.nameRu}</span>
      
      {showTier && (
        <span className={`heroCardTier ${tier ? `heroCardTier--${tier}` : 'heroCardTier--unknown'}`}>
          {tierLabel}
        </span>
      )}
    </Link>
  );
}
