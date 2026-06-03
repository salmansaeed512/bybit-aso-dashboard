'use strict';

/**
 * import-ads-csv.js — Merges Apple Search Ads CSV exports into index.html _adsMem data.
 *
 * Usage:
 *   node scripts/import-ads-csv.js <path-to-csv-folder>
 *
 * Expected CSV format (Apple Search Ads Performance report):
 *   Date, Impressions, Installs (Tap-Through), Redownloads (Tap-Through), New Downloads (Tap-Through)
 *   Territory detected from "Filters applied: Country or Region = XX" line.
 */

const fs   = require('fs');
const path = require('path');

// ── Country code → display name (must match _mem territory names) ─────────────
const COUNTRY_MAP = {
  AU: 'Australia',
  BR: 'Brazil',
  EG: 'Egypt',
  IN: 'India',
  IL: 'Israel',
  KZ: 'Kazakhstan',
  KR: 'South Korea',
  MX: 'Mexico',
  PK: 'Pakistan',
  ZA: 'South Africa',
  TW: 'Taiwan',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  VN: 'Vietnam',
  // Additional countries
  US: 'United States',
  GB: 'United Kingdom',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  NG: 'Nigeria',
  MY: 'Malaysia',
  ID: 'Indonesia',
  JP: 'Japan',
  FR: 'France',
  DE: 'Germany',
  SG: 'Singapore',
  TH: 'Thailand',
  TR: 'Turkey',
  HK: 'Hong Kong',
  CN: 'China',
  CA: 'Canada',
  PH: 'Philippines',
  QA: 'Qatar',
  BH: 'Bahrain',
  OM: 'Oman',
  LK: 'Sri Lanka',
  VE: 'Venezuela',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Strip locale-formatted number commas then parse: "5,895" → 5895
function parseNum(raw) {
  return parseFloat((raw || '').replace(/,/g, '')) || 0;
}

// MM/DD/YYYY  →  YYYY-MM-DD
function parseDate(raw) {
  const [m, d, y] = raw.trim().split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseAdsCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8')
    .replace(/^﻿/, '')          // strip BOM if present
    .split('\n').map(l => l.trim()).filter(Boolean);

  // Detect country code from "Filters applied: Country or Region = XX"
  const filterLine = lines.find(l => l.includes('Country or Region'));
  if (!filterLine) return null;
  const codeMatch = filterLine.match(/Country or Region\s*=\s*([A-Z]{2})/);
  if (!codeMatch) return null;
  const code      = codeMatch[1];
  const territory = COUNTRY_MAP[code] || code;

  // Find data header row
  const headerIdx = lines.findIndex(l => /^"?Date"?,/.test(l));
  if (headerIdx === -1) return null;

  const headers = parseCSVLine(lines[headerIdx]);
  const colImp   = headers.indexOf('Impressions');
  const colTotal = headers.findIndex(h => h.startsWith('Installs'));
  const colRdl   = headers.findIndex(h => h.startsWith('Redownloads'));
  const colFtd   = headers.findIndex(h => h.startsWith('New Downloads'));

  if (colImp === -1 || colTotal === -1) return null;

  const data = {};

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (!vals[0] || !vals[0].includes('/')) continue;

    const date = parseDate(vals[0]);
    data[date] = {
      imp:   parseNum(vals[colImp]),
      total: parseNum(vals[colTotal]),
      rdl:   colRdl !== -1 ? parseNum(vals[colRdl]) : 0,
      ftd:   colFtd !== -1 ? parseNum(vals[colFtd]) : 0,
    };
  }

  return { territory, code, data };
}

// ── index.html helpers ────────────────────────────────────────────────────────

const INDEX_FILE = path.join(__dirname, '..', 'index.html');

function extractAdsMem(html) {
  const line = html.split('\n').find(l => /^\s*var _adsMem\s*=/.test(l));
  if (!line) return {};
  const s = line.indexOf('{'), e = line.lastIndexOf('}');
  if (s === -1 || e === -1) return {};
  try { return JSON.parse(line.slice(s, e + 1)); } catch { return {}; }
}

function injectAdsMem(html, mem) {
  const safe  = JSON.stringify(mem).replace(/<\/script>/gi, '<\\/script>');
  const lines = html.split('\n');
  const idx   = lines.findIndex(l => /^\s*var _adsMem\s*=/.test(l));
  if (idx === -1) throw new Error('Could not find "var _adsMem" in index.html');
  lines[idx] = `var _adsMem = ${safe};`;
  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    console.error('Usage: node scripts/import-ads-csv.js <path-to-csv-folder>');
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

  const patch = {};

  for (const file of files) {
    const parsed = parseAdsCSV(file);
    if (!parsed) {
      console.log(`  SKIP  ${path.basename(file)} — not an Apple Ads performance report`);
      continue;
    }

    const { territory, code, data } = parsed;
    if (!patch[territory]) patch[territory] = {};

    for (const [date, metrics] of Object.entries(data)) {
      patch[territory][date] = metrics; // overwrite — one file per country, no accumulation needed
    }

    const dates = Object.keys(data).sort();
    console.log(`  OK    ${path.basename(file)}`);
    console.log(`        → ${territory} (${code}): ${dates.length} days (${dates[0]} – ${dates[dates.length - 1]})`);
  }

  const html     = fs.readFileSync(INDEX_FILE, 'utf8');
  const existing = extractAdsMem(html);
  const merged   = JSON.parse(JSON.stringify(existing));

  for (const [territory, dates] of Object.entries(patch)) {
    if (!merged[territory]) merged[territory] = {};
    for (const [date, metrics] of Object.entries(dates)) {
      merged[territory][date] = metrics;
    }
  }

  fs.writeFileSync(INDEX_FILE, injectAdsMem(html, merged), 'utf8');

  const updatedTerritories = Object.keys(patch).sort();
  const allDates = new Set(Object.values(patch).flatMap(d => Object.keys(d)));
  const sortedDates = [...allDates].sort();
  console.log(`\nDone.`);
  console.log(`  Dates merged:        ${sortedDates[0]} – ${sortedDates[sortedDates.length - 1]}`);
  console.log(`  Territories updated: ${updatedTerritories.length} — ${updatedTerritories.join(', ')}`);
  console.log(`  Total territories in _adsMem: ${Object.keys(merged).length}`);
}

main();
