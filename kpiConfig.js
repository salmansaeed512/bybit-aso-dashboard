/* ── Period definitions ──────────────────────────────────────── */
var OKR_PERIODS = {
  Q4_2025: { label: 'Q4 2025', start: '2025-10-01', end: '2025-12-31' },
  Q1:      { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31' },
  Q2:      { label: 'Q2 2026', start: '2026-04-01', end: '2026-06-30' },
  Q3:      { label: 'Q3 2026', start: '2026-07-01', end: '2026-09-30' },
  H1:      { label: 'H1 2026', start: '2026-04-01', end: '2026-09-30' }
};

/*
 * KPI_DEFS — structural config only. No hardcoded actual values.
 * Actuals are computed live from the active data store.
 *
 * targetMultiplier bases:
 *   Q4_2025_actual — uses Q4 2025 actuals × multiplier  → Q1 target
 *   Q1_actual      — uses Q1 2026 actuals × multiplier  → Q2 / H1 target
 *   Q2_actual      — uses Q2 2026 actuals × multiplier  → Q3 target
 */
var KPI_DEFS = [

  /* ── OKR Group: Improve Search CVR ───────────────────────────── */
  {
    id: 'search_cvr',
    group: 'improve_search_cvr',
    groupLabel: 'Improve Search CVR',
    isLead: true,
    name: 'Search CVR',
    description: 'CVR (Search) — Total Downloads ÷ Impressions × 100',
    unit: 'percent',
    decimals: 2,
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',

    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.10 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },

    fallbackBaseline: {
      all: { search: 3.20 }
    },

    levers: 'Screenshot A/B tests, metadata localisation, search keyword optimisation',
    notes: 'CVR = (First-Time Downloads + Redownloads) ÷ Impressions × 100. Source locked to Search. Q1 = Q4 2025 × 1.10 · Q2 = Q1 × 1.10 · Q3 = Q2 × 1.15 · H1 = Q1 × 1.265 (compounded).'
  },

  {
    id: 'search_impressions',
    group: 'improve_search_cvr',
    isLead: false,
    informational: true,
    name: 'Search Impressions',
    description: 'Total impressions via App Store / Play Store Search',
    unit: 'count',
    decimals: 0,
    field: 'imp',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    levers: 'Keyword ranking, title / subtitle optimisation',
    notes: 'Reference only — lower impressions can indicate more targeted, high-intent traffic. Source locked to Search.'
  },

  {
    id: 'search_ftd',
    group: 'improve_search_cvr',
    isLead: false,
    name: 'First-Time Downloads (Search)',
    description: 'First-Time Downloads via Search',
    unit: 'count',
    decimals: 0,
    field: 'ftd',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.10 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR improvements, keyword visibility',
    notes: 'Source locked to Search.'
  },

  {
    id: 'search_rdl',
    group: 'improve_search_cvr',
    isLead: false,
    name: 'Redownloads (Search)',
    description: 'Redownloads via Search',
    unit: 'count',
    decimals: 0,
    field: 'rdl',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.10 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'Re-engagement campaigns, seasonal moments',
    notes: 'Source locked to Search.'
  },

  {
    id: 'search_total',
    group: 'improve_search_cvr',
    isLead: false,
    name: 'Total Downloads (Search)',
    description: 'Total Downloads (First-Time + Redownloads) via Search',
    unit: 'count',
    decimals: 0,
    field: 'total',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.10 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR + impression volume combined',
    notes: 'Total Downloads = First-Time Downloads + Redownloads. Source locked to Search.'
  },

  /* ── Standalone KPI: Browse Traffic Downloads ─────────────────── */
  {
    id: 'browse_downloads',
    name: 'Browse Traffic Downloads',
    description: 'Total Downloads (First-Time + Redownloads) via Browse',
    unit: 'count',
    decimals: 0,
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    byCountry: false,
    bySource: false,

    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.10 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },

    levers: 'In-App Events (seasonal/product launches), Finance Category Top 10 ranking, Editorial features',
    notes: 'Source locked to Browse. Q1 = Q4 2025 × 1.10 · Q2 = Q1 × 1.10 · Q3 = Q2 × 1.15 · H1 = Q1 × 1.265 (compounded).'
  }
];
