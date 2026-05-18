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
 *
 * applicableStores — if set, card only renders for those stores.
 *                    Omit to show for all stores.
 * targetMultiplier bases:
 *   Q4_2025_actual → Q1 target   (seasonal-adjusted ×1.05)
 *   Q1_actual      → Q2 / H1 target
 *   Q2_actual      → Q3 target
 */
var KPI_DEFS = [

  /* ═══════════════════════════════════════════════════════════════
     iOS — Improve Search CVR
  ═══════════════════════════════════════════════════════════════ */
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
    applicableStores: ['ios'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    fallbackBaseline: { all: { search: 3.20 } },
    levers: 'Screenshot A/B tests, metadata localisation, search keyword optimisation',
    notes: 'CVR = (FTD + RDL) ÷ Impressions × 100. Source locked to Search.'
  },
  {
    id: 'search_impressions',
    group: 'improve_search_cvr',
    isLead: false,
    informational: true,
    name: 'Search Impressions',
    description: 'Total impressions via App Store Search',
    unit: 'count',
    decimals: 0,
    field: 'imp',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['ios'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    levers: 'Keyword ranking, title / subtitle optimisation',
    notes: 'Reference only — lower impressions can indicate more targeted traffic.'
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
    applicableStores: ['ios'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
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
    applicableStores: ['ios'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
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
    applicableStores: ['ios'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR + impression volume combined',
    notes: 'Source locked to Search.'
  },

  /* ── iOS — Browse Traffic Downloads ──────────────────────────── */
  {
    id: 'browse_downloads',
    name: 'Browse Traffic Downloads',
    description: 'Total Downloads (First-Time + Redownloads) via Browse',
    unit: 'count',
    decimals: 0,
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['ios'],
    byCountry: false,
    bySource: false,
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'In-App Events, Finance Category Top 10 ranking, Editorial features',
    notes: 'Source locked to Browse.'
  },

  /* ═══════════════════════════════════════════════════════════════
     Play Store — Improve Search CVR
  ═══════════════════════════════════════════════════════════════ */
  {
    id: 'and_search_cvr',
    group: 'and_improve_search_cvr',
    groupLabel: 'Improve Search CVR',
    isLead: true,
    name: 'Search CVR',
    description: 'CVR (Search) — Total Downloads ÷ Impressions × 100',
    unit: 'percent',
    decimals: 2,
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'Store listing A/B tests, metadata localisation, keyword optimisation',
    notes: 'CVR = (FTD + RDL) ÷ Impressions × 100. Source locked to Search.'
  },
  {
    id: 'and_search_impressions',
    group: 'and_improve_search_cvr',
    isLead: false,
    informational: true,
    name: 'Search Impressions',
    description: 'Total impressions via Play Store Search',
    unit: 'count',
    decimals: 0,
    field: 'imp',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    levers: 'Keyword ranking, title / short description optimisation',
    notes: 'Reference only — lower impressions can indicate more targeted traffic.'
  },
  {
    id: 'and_search_ftd',
    group: 'and_improve_search_cvr',
    isLead: false,
    name: 'First-Time Downloads (Search)',
    description: 'First-Time Downloads via Search',
    unit: 'count',
    decimals: 0,
    field: 'ftd',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR improvements, keyword visibility',
    notes: 'Source locked to Search.'
  },
  {
    id: 'and_search_rdl',
    group: 'and_improve_search_cvr',
    isLead: false,
    name: 'Redownloads (Search)',
    description: 'Redownloads via Search',
    unit: 'count',
    decimals: 0,
    field: 'rdl',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'Re-engagement campaigns, seasonal moments',
    notes: 'Source locked to Search.'
  },
  {
    id: 'and_search_total',
    group: 'and_improve_search_cvr',
    isLead: false,
    name: 'Total Downloads (Search)',
    description: 'Total Downloads (First-Time + Redownloads) via Search',
    unit: 'count',
    decimals: 0,
    field: 'total',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'search',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR + impression volume combined',
    notes: 'Source locked to Search.'
  },

  /* ═══════════════════════════════════════════════════════════════
     Play Store — Grow Explore Traffic
  ═══════════════════════════════════════════════════════════════ */
  {
    id: 'and_explore_cvr',
    group: 'and_grow_explore',
    groupLabel: 'Grow Explore Traffic',
    isLead: true,
    name: 'Explore CVR',
    description: 'CVR (Explore) — Total Downloads ÷ Impressions × 100',
    unit: 'percent',
    decimals: 2,
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'browse',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'Store listing visuals, feature graphic, icon A/B tests, category ranking',
    notes: 'CVR = (FTD + RDL) ÷ Impressions × 100. Source locked to Explore (Browse).'
  },
  {
    id: 'and_explore_impressions',
    group: 'and_grow_explore',
    isLead: false,
    informational: true,
    name: 'Explore Impressions',
    description: 'Total impressions via Play Store Explore',
    unit: 'count',
    decimals: 0,
    field: 'imp',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'browse',
    levers: 'Category ranking, editorial features, in-app events',
    notes: 'Reference only. Source locked to Explore (Browse).'
  },
  {
    id: 'and_explore_ftd',
    group: 'and_grow_explore',
    isLead: false,
    name: 'First-Time Downloads (Explore)',
    description: 'First-Time Downloads via Explore',
    unit: 'count',
    decimals: 0,
    field: 'ftd',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'browse',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR improvements, category ranking, feature graphic',
    notes: 'Source locked to Explore (Browse).'
  },
  {
    id: 'and_explore_rdl',
    group: 'and_grow_explore',
    isLead: false,
    name: 'Redownloads (Explore)',
    description: 'Redownloads via Explore',
    unit: 'count',
    decimals: 0,
    field: 'rdl',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'browse',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'Re-engagement campaigns, seasonal moments',
    notes: 'Source locked to Explore (Browse).'
  },
  {
    id: 'and_explore_total',
    group: 'and_grow_explore',
    isLead: false,
    name: 'Total Downloads (Explore)',
    description: 'Total Downloads (First-Time + Redownloads) via Explore',
    unit: 'count',
    decimals: 0,
    field: 'total',
    applicablePeriods: ['Q1', 'Q2', 'Q3', 'H1'],
    applicableStores: ['android'],
    byCountry: true,
    bySource: false,
    lockedSource: 'browse',
    targetMultiplier: {
      Q1: { base: 'Q4_2025_actual', multiplier: 1.05 },
      Q2: { base: 'Q1_actual',      multiplier: 1.10 },
      Q3: { base: 'Q2_actual',      multiplier: 1.15 },
      H1: { base: 'Q1_actual',      multiplier: 1.265 }
    },
    levers: 'CVR + Explore impression volume combined',
    notes: 'Source locked to Explore (Browse).'
  }
];
