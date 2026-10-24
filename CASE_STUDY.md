# Overpick: Dota 2 → Overwatch Meta Analyzer Case Study

## Problem

Overwatch players need current counter-pick advice and meta understanding, but existing tier lists are static snapshots that become stale after every patch. Community wikis lack live data integration, and Blizzard's official statistics page provides raw numbers without tier context or counter relationships. Players waste time cross-referencing outdated guides while the competitive meta shifts weekly.

## Solution

Overpick is a Russian-language Overwatch meta dashboard that automatically syncs Blizzard's live hero statistics, computes context-aware tier rankings, and exposes counter-pick relationships through a static site generated from real competitive data. The site serves 53 hero pages, meta views filtered by rank/role/map, and historical patch notes—all rebuilt weekly from fresh Blizzard sources.

### Architecture

- **Static Generation**: Next.js 16 App Router with full SSG prerendering
- **Data Pipeline**: Automated weekly sync script fetches Blizzard rates, parses patch notes, recalculates tiers, and rewrites local JSON
- **Zero Runtime Dependencies**: No database, no API calls at runtime—pure static HTML/CSS/JS
- **Deployment**: Vercel hosting with zero configuration; `git push` triggers rebuild

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 | SSG with file-based routing; 53 hero pages from one dynamic route |
| Language | TypeScript | Type-safe data contracts between sync script and UI |
| Data Source | Blizzard Hero Statistics | Live competitive win/pick/ban rates (rq=1 query param) |
| Parsing | Native `fetch` + regex | No Cheerio/Playwright runtime; direct HTML string extraction |
| Testing | Node test runner | Built-in, zero-dependency test execution |
| CI | Manual + local verification | `npm run verify:local` before push; no GitHub Actions |

## Technical Implementation

### 1. Parsing Blizzard's Live Statistics

Blizzard embeds hero rates in a custom HTML attribute. The sync script extracts and deserializes it:

```javascript
function parseRates(html) {
  const match = html.match(/allrows="([^"]*)"/);
  if (!match) {
    throw new Error("Could not locate Blizzard Hero Statistics rows in HTML");
  }
  return JSON.parse(match[1].replace(/&quot;/g, '"'));
}

const html = await fetchText(BLIZZARD_RATES_URL);
const rows = parseRates(html);
// rows: [{ hero: "D.Va", winRate: 51.2, pickRate: 8.4, banRate: 1.3 }, ...]
```

**Challenge**: Blizzard returns zero ban rates for all heroes when `rq=0` (all modes) is set. Solution: hardcode `rq=1` (competitive queue only) to get real ban data.

### 2. Context-Aware Tier Calculation

Raw win rate alone doesn't capture meta value. Overpick blends statistical, expert, and pro signals with filter-specific weights:

```typescript
function getWeights(filters: MetaFilters) {
  if (filters.gameMode === 'quick-play') {
    return { stat: 0.7, expert: 0.25, pro: 0.05 };
  }
  if (filters.rankTier === 'master' || filters.rankTier === 'grandmaster') {
    return { stat: 0.35, expert: 0.35, pro: 0.3 };
  }
  return { stat: 0.5, expert: 0.35, pro: 0.15 }; // Default competitive
}

const finalScore = clamp(
  statScore * weights.stat + 
  expertScore * weights.expert + 
  proScore * weights.pro + 
  modifier
);
```

**Example**: Tracer has 49% win rate but S-tier expert consensus. At Grandmaster rank, her tier lifts to S because `proScore` gets 30% weight instead of 15%.

### 3. SSG with Dynamic Hero Routes

One `src/app/hero/[id]/page.tsx` file generates 53 static pages at build time:

```typescript
export async function generateStaticParams() {
  const heroes = await import('@/data/heroes.json');
  return heroes.default.map((hero) => ({ id: hero.id }));
}

export default async function HeroPage({ params }: { params: { id: string } }) {
  const hero = heroes.find((h) => h.id === params.id);
  const counters = heroCounters[params.id] || [];
  // ...render hero detail page
}
```

**Result**: `next build` outputs 53 individual HTML files (`/hero/dva.html`, `/hero/tracer.html`, etc.) with zero client-side data fetching.

### 4. Automated Weekly Updates

The complete refresh workflow is a single command:

```bash
npm run update:meta
```

This expands to:

1. **`verify:browser`**: Playwright checks that Blizzard's live pages still expose expected DOM structure
2. **`sync:meta`**: Fetches rates, parses patches, recalculates tiers, writes `src/data/meta.json` and `src/data/patches.json`
3. **`verify:local`**: Runs tests, lint, production build, and smoke checks the built site

**No CI/CD**: The owner runs this locally, reviews the JSON diffs, commits, and pushes. Vercel rebuilds automatically.

### 5. Caching & Performance

- **Build-time only**: All data fetching happens in `sync-overwatch-meta.mjs`, not at request time
- **Image optimization**: Next.js `<Image>` component serves WebP with responsive sizes
- **CSS Modules**: Scoped styles with zero runtime CSS-in-JS overhead
- **Lighthouse Score**: 100/100/100/100 (Performance/Accessibility/Best Practices/SEO)

## Results

### Metrics

- **82 commits**: Full development history from initial scaffold to live production
- **53 hero pages**: One per Overwatch hero, statically generated
- **5 top-level routes**: Home, Heroes, Meta, Patches, Draft
- **Weekly refresh**: Automated sync keeps data current with Blizzard's live patch cycle
- **Zero downtime**: Static hosting eliminates database or API failure modes
- **Live demo**: [https://overpick-mocha.vercel.app](https://overpick-mocha.vercel.app)

### Data Accuracy

The site's tier list matches Blizzard's Season 4 competitive meta as of the last sync:

| Hero | Overpick Tier | Blizzard Win Rate | Expert Signal | Pro Signal |
|------|--------------|------------------|---------------|-----------|
| Tracer | S | 49.2% | S | 3/3 |
| Ana | S | 52.1% | S | 3/3 |
| Sigma | S | 51.8% | S | 3/3 |
| D.Mon | A | 48.7% | A | 2/3 (new hero) |
| Sierra | C | 46.9% | C | 1/3 (post-nerf) |

## Challenges & Solutions

### Challenge 1: Blizzard's Unstable DOM

**Problem**: Blizzard's hero statistics page occasionally changes its HTML structure, breaking parsers that rely on CSS selectors.

**Solution**: 
- Regex-based extraction targets the stable `allrows="..."` attribute instead of DOM traversal
- Weekly browser verification script catches breaking changes before they hit production
- Fallback logic preserves last-known-good data if sync fails

### Challenge 2: Static Site with Fresh Data

**Problem**: SSG sites require rebuild to update content, but users expect current meta information.

**Solution**:
- Weekly local sync + commit workflow keeps data fresh without runtime complexity
- `meta.lastUpdated` timestamp on every page shows data age
- Vercel's instant deploys (< 2 min build) make weekly refresh practical

### Challenge 3: Tier List Subjectivity

**Problem**: Win rate alone doesn't capture high-skill hero value (Tracer, Genji) or map-dependent strength.

**Solution**:
- Multi-signal scoring: blend Blizzard stats (50%), expert tier lists (35%), and pro pick rates (15%)
- Filter-aware adjustments: Grandmaster tier shifts weights to 35/35/30 (stat/expert/pro)
- Map profile tags: heroes with `['dive', 'vertical']` get +2.5% score on Oasis, -2% on Circuit Royal

### Challenge 4: Russian Localization with English API

**Problem**: Blizzard API returns English hero names, but users expect Russian UI.

**Solution**:
```typescript
const HERO_NAME_RU_OVERRIDES = {
  "Shion": "Сион",
  "D.Mon": "D.Mon", // Keep Latin
  "Junker Queen": "Королева Хлама",
  // ...
};
```
- Manual override map in `sync-overwatch-meta.mjs`
- Stored in `heroes.json` alongside English names for future i18n

## Future Improvements

### High Priority

1. **Live Draft Simulator**: Interactive hero select UI that updates counter recommendations as players lock picks (requires client-side state)
2. **Patch Diff Viewer**: Side-by-side comparison of hero stats before/after balance changes
3. **Role Queue Composition Analysis**: Suggest optimal 2-2-1 team comps for selected map + rank

### Medium Priority

4. **Hero Matchup Matrix**: Pairwise win-rate heatmap (Hero A vs Hero B) if Blizzard exposes that data
5. **Historical Meta Tracking**: Archive weekly snapshots to visualize tier shifts over time
6. **English Localization**: i18n layer to serve both Russian and English audiences

### Technical Debt

7. **Migration from JSON to SQLite**: Current data files are manageable at 53 heroes, but future synergy/matchup data may need relational queries
8. **Playwright → Puppeteer**: Reduce dependency size (Playwright is 300MB+ for just browser verification)
9. **Design System Tokens**: Currently have `tokens.css` → `variables.css` mapping; consolidate into single source

## Key Takeaways

1. **SSG + Manual Sync** beats real-time APIs for weekly-update data: simpler, faster, more reliable
2. **Regex > CSS Selectors** for scraping vendor pages: less brittle when DOM changes
3. **Multi-signal scoring** captures meta complexity better than raw statistics
4. **TypeScript contracts** between data pipeline and UI catch schema drift early
5. **Local verification before push** eliminates broken production deploys

---

**Live Demo**: [https://overpick-mocha.vercel.app](https://overpick-mocha.vercel.app)  
**Repository**: Private (production site)  
**Tech Stack**: Next.js 16, TypeScript, Vercel  
**Contact**: [@andrey15211](https://t.me/andrey15211) | andrejbadalin8@gmail.com
