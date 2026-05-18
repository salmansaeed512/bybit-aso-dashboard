/* ── OKR Tracker ─────────────────────────────────────────────── */

var _okrPeriod     = 'Q2';
var _okrCountry    = 'all';
var _okrSource     = 'all';
var _okrAdsMode    = 'with';
var _okrStore      = 'ios';   /* 'ios' | 'android' | 'unified' */
var _okrPacingView = 'monthly'; /* 'weekly' | 'monthly' | 'quarterly' | 'h1' */

/* ── Data access ─────────────────────────────────────────────── */

function _okrData() {
  if (_okrStore === 'android') return _memAnd;
  if (_okrStore === 'unified') {
    var prev = _activeStore;
    _activeStore = 'unified';
    var d = _getStoreData(_okrAdsMode);
    _activeStore = prev;
    return d;
  }
  /* iOS */
  return _okrAdsMode === 'without' ? applyAdsAdjustment(_mem, _adsMem) : _mem;
}

/* ── Public API ──────────────────────────────────────────────── */

function renderOKR() {
  _syncOKRFilterUI();
  renderOKRCards();
}

function setOKRPeriod(p) {
  _okrPeriod = p;
  /* H1 pacing only valid for H1 period */
  if (p !== 'H1' && _okrPacingView === 'h1') _okrPacingView = 'monthly';
  renderOKR();
}

function setOKRCountry(v) {
  _okrCountry = v;
  renderOKRCards();
}

function setOKRSource(v) {
  _okrSource = v;
  renderOKRCards();
}

function setOKRAdsMode(m) {
  _okrAdsMode = m;
  var wb = document.getElementById('okr-am-with');
  var ob = document.getElementById('okr-am-without');
  if (wb) wb.classList.toggle('active', m === 'with');
  if (ob) ob.classList.toggle('active', m === 'without');
  renderOKRCards();
}

function setOKRStore(s) {
  _okrStore = s;
  /* Apple Ads only meaningful for iOS */
  if (s !== 'ios' && _okrAdsMode !== 'with') {
    _okrAdsMode = 'with';
  }
  /* Reset country — country list differs per store */
  _okrCountry = 'all';
  var cs = document.getElementById('okr-country');
  if (cs) { cs._okrPopulated = false; cs.value = 'all'; }
  renderOKR();
}

function setOKRPacingView(v) {
  _okrPacingView = v;
  renderOKRCards();
}

/* ── Filter UI sync ──────────────────────────────────────────── */

function _syncOKRFilterUI() {
  /* Period buttons */
  ['Q2', 'Q3', 'H1'].forEach(function(p) {
    var b = document.getElementById('okr-period-' + p);
    if (b) b.classList.toggle('active', p === _okrPeriod);
  });

  /* Platform (store) buttons */
  ['ios', 'android', 'unified'].forEach(function(s) {
    var b = document.getElementById('okr-store-' + s);
    if (b) b.classList.toggle('active', s === _okrStore);
  });

  /* Pacing view buttons */
  ['weekly', 'monthly', 'quarterly', 'h1'].forEach(function(v) {
    var b = document.getElementById('okr-pacing-' + v);
    if (!b) return;
    b.style.display = (v === 'h1' && _okrPeriod !== 'H1') ? 'none' : '';
    b.classList.toggle('active', v === _okrPacingView);
  });

  /* Country dropdown — repopulate if store changed */
  var cs = document.getElementById('okr-country');
  if (cs && !cs._okrPopulated) {
    var storeData = _okrData();
    var countries = Object.keys(storeData).filter(function(t) {
      return Object.keys(storeData[t]).length > 0;
    }).sort();
    cs.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(function(c) {
      cs.innerHTML += '<option value="' + _esc(c) + '">' + _esc(c) + '</option>';
    });
    cs._okrPopulated = true;
  }
  if (cs) cs.value = _okrCountry;

  /* Source dropdown — options depend on platform */
  var ss = document.getElementById('okr-source');
  if (ss) {
    var srcOpts = _okrStore === 'unified'
      ? [['all','All Channels'],['organic','Organic'],['paid','Paid']]
      : _okrStore === 'android'
        ? [['all','All Sources'],['search','Search'],['browse','Explore'],['appref','Ads & Referral']]
        : [['all','All Sources'],['search','Search'],['browse','Browse'],['appref','App Referrer'],['webref','Web Referrer']];
    var curSrc = ss.value;
    ss.innerHTML = srcOpts.map(function(o) {
      return '<option value="' + o[0] + '">' + o[1] + '</option>';
    }).join('');
    var valid = srcOpts.some(function(o) { return o[0] === curSrc; });
    ss.value = valid ? curSrc : 'all';
    if (!valid) _okrSource = 'all';
  }

  /* Apple Ads toggle — only meaningful for iOS */
  var adsGroup = document.getElementById('fg-okr-ads-mode');
  if (adsGroup) adsGroup.style.display = (_okrStore !== 'ios') ? 'none' : '';
  var wb = document.getElementById('okr-am-with');
  var ob = document.getElementById('okr-am-without');
  if (wb) wb.classList.toggle('active', _okrAdsMode === 'with');
  if (ob) ob.classList.toggle('active', _okrAdsMode === 'without');
}

/* ── Card rendering ──────────────────────────────────────────── */

function renderOKRCards() {
  var container = document.getElementById('okr-cards');
  if (!container) return;

  var activeKPIs = KPI_DEFS.filter(function(kpi) {
    return kpi.applicablePeriods.indexOf(_okrPeriod) >= 0;
  });

  if (!activeKPIs.length) {
    container.innerHTML = '<div class="okr-empty">No KPIs configured for ' + _esc(_okrPeriod) + '</div>';
    return;
  }

  /* Group KPIs — collect group order and membership */
  var groupOrder = [];
  var groupMap   = {};
  activeKPIs.forEach(function(kpi) {
    var g = kpi.group || ('__solo__' + kpi.id);
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
    groupMap[g].push(kpi);
  });

  var html = '';
  groupOrder.forEach(function(g) {
    var members = groupMap[g];
    var isGrouped = members.length > 1 || members[0].group;

    if (isGrouped) {
      var label = members[0].groupLabel || '';
      html += '<div class="okr-group">';
      if (label) html += '<div class="okr-group-label">' + _esc(label) + '</div>';
      members.forEach(function(kpi) {
        html += _buildOKRCard(kpi, _okrPeriod, _okrCountry, _okrSource);
      });
      html += '</div>';
    } else {
      html += _buildOKRCard(members[0], _okrPeriod, _okrCountry, _okrSource);
    }
  });

  container.innerHTML = html;
}

/* ── Single card builder ─────────────────────────────────────── */

function _buildOKRCard(kpi, period, country, source) {
  /* Locked source overrides the filter */
  var effectiveSource = kpi.lockedSource || source;

  var target = _getKPITarget(kpi, period, country, effectiveSource);
  var actual = _getKPIActual(kpi, period, country, effectiveSource);

  var pctGoal = (target !== null && actual !== null && target > 0)
    ? actual / target * 100
    : null;

  var periodLabel = OKR_PERIODS[period] ? OKR_PERIODS[period].label : period;
  var targetStr   = target !== null ? _fmtKPI(kpi, target) : '—';
  var actualStr   = actual !== null ? _fmtKPI(kpi, actual) : 'No data yet';

  var colorClass = 'okr-red';
  if (pctGoal !== null) {
    if      (pctGoal >= 80) colorClass = 'okr-green';
    else if (pctGoal >= 50) colorClass = 'okr-amber';
  }

  var progressHTML;
  if (pctGoal !== null) {
    var barWidth = Math.min(pctGoal, 100).toFixed(1);
    progressHTML =
      '<div class="okr-progress-wrap">' +
        '<div class="okr-progress-track">' +
          '<div class="okr-progress-fill ' + colorClass + '" style="width:' + barWidth + '%"></div>' +
        '</div>' +
        '<span class="okr-pct-label ' + colorClass + '">' + Math.min(pctGoal, 150).toFixed(1) + '% to goal</span>' +
      '</div>';
  } else {
    progressHTML =
      '<div class="okr-progress-wrap">' +
        '<span class="okr-pct-label okr-grey">Awaiting data</span>' +
      '</div>';
  }

  /* Dim tag: Platform · Source · Country [· Organic Only] */
  var dimParts = [_okrStoreName(_okrStore)];
  if (kpi.bySource)   dimParts.push(kpi.lockedSource ? _srcLabel(kpi.lockedSource) + ' (locked)' : _srcLabel(effectiveSource));
  else if (kpi.lockedSource) dimParts.push(_srcLabel(kpi.lockedSource) + ' (locked)');
  if (kpi.byCountry)  dimParts.push(country !== 'all' ? country : 'All Countries');
  if (_okrAdsMode === 'without') dimParts.push('⊖ Organic Only');
  var dimTag = '<div class="okr-dim-tag">' + _esc(dimParts.join(' · ')) + '</div>';

  var pacingHTML = _pacingSection(kpi, period, actual, target);

  var notesHTML = kpi.notes
    ? '<div class="okr-notes">' + _esc(kpi.notes) + '</div>'
    : '';

  var cardClass = 'okr-card' + (kpi.group && !kpi.isLead ? ' okr-submetric' : '');

  return (
    '<div class="' + cardClass + '">' +
      '<div class="okr-card-header">' +
        '<div>' +
          '<div class="okr-card-name">' + _esc(kpi.name) + '</div>' +
          '<div class="okr-card-desc">' + _esc(kpi.description) + '</div>' +
          dimTag +
        '</div>' +
        '<div class="okr-period-badge">' + _esc(periodLabel) + '</div>' +
      '</div>' +
      '<div class="okr-metrics-row">' +
        '<div class="okr-metric">' +
          '<div class="okr-metric-label">Target</div>' +
          '<div class="okr-metric-value">' + targetStr + '</div>' +
        '</div>' +
        '<div class="okr-metric">' +
          '<div class="okr-metric-label">Current</div>' +
          '<div class="okr-metric-value">' + actualStr + '</div>' +
        '</div>' +
      '</div>' +
      progressHTML +
      pacingHTML +
      '<div class="okr-levers"><strong>Levers:</strong> ' + _esc(kpi.levers) + '</div>' +
      notesHTML +
    '</div>'
  );
}

/* ── Pacing section ──────────────────────────────────────────── */

function _pacingSection(kpi, period, actual, target) {
  if (actual === null || target === null || target <= 0) return '';

  var p = OKR_PERIODS[period];
  if (!p) return '';

  var today = new Date();
  var pStart = new Date(p.start + 'T00:00:00Z');
  var pEnd   = new Date(p.end   + 'T23:59:59Z');
  var now    = today < pStart ? pStart : (today > pEnd ? pEnd : today);

  var totalDays   = Math.round((pEnd   - pStart) / 86400000) + 1;
  var elapsedDays = Math.max(1, Math.round((now   - pStart) / 86400000) + 1);
  var paceRatio   = elapsedDays / totalDays;

  /* CVR — rate metric, doesn't accumulate */
  if (kpi.unit === 'percent') {
    var status = actual >= target * 0.95 ? '✓ On Pace'
               : actual >= target * 0.80 ? '⚠ Slightly Behind'
               : '✗ Behind Pace';
    var statusCls = actual >= target * 0.95 ? 'okr-pace-ok'
                  : actual >= target * 0.80 ? 'okr-pace-warn'
                  : 'okr-pace-bad';
    return (
      '<div class="okr-pacing">' +
        '<div class="okr-pacing-row">' +
          '<span class="okr-pacing-label">Period elapsed</span>' +
          '<span class="okr-pacing-val">' + elapsedDays + ' / ' + totalDays + ' days (' + (paceRatio * 100).toFixed(0) + '%)</span>' +
        '</div>' +
        '<div class="okr-pacing-row">' +
          '<span class="okr-pacing-label">Required CVR</span>' +
          '<span class="okr-pacing-val">' + _fmtKPI(kpi, target) + '</span>' +
        '</div>' +
        '<div class="okr-pacing-row">' +
          '<span class="okr-pacing-label">Current CVR</span>' +
          '<span class="okr-pacing-val">' + _fmtKPI(kpi, actual) + '</span>' +
        '</div>' +
        '<div class="okr-pacing-status ' + statusCls + '">' + status + '</div>' +
      '</div>'
    );
  }

  /* Count metric */
  var pv = _okrPacingView;
  var periodLabel, totalPeriods, elapsedPeriods;

  if (pv === 'weekly') {
    periodLabel  = 'wk';
    totalPeriods = Math.ceil(totalDays / 7);
    elapsedPeriods = Math.max(1, elapsedDays / 7);
  } else if (pv === 'quarterly') {
    periodLabel  = 'qtr';
    totalPeriods = Math.ceil(totalDays / 91);
    elapsedPeriods = Math.max(1, elapsedDays / 91);
  } else if (pv === 'h1') {
    periodLabel  = 'H1';
    totalPeriods = 1;
    elapsedPeriods = paceRatio;
  } else {
    /* monthly (default) */
    periodLabel  = 'mo';
    totalPeriods = Math.ceil(totalDays / 30.44);
    elapsedPeriods = Math.max(1, elapsedDays / 30.44);
  }

  var avgPerPeriod      = actual / elapsedPeriods;
  var remainingPeriods  = Math.max(0, totalPeriods - elapsedPeriods);
  var requiredPerPeriod = remainingPeriods > 0 ? (target - actual) / remainingPeriods : 0;
  var projectedTotal    = avgPerPeriod * totalPeriods;

  var onPaceRatio = projectedTotal / target;
  var status    = onPaceRatio >= 0.95 ? '✓ On Pace'
                : onPaceRatio >= 0.75 ? '⚠ Slightly Behind'
                : '✗ Behind Pace';
  var statusCls = onPaceRatio >= 0.95 ? 'okr-pace-ok'
                : onPaceRatio >= 0.75 ? 'okr-pace-warn'
                : 'okr-pace-bad';

  var elapsedDisp  = elapsedPeriods.toFixed(pv === 'h1' ? 2 : 1);
  var totalDisp    = totalPeriods.toFixed(pv === 'h1' ? 0 : 1);
  var reqStr = requiredPerPeriod > 0
    ? Math.round(requiredPerPeriod).toLocaleString() + ' / ' + periodLabel
    : 'Target already achieved';

  return (
    '<div class="okr-pacing">' +
      '<div class="okr-pacing-row">' +
        '<span class="okr-pacing-label">Progress</span>' +
        '<span class="okr-pacing-val">' + elapsedDisp + ' / ' + totalDisp + ' ' + periodLabel + 's elapsed</span>' +
      '</div>' +
      '<div class="okr-pacing-row">' +
        '<span class="okr-pacing-label">Avg so far</span>' +
        '<span class="okr-pacing-val">' + Math.round(avgPerPeriod).toLocaleString() + ' / ' + periodLabel + '</span>' +
      '</div>' +
      '<div class="okr-pacing-row">' +
        '<span class="okr-pacing-label">Required to hit target</span>' +
        '<span class="okr-pacing-val">' + reqStr + '</span>' +
      '</div>' +
      '<div class="okr-pacing-status ' + statusCls + '">' + status + '</div>' +
    '</div>'
  );
}

/* ── Date range helper ───────────────────────────────────────── */

function _okrDateRange(period) {
  var p = OKR_PERIODS[period];
  return p ? { start: p.start, end: p.end } : null;
}

/* ── Live data resolvers ─────────────────────────────────────── */

/* CVR for a period/country/source using total downloads (ftd + rdl) */
function _cvrFromMem(period, country, source) {
  var dr = _okrDateRange(period);
  if (!dr) return null;
  var bucket = rangedBucket(_okrData(), country, source, dr.start, dr.end);
  return calcCVR(bucket);
}

/* Count metric (imp / ftd / rdl / total) for a period/country/source */
function _countFromMem(period, country, source, field) {
  var dr = _okrDateRange(period);
  if (!dr) return null;
  var bucket = rangedBucket(_okrData(), country, source, dr.start, dr.end);
  var v = bucket[field] || 0;
  return v > 0 ? v : null;
}

/* Browse total downloads (ftd_browse + rdl_browse) */
function _browseDownloadsFromMem(period, country) {
  var dr = _okrDateRange(period);
  if (!dr) return null;
  var bucket = rangedBucket(_okrData(), country, 'browse', dr.start, dr.end);
  return bucket.total > 0 ? bucket.total : null;
}

/* ── Target resolution ───────────────────────────────────────── */

function _getKPITarget(kpi, period, country, source) {
  if (kpi.targets && kpi.targets[period] !== undefined) return kpi.targets[period];

  if (kpi.targetMultiplier && kpi.targetMultiplier[period]) {
    var tm   = kpi.targetMultiplier[period];
    var base = null;

    if (tm.base === 'Q1_actual') {
      base = _getKPIActual(kpi, 'Q1', country, source);
      if (base === null && kpi.fallbackBaseline) {
        base = _nestedVal(kpi.fallbackBaseline, country, source);
      }
    } else if (tm.base === 'Q2_actual') {
      base = _getKPIActual(kpi, 'Q2', country, source);
      /* If Q2 not yet complete, fall back to Q2 target */
      if (base === null) {
        var q2tm = kpi.targetMultiplier['Q2'];
        if (q2tm) {
          var q1base = _getKPIActual(kpi, 'Q1', country, source);
          if (q1base === null && kpi.fallbackBaseline) q1base = _nestedVal(kpi.fallbackBaseline, country, source);
          if (q1base !== null) base = q1base * q2tm.multiplier;
        }
      }
    }

    return base !== null ? base * tm.multiplier : null;
  }
  return null;
}

/* ── Actual resolution ───────────────────────────────────────── */

function _getKPIActual(kpi, period, country, source) {
  if (kpi.id === 'cvr' || kpi.id === 'search_cvr') {
    return _cvrFromMem(period, country, source);
  }
  if (kpi.id === 'browse_downloads') {
    return _browseDownloadsFromMem(period, country);
  }
  /* Count KPIs with a field property */
  if (kpi.field) {
    return _countFromMem(period, country, source, kpi.field);
  }
  return null;
}

/* ── Fallback nested config lookup ──────────────────────────── */

function _nestedVal(obj, country, source) {
  var cKey = (country === 'all' || !obj[country]) ? 'all' : country;
  var row  = obj[cKey];
  if (!row) return null;
  if (typeof row === 'number') return row;
  var sKey = (source === 'all' || row[source] === undefined) ? 'all' : source;
  var val  = row[sKey];
  return (val !== null && val !== undefined) ? val : null;
}

/* ── Formatting ──────────────────────────────────────────────── */

function _fmtKPI(kpi, v) {
  if (v === null || v === undefined) return '—';
  var d = kpi.decimals !== undefined ? kpi.decimals : 2;
  if (kpi.unit === 'percent') return v.toFixed(d) + '%';
  if (kpi.unit === 'count')   return Math.round(v).toLocaleString();
  if (kpi.unit === 'rank')    return '#' + Math.round(v);
  if (kpi.unit === 'score')   return v.toFixed(d);
  return String(v);
}

function _srcLabel(src) {
  var m = {
    all:     'All Sources',
    search:  'Search',
    browse:  'Browse',
    appref:  'App Referrer',
    webref:  'Web Referrer',
    organic: 'Organic',
    paid:    'Paid'
  };
  return m[src] || src;
}

function _okrStoreName(s) {
  return s === 'android' ? 'Play Store' : s === 'unified' ? 'Unified' : 'iOS';
}

function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
