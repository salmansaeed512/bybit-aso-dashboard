'use strict';

/**
 * import-csv.js — Merges App Store Connect CSV exports into index.html _mem data.
 *
 * Usage:
 *   node scripts/import-csv.js <path-to-csv-folder>
 *
 * Handles all four metric types in any combination:
 *   Total Downloads, First-Time Downloads, Redownloads, Impressions
 *
 * Each CSV file covers one territory. Drop all files into one folder
 * (no subfolders needed) and run once — duplicates across files are summed.
 */

const fs   = require('fs');
const path = require('path');

// ── Mappings ──────────────────────────────────────────────────────────────────

const SOURCE_MAP = {
  'App Referrer':           'appref',
  'App Store Browse':       'browse',
  'App Store Search':       'search',
  'Institutional Purchase': 'instit',
  'Unavailable':            'unavail',
  'Web Referrer':           'webref',
};

// Longest suffixes first to avoid partial matches
const METRIC_SUFFIXES = [
  ['First-Time Downloads', 'ftd'],
  ['Total Downloads',      'total'],
  ['Re-Downloads',         'rdl'],
  ['Redownloads',          'rdl'],
  ['Impressions (Unique Devices)', 'imp'],
  ['Impressions',                 'imp'],
];

// Apple CSV territory names that don't match dashboard display names
const TERRITORY_ALIASES = {
  'Korea, Republic of': 'South Korea',
  'Korea':              'South Korea',
  'Taiwan, Province of China': 'Taiwan',
  'Viet Nam':           'Vietnam',
  'Russian Federation': 'Russia',
  'United Kingdom':     'United Kingdom',
};

function normaliseTerr(name) {
  return TERRITORY_ALIASES[name] || name;
}

// Minimal CSV field parser — handles quoted fields containing commas
function parseCSVLine(line) {
  const fields = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { fields.push(cur); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur);
  return fields.map(f => f.trim());
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// M/D/YY  →  YYYY-MM-DD
function parseDate(raw) {
  const [m, d, y] = raw.trim().split('/');
  return `20${y.padStart(2, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// "App Store Search Total Downloads"  →  "total_search"
function parseColumnKey(header) {
  for (const [suffix, metric] of METRIC_SUFFIXES) {
    if (header.endsWith(suffix)) {
      const srcStr = header.slice(0, header.length - suffix.length).trim();
      const src    = SOURCE_MAP[srcStr];
      if (src) return `${metric}_${src}`;
    }
  }
  return null;
}

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8')
    .split('\n').map(l => l.trim()).filter(Boolean);

  const terrLine = lines.find(l => l.startsWith('Territory,'));
  if (!terrLine) return null;
  const territory = normaliseTerr(parseCSVLine(terrLine)[1]);

  const dataStart = lines.findIndex(l => l.startsWith('Date,'));
  if (dataStart === -1) return null;

  const headers = parseCSVLine(lines[dataStart]);
  const colKeys = headers.map(h => parseColumnKey(h)); // null for Date col

  const data = {};

  for (let i = dataStart + 1; i < lines.length; i++) {
    const vals    = parseCSVLine(lines[i]);
    const dateRaw = vals[0];
    if (!dateRaw || !dateRaw.includes('/')) continue;

    const date = parseDate(dateRaw);
    if (!data[date]) data[date] = {};

    for (let j = 1; j < headers.length; j++) {
      const key = colKeys[j];
      if (!key) continue;
      const val = parseFloat(vals[j]) || 0;
      data[date][key] = (data[date][key] || 0) + val;
    }
  }

  return { territory, data };
}

// ── index.html helpers ────────────────────────────────────────────────────────

const INDEX_FILE = path.join(__dirname, '..', 'index.html');

function extractMem(html) {
  const line = html.split('\n').find(l => /^\s*var _mem\s*=/.test(l));
  if (!line) return {};
  const s = line.indexOf('{'), e = line.lastIndexOf('}');
  if (s === -1 || e === -1) return {};
  try { return JSON.parse(line.slice(s, e + 1)); } catch { return {}; }
}

function injectMem(html, mem) {
  const safe  = JSON.stringify(mem).replace(/<\/script>/gi, '<\\/script>');
  const lines = html.split('\n');
  const idx   = lines.findIndex(l => /^\s*var _mem\s*=/.test(l));
  if (idx === -1) throw new Error('Could not find "var _mem" in index.html');
  lines[idx] = `var _mem   = ${safe};`;
  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    console.error('Usage: node scripts/import-csv.js <path-to-csv-folder>');
    process.exit(1);
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .map(f => path.join(dir, f));

  if (!files.length) {
    console.error(`No CSV files found in: ${dir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} CSV file(s) in ${dir}\n`);

  // Build patch from all CSV files
  const patch = {};

  for (const file of files) {
    const parsed = parseCSV(file);
    if (!parsed) {
      console.log(`  SKIP  ${path.basename(file)} — could not detect territory or data section`);
      continue;
    }

    const { territory, data } = parsed;
    if (!patch[territory]) patch[territory] = {};

    for (const [date, metrics] of Object.entries(data)) {
      if (!patch[territory][date]) patch[territory][date] = {};
      for (const [key, val] of Object.entries(metrics)) {
        patch[territory][date][key] = (patch[territory][date][key] || 0) + val;
      }
    }

    const dates   = Object.keys(data).sort();
    const keys    = [...new Set(Object.values(data).flatMap(d => Object.keys(d)))].sort();
    console.log(`  OK    ${path.basename(file)}`);
    console.log(`        → ${territory}: ${dates.length} days (${dates[0]} – ${dates[dates.length - 1]})`);
    console.log(`        → metrics: ${keys.join(', ')}`);
  }

  // Merge patch into existing _mem
  const html    = fs.readFileSync(INDEX_FILE, 'utf8');
  const existing = extractMem(html);
  const merged  = JSON.parse(JSON.stringify(existing));

  for (const [territory, dates] of Object.entries(patch)) {
    if (!merged[territory]) merged[territory] = {};
    for (const [date, metrics] of Object.entries(dates)) {
      if (!merged[territory][date]) merged[territory][date] = {};
      for (const [key, val] of Object.entries(metrics)) {
        merged[territory][date][key] = (merged[territory][date][key] || 0) + val;
      }
    }
  }

  fs.writeFileSync(INDEX_FILE, injectMem(html, merged), 'utf8');

  // Summary
  const newTerritories = Object.keys(patch).sort();
  const newDates = new Set(
    Object.values(patch).flatMap(d => Object.keys(d))
  );
  console.log(`\nDone.`);
  console.log(`  Dates merged:       ${[...newDates].sort()[0]} – ${[...newDates].sort().pop()}`);
  console.log(`  Territories updated: ${newTerritories.length} — ${newTerritories.join(', ')}`);
  console.log(`  Total territories in dashboard: ${Object.keys(merged).length}`);
}

main();
