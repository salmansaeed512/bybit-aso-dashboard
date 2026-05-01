/* ── Period definitions ──────────────────────────────────────── */
var OKR_PERIODS = {
  Q2: { label: 'Q2 2026', start: '2026-04-01', end: '2026-06-30' },
  Q3: { label: 'Q3 2026', start: '2026-07-01', end: '2026-09-30' },
  H1: { label: 'H1 2026', start: '2026-04-01', end: '2026-09-30' }
};

/*
 * KPI_DEFS — the single source of truth for all OKR KPIs.
 * Adding a new KPI = adding one object here. Zero UI changes required.
 *
 * Supported unit types: 'percent' | 'count' | 'rank' | 'score'
 * byCountry / bySource: whether filters drill into nested actuals/baselines
 *
 * Future KPIs to add here (one entry each, no UI changes):
 *   { id:'impressions',    name:'Impressions',            unit:'count',   applicablePeriods:['Q2','Q3'], byCountry:true, bySource:true, ... }
 *   { id:'ttr',            name:'TTR (Tap-Through Rate)', unit:'percent', applicablePeriods:['Q2','Q3'], byCountry:true, bySource:true, ... }
 *   { id:'rating',         name:'App Store Rating',       unit:'score',   applicablePeriods:['Q2','Q3'], byCountry:true, bySource:false, ... }
 *   { id:'category_rank',  name:'Finance Category Rank',  unit:'rank',    applicablePeriods:['Q2','Q3'], byCountry:true, bySource:false, ... }
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
     * Q1 baseline CVR (%) by country → traffic source
     * country key: territory name as in App Store Connect, or 'all'
     * source keys: 'all' | 'search' | 'browse' | 'appref' | 'webref' | 'unavail'
     * INJECT REAL DATA HERE
     */
    baselineCVR: {
      all:              { all: 2.85, search: 3.20, browse: 1.80, appref: 5.20, webref: 2.10, unavail: 1.50 },
      'United States':  { all: 3.10, search: 3.50, browse: 1.95, appref: 5.80, webref: 2.30, unavail: 1.60 },
      'United Kingdom': { all: 2.70, search: 3.10, browse: 1.62, appref: 5.10, webref: 2.00, unavail: 1.40 },
      'Germany':        { all: 2.40, search: 2.80, browse: 1.40, appref: 4.70, webref: 1.80, unavail: 1.20 },
      'France':         { all: 2.55, search: 2.90, browse: 1.50, appref: 4.90, webref: 1.90, unavail: 1.30 },
      'Japan':          { all: 3.20, search: 3.80, browse: 2.10, appref: 6.10, webref: 2.50, unavail: 1.70 },
      'Korea, Republic of': { all: 3.50, search: 4.10, browse: 2.30, appref: 6.50, webref: 2.70, unavail: 1.90 },
      'Brazil':         { all: 2.20, search: 2.60, browse: 1.30, appref: 4.30, webref: 1.70, unavail: 1.10 },
      'India':          { all: 1.90, search: 2.20, browse: 1.10, appref: 3.80, webref: 1.50, unavail: 0.90 },
      'Australia':      { all: 2.80, search: 3.20, browse: 1.75, appref: 5.30, webref: 2.10, unavail: 1.45 },
      'Turkey':         { all: 2.10, search: 2.50, browse: 1.25, appref: 4.10, webref: 1.60, unavail: 1.05 },
      'Saudi Arabia':   { all: 2.30, search: 2.70, browse: 1.35, appref: 4.50, webref: 1.75, unavail: 1.15 },
      'Ukraine':        { all: 2.60, search: 3.00, browse: 1.55, appref: 5.00, webref: 1.95, unavail: 1.35 }
    },

    /*
     * Target multipliers — targets auto-calculate from these, never hardcode final values.
     * Q2: Q1_baseline × 1.15
     * Q3: Q2_actual   × 1.20  (compounds off Q2 actual, not Q1)
     */
    targetMultiplier: {
      Q2: { base: 'Q1_baseline', multiplier: 1.15 },
      Q3: { base: 'Q2_actual',   multiplier: 1.20 }
    },

    /*
     * Actual CVR (%) by period → country → source
     * INJECT REAL DATA HERE
     */
    actuals: {
      Q2: {
        all:              { all: 3.10, search: 3.58, browse: 1.95, appref: 5.45, webref: 2.22, unavail: 1.58 },
        'United States':  { all: 3.42, search: 3.89, browse: 2.15, appref: 6.10, webref: 2.45, unavail: 1.68 },
        'United Kingdom': { all: 2.88, search: 3.32, browse: 1.70, appref: 5.25, webref: 2.08, unavail: 1.45 },
        'Germany':        { all: 2.61, search: 3.05, browse: 1.48, appref: 4.88, webref: 1.85, unavail: 1.28 },
        'France':         { all: 2.74, search: 3.12, browse: 1.58, appref: 5.05, webref: 1.95, unavail: 1.38 },
        'Japan':          { all: 3.55, search: 4.18, browse: 2.28, appref: 6.32, webref: 2.62, unavail: 1.78 },
        'Korea, Republic of': { all: 3.82, search: 4.55, browse: 2.52, appref: 6.75, webref: 2.85, unavail: 1.98 },
        'Brazil':         { all: 2.38, search: 2.85, browse: 1.42, appref: 4.48, webref: 1.75, unavail: 1.18 },
        'India':          { all: 2.05, search: 2.44, browse: 1.19, appref: 3.95, webref: 1.58, unavail: 0.98 },
        'Australia':      { all: 3.02, search: 3.51, browse: 1.89, appref: 5.48, webref: 2.18, unavail: 1.52 },
        'Turkey':         { all: 2.25, search: 2.68, browse: 1.30, appref: 4.25, webref: 1.65, unavail: 1.12 },
        'Saudi Arabia':   { all: 2.48, search: 2.90, browse: 1.42, appref: 4.68, webref: 1.82, unavail: 1.22 },
        'Ukraine':        { all: 2.78, search: 3.22, browse: 1.62, appref: 5.18, webref: 2.02, unavail: 1.42 }
      },
      Q3: {
        /* INJECT REAL DATA HERE — Q3 starts July 2026 */
        all: { all: null, search: null, browse: null, appref: null, webref: null, unavail: null }
      }
    },

    levers: 'Screenshot A/B tests, metadata localisation, category keyword optimisation',
    notes: 'Q2 target = Q1 baseline × 1.15 · Q3 target = Q2 actual × 1.20 (compounding)'
  },

  {
    id: 'browse_downloads',
    name: 'Browse Traffic Downloads',
    description: 'New + Redownloads via App Store Browse',
    unit: 'count',
    decimals: 0,
    applicablePeriods: ['H1'],
    byCountry: false,
    bySource: false,

    targets: { H1: 15000 },

    /* INJECT REAL DATA HERE */
    actuals: { H1: 7200 },

    levers: 'In-App Events (seasonal / product launches), Finance Category Top 10 ranking, Editorial features',
    notes: 'H1 = April – September 2026. Cumulative new + redownloads from App Store Browse source only.'
  }
];
