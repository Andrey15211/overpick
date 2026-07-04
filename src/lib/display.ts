import type { Hero } from '@/types/heroes';

const MONTHS_RU_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const;

export function formatDateRu(dateIso: string): string {
  const [year, month, day] = dateIso.split('-');
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);

  if (!year || monthIndex < 0 || monthIndex >= MONTHS_RU_GENITIVE.length || !dayNumber) {
    return dateIso;
  }

  return `${dayNumber} ${MONTHS_RU_GENITIVE[monthIndex]} ${year} года`;
}

export function buildHeroById(heroes: Hero[]): Map<string, Hero> {
  return new Map(heroes.map((hero) => [hero.id, hero]));
}
