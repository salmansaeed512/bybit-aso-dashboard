/**
 * fetch-asc.js — Pulls App Store Connect Analytics data and injects it into index.html.
 *
 * Uses only Node.js built-ins (no npm install needed).
 * Requires Node.js 18+.
 *
 * Env vars (set as GitHub Actions secrets):
 *   ASC_ISSUER_ID    — Issuer ID from App Store Connect → Integrations → API Keys
 *   ASC_KEY_ID       — Key ID of your API key
 *   ASC_PRIVATE_KEY  — Full content of the .p8 private key file
 *   ASC_APP_ID       — Apple ID of the app (numeric, e.g. 123456789)
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const https  = require('https');
const zlib   = require('zlib');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────

const ISSUER_ID   = process.env.ASC_ISSUER_ID;
const KEY_ID      = process.env.ASC_KEY_ID;
const PRIVATE_KEY = (process.env.ASC_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const APP_ID      = process.env.ASC_APP_ID;

const BASE_URL   = 'https://api.appstoreconnect.apple.com';
const ROOT       = path.join(__dirname, '..');
const STATE_FILE = path.join(ROOT, 'asc-state.json');
const INDEX_FILE = path.join(ROOT, 'index.html');

// ── Mappings ──────────────────────────────────────────────────────────────────

// App Store Connect source type → internal key used in _mem
const SRC_MAP = {
  'APP_STORE_SEARCH':      'search',
  'APP_STORE_BROWSE':      'browse',
  'APP_REFERRER':          'appref',
  'WEB_REFERRER':          'webref',
  'UNAVAILABLE':           'unavail',
  'INSTITUTIONAL_PURCHASE':'instit',
};

// ISO 3166-1 alpha-3 territory codes → display names used in _mem
const TERR_MAP = {
  AUS:'Australia',   BRA:'Brazil',        CAN:'Canada',
  CHN:'China',       EGY:'Egypt',         FRA:'France',
  DEU:'Germany',     GBR:'United Kingdom',HKG:'Hong Kong',
  IND:'India',       IDN:'Indonesia',     ISR:'Israel',
  JPN:'Japan',       KAZ:'Kazakhstan',    KOR:'South Korea',
  MYS:'Malaysia',    MEX:'Mexico',        NGA:'Nigeria',
  PAK:'Pakistan',    RUS:'Russia',        SAU:'Saudi Arabia',
  SGP:'Singapore',   ZAF:'South Africa',  LKA:'Sri Lanka',
  TWN:'Taiwan',      THA:'Thailand',      TUR:'Turkey',
  UKR:'Ukraine',     ARE:'UAE',           USA:'United States',
  VNM:'Vietnam',
  // alpha-2 codes as fallback
  AU:'Australia',    BR:'Brazil',         CA:'Canada',
  CN:'China',        EG:'Egypt',          FR:'France',
  DE:'Germany',      GB:'United Kingdom', HK:'Hong Kong',
  IN:'India',        ID:'Indonesia',      IL:'Israel',
  JP:'Japan',        KZ:'Kazakhstan',     KR:'South Korea',
  MY:'Malaysia',     MX:'Mexico',         NG:'Nigeria',
  PK:'Pakistan',     RU:'Russia',         SA:'Saudi Arabia',
  SG:'Singapore',    ZA:'South Africa',   LK:'Sri Lanka',
  TW:'Taiwan',       TH:'Thailand',       TR:'Turkey',
  UA:'Ukraine',      AE:'UAE',            US:'United States',
  VN:'Vietnam',
};

// ── JWT ───────────────────────────────────────────────────────────────────────

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const hdr = b64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const pld = b64url(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
  const signer = crypto.createSign('SHA256');
  signer.update(`${hdr}.${pld}`);
  const sig = signer.sign({ key: PRIVATE_KEY, dsaEncoding: 'ieee-p1363' });
  return `${hdr}.${pld}.${sig.toString('base64url')}`;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpsRequest(method, url, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = Object.assign({
      'Authorization': `Bearer ${generateToken()}`,
      'Content-Type': 'application/json',
    }, extraHeaders);
    if (bodyBuf) headers['Content-Length'] = bodyBuf.length;

    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers,
    };

    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

async function ascGet(path) {
  const res = await httpsRequest('GET', `${BASE_URL}${path}`, null);
  if (res.status >= 400) {
    throw new Error(`GET ${path} → HTTP ${res.status}\n${res.buf.toString()}`);
  }
  return JSON.parse(res.buf.toString());
}

async function ascPost(path, body) {
  const res = await httpsRequest('POST', `${BASE_URL}${path}`, body);
  if (res.status >= 400) {
    throw new Error(`POST ${path} → HTTP ${res.status}\n${res.buf.toString()}`);
  }
  return JSON.parse(res.buf.toString());
}

// Download a pre-signed URL (no auth header needed) and gunzip it
async function downloadGzip(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        zlib.gunzip(buf, (err, out) => {
          if (err) reject(err);
          else resolve(out.toString('utf8'));
        });
      });
    }).on('error', reject);
  });
}

// ── State ─────────────────────────────────────────────────────────────────────

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { requestId: null, lastDate: null }; }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── TSV parsing ───────────────────────────────────────────────────────────────

function parseTSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split('\t');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  });
}

// Detect actual column names from the first report row and log them for debugging
function detectFields(rows) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  console.log('  Report columns:', keys.join(' | '));

  // Flexible matching — Apple may use slightly different column names across regions
  function find(...candidates) {
    for (const c of candidates) {
      const match = keys.find(k => k.toLowerCase() === c.toLowerCase());
      if (match) return match;
    }
    return null;
  }

  return {
    date:        find('Date', 'Report Date'),
    territory:   find('Territory'),
    sourceType:  find('Source Type'),
    impressions: find('Impressions'),
    ftd:         find('First-Time Downloads', 'First Time Downloads'),
    rdl:         find('Re-Downloads', 'Redownloads', 'Re-downloads'),
    total:       find('Total Downloads'),
  };
}

// ── Data assembly ─────────────────────────────────────────────────────────────

function buildMemFromRows(rows) {
  const fields = detectFields(rows);
  if (!fields || !fields.date) {
    console.warn('  Could not detect required columns, skipping.');
    return {};
  }

  const mem = {};
  let skipped = 0;

  for (const row of rows) {
    const date     = row[fields.date];
    const terrCode = row[fields.territory];
    const srcType  = row[fields.sourceType];

    const terr = TERR_MAP[terrCode] || terrCode;
    const src  = SRC_MAP[srcType];

    if (!src || !date || !terr) { skipped++; continue; }

    if (!mem[terr])       mem[terr] = {};
    if (!mem[terr][date]) mem[terr][date] = {};
    const d = mem[terr][date];

    d[`imp_${src}`]   = (d[`imp_${src}`]   || 0) + (parseFloat(row[fields.impressions]) || 0);
    d[`ftd_${src}`]   = (d[`ftd_${src}`]   || 0) + (parseFloat(row[fields.ftd])         || 0);
    d[`rdl_${src}`]   = (d[`rdl_${src}`]   || 0) + (parseFloat(row[fields.rdl])         || 0);
    d[`total_${src}`] = (d[`total_${src}`] || 0) + (parseFloat(row[fields.total])       || 0);
  }

  if (skipped) console.log(`  Skipped ${skipped} rows (unmapped source or territory).`);
  return mem;
}

// Merge new data over existing — new dates overwrite, old dates preserved
function mergeMem(existing, incoming) {
  const merged = JSON.parse(JSON.stringify(existing));
  for (const [terr, dates] of Object.entries(incoming)) {
    if (!merged[terr]) merged[terr] = {};
    for (const [date, metrics] of Object.entries(dates)) {
      merged[terr][date] = metrics;
    }
  }
  return merged;
}

// ── index.html injection ──────────────────────────────────────────────────────

function injectMem(html, mem) {
  const safeJson = JSON.stringify(mem).replace(/<\/script>/gi, '<\\/script>');
  const lines = html.split('\n');
  const idx = lines.findIndex(l => l.trimStart().startsWith('var _mem = '));
  if (idx === -1) throw new Error('Could not find "var _mem = " in index.html');
  lines[idx] = `var _mem = ${safeJson};`;
  return lines.join('\n');
}

function extractExistingMem(html) {
  const lines = html.split('\n');
  const line = lines.find(l => l.trimStart().startsWith('var _mem = '));
  if (!line) return {};
  const jsonStart = line.indexOf('{');
  const jsonEnd   = line.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) return {};
  try { return JSON.parse(line.slice(jsonStart, jsonEnd + 1)); }
  catch { return {}; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  for (const [name, val] of [
    ['ASC_ISSUER_ID',   ISSUER_ID],
    ['ASC_KEY_ID',      KEY_ID],
    ['ASC_PRIVATE_KEY', PRIVATE_KEY],
    ['ASC_APP_ID',      APP_ID],
  ]) {
    if (!val) throw new Error(`Missing required env var: ${name}`);
  }

  console.log('=== ASC Data Fetch ===');
  const state = loadState();
  console.log('State:', JSON.stringify(state));

  // ── Step 1: Ensure an ONGOING report request exists ─────────────────────────
  if (!state.requestId) {
    console.log('\n[1/4] Creating ONGOING report request...');
    const resp = await ascPost('/v1/analyticsReportRequests', {
      data: {
        type: 'analyticsReportRequests',
        attributes: { accessType: 'ONGOING' },
        relationships: {
          app: { data: { type: 'apps', id: APP_ID } }
        }
      }
    });
    state.requestId = resp.data.id;
    saveState(state);
    console.log(`Created request ID: ${state.requestId}`);
    console.log('Apple generates the first batch of reports overnight.');
    console.log('This workflow will fetch real data starting from the next run.');
    return;
  }

  // ── Step 2: List available APP_STORE_ENGAGEMENT reports ─────────────────────
  console.log('\n[2/4] Fetching report list...');
  const reportsResp = await ascGet(
    `/v1/analyticsReportRequests/${state.requestId}/reports` +
    `?filter[reportType]=APP_STORE_ENGAGEMENT&limit=10`
  );
  const reports = reportsResp.data || [];
  console.log(`Found ${reports.length} report(s).`);
  if (!reports.length) {
    console.log('No reports available yet — Apple may still be generating them. Try again tomorrow.');
    return;
  }

  // ── Step 3: Download instances newer than lastDate ───────────────────────────
  console.log('\n[3/4] Downloading new report instances...');
  let allRows = [];

  for (const report of reports) {
    let cursor = '';
    do {
      const url = `/v1/analyticsReports/${report.id}/instances` +
        `?filter[granularity]=DAILY&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
      const resp = await ascGet(url);
      const instances = resp.data || [];
      cursor = resp.links && resp.links.next ? (new URL(resp.links.next).searchParams.get('cursor') || '') : '';

      for (const inst of instances) {
        const instDate = inst.attributes.processingDate;
        if (state.lastDate && instDate <= state.lastDate) continue;

        console.log(`  Downloading ${instDate}...`);
        const segsResp = await ascGet(`/v1/analyticsReportInstances/${inst.id}/segments?limit=10`);
        const segments = segsResp.data || [];

        for (const seg of segments) {
          const dlUrl = seg.attributes.url;
          if (!dlUrl) continue;
          const tsv  = await downloadGzip(dlUrl);
          const rows = parseTSV(tsv);
          console.log(`    ${rows.length} rows from segment ${seg.id}`);
          allRows = allRows.concat(rows);
        }
      }
    } while (cursor);
  }

  if (!allRows.length) {
    console.log('No new data to process.');
    return;
  }
  console.log(`Total rows: ${allRows.length}`);

  // ── Step 4: Build, merge, and inject ─────────────────────────────────────────
  console.log('\n[4/4] Merging data into index.html...');
  const newMem      = buildMemFromRows(allRows);
  const html        = fs.readFileSync(INDEX_FILE, 'utf8');
  const existingMem = extractExistingMem(html);
  const mergedMem   = mergeMem(existingMem, newMem);
  const newHtml     = injectMem(html, mergedMem);
  fs.writeFileSync(INDEX_FILE, newHtml, 'utf8');

  // Update state
  const allDates = allRows.map(r => r.Date || r['Report Date'] || '').filter(Boolean).sort();
  if (allDates.length) state.lastDate = allDates[allDates.length - 1];
  saveState(state);

  const newTerritories = Object.keys(newMem).length;
  const newDates       = new Set(allRows.map(r => r.Date || r['Report Date'] || '').filter(Boolean)).size;
  console.log(`Done. ${newDates} new days × ${newTerritories} territories. Data through ${state.lastDate}.`);
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message || err);
  process.exit(1);
});
