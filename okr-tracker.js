/* ── OKR Tracker ─────────────────────────────────────────────── */

var _okrPeriod  = 'Q2';
var _okrCountry = 'all';
var _okrSource  = 'all';

function renderOKR() {
  _syncOKRFilterUI();
  renderOKRCards();
}

function _syncOKRFilterUI() {
  var periods = ['Q2', 'Q3', 'H1'];
  for (var i = 0; i < periods.length; i++) {
    var btn = document.getElementById('okr-period-' + periods[i]);
    if (btn) btn.classList.toggle('active', periods[i] === _okrPeriod);
  }

  var countrySelect = document.getElementById('okr-country');
  if (countrySelect && !countrySelect._okrPopulated) {
    var cvrKpi = null;
    for (var k = 0; k < KPI_DEFS.length; k++) {
      if (KPI_DEFS[k].id === 'cvr') { cvrKpi = KPI_DEFS[k]; break; }
    }
    var countries = cvrKpi
      ? Object.keys(cvrKpi.baselineCVR).filter(function(c){ return c !== 'all'; }).sort()
      : [];
    countrySelect.innerHTML = '<option value="all">All Countries</option>';
    for (var ci = 0; ci < countries.length; ci++) {
      countrySelect.innerHTML += '<option value="' + _esc(countries[ci]) + '">' + _esc(countries[ci]) + '</option>';
    }
    countrySelect._okrPopulated = true;
  }
  if (countrySelect) countrySelect.value = _okrCountry;

  var sourceSelect = document.getElementById('okr-source');
  if (sourceSelect) sourceSelect.value = _okrSource;
}

function setOKRPeriod(p) {
  _okrPeriod = p;
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

  container.innerHTML = activeKPIs.map(function(kpi) {
    return _buildOKRCard(kpi, _okrPeriod, _okrCountry, _okrSource);
  }).join('');
}

function _buildOKRCard(kpi, period, country, source) {
  var target  = _getKPITarget(kpi, period, country, source);
  var actual  = _getKPIActual(kpi, period, country, source);

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

  var dimTag = '';
  if (kpi.byCountry || kpi.bySource) {
    var dims = [];
    if (kpi.byCountry) dims.push(country !== 'all' ? country : 'All Countries');
    if (kpi.bySource)  dims.push(country !== 'all' || source !== 'all' ? _srcLabel(source) : 'All Sources');
    dimTag = '<div class="okr-dim-tag">' + _esc(dims.join(' · ')) + '</div>';
  }

  var notesHTML = kpi.notes
    ? '<div class="okr-notes">' + _esc(kpi.notes) + '</div>'
    : '';

  return (
    '<div class="okr-card">' +
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
      '<div class="okr-levers"><strong>Levers:</strong> ' + _esc(kpi.levers) + '</div>' +
      notesHTML +
    '</div>'
  );
}

/* ── Target / actual resolution ─────────────────────────────── */

function _getKPITarget(kpi, period, country, source) {
  if (kpi.targets && kpi.targets[period] !== undefined) return kpi.targets[period];

  if (kpi.targetMultiplier && kpi.targetMultiplier[period]) {
    var tm = kpi.targetMultiplier[period];
    var base = null;
    if (tm.base === 'Q1_baseline') {
      base = _nestedVal(kpi.baselineCVR, country, source);
    } else if (tm.base === 'Q2_actual') {
      var q2 = kpi.actuals && kpi.actuals.Q2 ? kpi.actuals.Q2 : {};
      base = _nestedVal(q2, country, source);
    }
    return (base !== null && base !== undefined) ? base * tm.multiplier : null;
  }
  return null;
}

function _getKPIActual(kpi, period, country, source) {
  if (!kpi.actuals || kpi.actuals[period] === undefined) return null;
  var periodData = kpi.actuals[period];
  if (typeof periodData === 'number') return periodData;
  return _nestedVal(periodData, country, source);
}

function _nestedVal(obj, country, source) {
  var cKey = (country === 'all' || !obj[country]) ? 'all' : country;
  var row  = obj[cKey];
  if (!row) return null;
  if (typeof row === 'number') return row;
  var sKey = (source === 'all' || row[source] === undefined) ? 'all' : source;
  var val  = row[sKey];
  return (val !== null && val !== undefined) ? val : null;
}

/* ── Formatting helpers ──────────────────────────────────────── */

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
  var m = { search:'App Store Search', browse:'App Store Browse', appref:'App Referrer', webref:'Web Referrer', unavail:'Unavailable' };
  return m[src] || src;
}

function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
