/* ── Period definitions ──────────────────────────────────────── */
/* Q1 is included so okr-tracker can compute the live baseline from _mem */
var OKR_PERIODS = {
  Q1: { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31' },
  Q2: { label: 'Q2 2026', start: '2026-04-01', end: '2026-06-30' },
  Q3: { label: 'Q3 2026', start: '2026-07-01', end: '2026-09-30' },
  H1: { label: 'H1 2026', start: '2026-04-01', end: '2026-09-30' }
};

/*
 * KPI_DEFS — structural config only. No hardcoded actual values.
 * Actuals and baselines are computed live from _mem (the same data
 * store used by Traffic Analysis and Sequential Analysis).
 *
 * Adding a new KPI = one entry here, zero UI changes required.
 *
 * Supported unit types: 'percent' | 'count' | 'rank' | 'score'
 *
 * Future KPIs (one entry each):
 *   { id:'impressions',   name:'Impressions',            unit:'count',   applicablePeriods:['Q2','Q3'], byCountry:true, bySource:true,  ... }
 *   { id:'ttr',           name:'TTR (Tap-Through Rate)', unit:'percent', applicablePeriods:['Q2','Q3'], byCountry:true, bySource:true,  ... }
 *   { id:'rating',        name:'App Store Rating',       unit:'score',   applicablePeriods:['Q2','Q3'], byCountry:true, bySource:false, ... }
 *   { id:'category_rank', name:'Finance Category Rank',  unit:'rank',    applicablePeriods:['Q2','Q3'], byCountry:true, bySource:false, ... }
 */
var KPI_DEFS = [
  {
    id: 'cvr',
    name: 'CVR',
    description: 'Conversion Rate — Total Downloads ÷ Impressions',
    unit: 'percent',
    decimals: 2,
    applicablePeriods: ['Q2', 'Q3'],
    byCountry: true,
    bySource: true,

    /*
     * Target multiplier rules — auto-calculates; never hardcode final target values.
     * Q2 target = Q1 actual (from _mem) × 1.15
     * Q3 target = Q2 actual (from _mem) × 1.20  (compounds off Q2, not Q1)
     * base: 'Q1_actual' | 'Q2_actual' tells okr-tracker which period to pull from _mem.
     */
    targetMultiplier: {
      Q2: { base: 'Q1_actual', multiplier: 1.15 },
      Q3: { base: 'Q2_actual', multiplier: 1.20 }
    },

    /*
     * fallbackBaseline — used ONLY when _mem has no Q1 2026 data for a given
     * country/source combo (e.g. data only starts in Q2). Live _mem always wins.
     * INJECT REAL DATA HERE to add per-country fallbacks if needed.
     */
    fallbackBaseline: {
      all: { all: 2.85, search: 3.20, browse: 1.80, appref: 5.20, webref: 2.10 }
    },

    levers: 'Screenshot A/B tests, metadata localisation, category keyword optimisation',
    notes: 'Q2 target = Q1 actual × 1.15 · Q3 target = Q2 actual × 1.20 (compounding). Baseline sourced from live Traffic Analysis data.'
  },

  {
    id: 'browse_downloads',
    name: 'Browse Traffic Downloads',
    description: 'Total Downloads (FTD + Redownloads) via App Store Browse',
    unit: 'count',
    decimals: 0,
    applicablePeriods: ['H1'],
    byCountry: false,
    bySource: false,

    /* Fixed H1 target — a genuine config constant, not derived from historical data */
    targets: { H1: 15000 },

    levers: 'In-App Events (seasonal/product launches), Finance Category Top 10 ranking, Editorial features',
    notes: 'H1 = April – September 2026. Live YTD progress shown against 15,000 target.'
  }
];
