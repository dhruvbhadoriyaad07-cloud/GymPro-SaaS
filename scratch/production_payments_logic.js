/* ===================== PAYMENTS PAGE LOGIC =====================
   Reads window.allTransactions / window.allMembers (your module already keeps these in sync)
   and takes over window.initPaymentsTab + window.updatePaymentsViewData after the module loads. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var COLORS = ['#2F6BFF', '#7C3AED', '#0EA5A4', '#E11D74', '#FF6A1F', '#0B9A55'];
  var PRICES = { '1 Month': 1500, 'Monthly': 1500, '2 Months': 2500, '3 Months': 4000, 'Quarterly': 4000, '6 Months': 7500, '1 Year': 12000, 'Yearly': 12000, 'Annual': 12000, 'Walk-in': 300 };
  var TYPES = [['New Membership', '#2F6BFF'], ['Renewal', '#12B76A'], ['Walk-in', '#FF6A1F'], ['Personal Training', '#7C3AED'], ['Other', '#94A3B8']];
  var MODES = [['cash', 'Cash', '#12B76A'], ['upi', 'UPI', '#7C3AED'], ['card', 'Card', '#2F6BFF']];
  var RANGE_LABEL = { today: 'Today', week: 'Last 7 days', month: 'This month', all: 'All time' };
  var WA = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1s-.7.8-.8 1c-.1.1-.3.2-.5.1a6.6 6.6 0 0 1-2-1.3 7.3 7.3 0 0 1-1.4-1.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.3-.4a.4.4 0 0 0 0-.4l-.8-2c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A3.1 3.1 0 0 0 7 8.2a5.4 5.4 0 0 0 1.1 2.9 12.3 12.3 0 0 0 4.8 4.2c.7.3 1.2.5 1.6.6a3.8 3.8 0 0 0 1.8.1 3 3 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.5-.3z"/></svg>';
  var ICON = {
    inr: 'M6 4h12M6 9h12M7 4c6 0 7 5 2 7H6m3 0l6 9',
    cal: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    bars: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    tick: 'M5 8a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2a2 2 0 000-4z'
  };
  var S = { range: 'month', mode: 'all', type: 'all', q: '', limit: 10, days: 14 };
  var lastPct = -1;

  /* ---------- helpers ---------- */
  var inr = function (n) { return '\u20B9' + Math.round(Number(n) || 0).toLocaleString('en-IN'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmt(d) { if (typeof d === 'string') d = new Date(d.slice(0, 10) + 'T00:00:00'); return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'; }
  function txs() { return Array.isArray(window.allTransactions) ? window.allTransactions : []; }
  function mems() { return Array.isArray(window.allMembers) ? window.allMembers : []; }
  function sum(l) { return l.reduce(function (a, t) { return a + (Number(t.amount) || 0); }, 0); }
  function txDate(t) { var v = t.date || t.d; if (!v) return ''; if (typeof v === 'string') return v.slice(0, 10); if (v.seconds) return iso(new Date(v.seconds * 1000)); if (v instanceof Date) return iso(v); return ''; }
  function txTs(t) {
    var ts = Date.parse(txDate(t) + 'T00:00:00') || 0, m = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t.time || '');
    if (m) { var h = +m[1] % 12; if (/pm/i.test(m[3] || '')) h += 12; if (!m[3]) h = +m[1]; ts += h * 3600000 + (+m[2]) * 60000; }
    return ts;
  }
  function modeOf(t) { var m = String(t.mode || 'Cash').toLowerCase(); return m === 'upi' ? 'upi' : m === 'card' ? 'card' : 'cash'; }
  function typeOf(t) {
    var s = String(t.type || '').toLowerCase();
    if (s.indexOf('renew') > -1) return 'Renewal';
    if (s.indexOf('walk') > -1) return 'Walk-in';
    if (s.indexOf('personal') > -1 || s === 'pt') return 'Personal Training';
    if (s.indexOf('new') > -1) return 'New Membership';
    return 'Other';
  }
  function inRange(t, r) {
    var d = txDate(t), T = today(), tk = iso(T);
    if (r === 'all') return true;
    if (r === 'today') return d === tk;
    if (r === 'week') return d >= iso(addDays(T, -6)) && d <= tk;
    if (r === 'month') return d.slice(0, 7) === tk.slice(0, 7);
    return true;
  }
  function fee(m) { return Number(m.amount) || Number(m.dueAmount) || PRICES[m.plan] || 1500; }
  function expOf(m) {
    var v = m.expiryDate || m.planExpiryDate || m.expiry; if (!v) return null;
    var d = typeof v.toDate === 'function' ? v.toDate() : v.seconds ? new Date(v.seconds * 1000) : new Date(v);
    if (isNaN(d.getTime())) return null; d.setHours(0, 0, 0, 0); return d;
  }
  function daysLeft(m) { var e = expOf(m); return e ? Math.round((e - today()) / 864e5) : null; }
  function state(m) {
    var d = daysLeft(m), s = String(m.status || '').toLowerCase();
    if (s === 'expired' || s === 'inactive' || d === null || d < 0) return 'x';
    return d <= 7 ? 'e' : 'a';
  }
  function memberBy(id) { return mems().filter(function (m) { return m.id === id || m.memberId === id; })[0] || null; }
  function memberOfTx(t) {
    var L = mems(), nm = String(t.name || '').toLowerCase().trim();
    return (t.memberId && memberBy(t.memberId)) || L.filter(function (m) { return String(m.name || '').toLowerCase().trim() === nm; })[0] || null;
  }
  function phoneOf(m) { var d = String((m && (m.phone || m.phoneNumber || m.mobile || m.contact)) || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; }
  function colorOf(name) { var h = 0, s = String(name || '').toLowerCase(); for (var i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }
  function view() { return $('#payments-view'); }
  function visible() { var v = view(); return v && !v.classList.contains('hidden'); }

  function toast(msg, type) {
    var t = $('#toast'); if (!t) return;
    var ic = $('#toast-icon'), tx = $('#toast-msg');
    if (ic) ic.textContent = type === 'error' ? '\u26A0\uFE0F' : '\u2705';
    if (tx) tx.textContent = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.add('translate-y-20', 'opacity-0'); }, 3200);
  }
  function setNum(el, to, pre, suf, anim) {
    if (!el) return; to = Math.round(to); pre = pre || ''; suf = suf || '';
    var from = +el.dataset.v || 0; el.dataset.v = to;
    if (!anim || from === to) { el.textContent = pre + to.toLocaleString('en-IN') + suf; return; }
    var t0 = performance.now();
    (function step(t) { var p = Math.min((t - t0) / 900, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(from + (to - from) * e).toLocaleString('en-IN') + suf; if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function delta(cur, prev, txt) {
    if (!cur && !prev) return '<span class="pay-chip flat">No payments yet</span>';
    if (!prev) return '<span class="pay-chip up">New</span>';
    var p = Math.round((cur - prev) / prev * 100);
    if (p === 0) return '<span class="pay-chip flat">Same ' + txt + '</span>';
    return '<span class="pay-chip ' + (p > 0 ? 'up' : 'down') + '">' + (p > 0 ? '\u25B2 ' : '\u25BC ') + Math.abs(p) + '% ' + txt + '</span>';
  }

  /* ---------- KPI cards ---------- */
  function kpis(anim) {
    var T = today(), tk = iso(T), all = txs();
    var dayL = function (k) { return all.filter(function (t) { return txDate(t) === k; }); };
    var td = dayL(tk), yd = sum(dayL(iso(addDays(T, -1))));
    var w0 = iso(addDays(T, -6)), p0 = iso(addDays(T, -13)), p1 = iso(addDays(T, -7));
    var wk = sum(all.filter(function (t) { var d = txDate(t); return d >= w0 && d <= tk; }));
    var pw = sum(all.filter(function (t) { var d = txDate(t); return d >= p0 && d <= p1; }));
    var mk = tk.slice(0, 7), pmk = iso(new Date(T.getFullYear(), T.getMonth() - 1, 1)).slice(0, 7);
    var mL = all.filter(function (t) { return txDate(t).slice(0, 7) === mk; }), mo = sum(mL);
    var pmo = sum(all.filter(function (t) { return txDate(t).slice(0, 7) === pmk; }));
    var card = function (cls, ic, label, val, chip, small) {
      return '<div class="pay-k ' + cls + '"><span class="ic"><svg viewBox="0 0 24 24"><path d="' + ic + '"/></svg></span><div class="l">' + label + '</div><b data-to="' + Math.round(val) + '">' + inr(val) + '</b>' + (chip || '') + '<small>' + small + '</small></div>';
    };
    var host = $('#pay-kpis'); if (!host) return;
    host.innerHTML =
      card('hero', ICON.inr, 'Collected today', sum(td), delta(sum(td), yd, 'vs yesterday'), td.length + (td.length === 1 ? ' payment' : ' payments') + ' today') +
      card('', ICON.cal, 'Last 7 days', wk, delta(wk, pw, 'vs previous 7'), 'Average ' + inr(wk / 7) + ' per day') +
      card('', ICON.bars, 'This month', mo, delta(mo, pmo, 'vs last month'), 'Last month ' + inr(pmo));
    $$('b[data-to]', host).forEach(function (b) { delete b.dataset.v; setNum(b, +b.dataset.to, '\u20B9', '', anim); });
  }

  /* ---------- Money pot ---------- */
  function pot(anim) {
    var L = mems(), expected = 0, collected = 0;
    L.forEach(function (m) { var f = fee(m); expected += f; if (state(m) !== 'x') collected += f; });
    var pct = expected ? Math.min(100, Math.round(collected / expected * 100)) : 0;
    setNum($('#squid-expected-revenue'), expected, '\u20B9', '', anim);
    setNum($('#squid-pot-collected'), collected, '\u20B9', '', anim);
    setNum($('#squid-remaining-revenue'), expected - collected, '\u20B9', '', anim);
    setNum($('#squid-pot-percentage'), pct, '', '%', anim);
    var mc = $('#squid-members-count'); if (mc) mc.textContent = L.length + (L.length === 1 ? ' member' : ' members');
    var st = $('#squid-pot-status');
    if (st) { st.textContent = pct >= 100 ? 'All plans active' : pct + '% active'; st.className = 'pay-pill' + (pct >= 100 ? ' full' : pct >= 50 ? ' mid' : ''); }
    if (typeof window.setGullakFill === 'function' && (anim || pct !== lastPct)) {
      if (anim) { window.setGullakFill(0); setTimeout(function () { window.setGullakFill(pct); }, 120); } else window.setGullakFill(pct);
    }
    lastPct = pct;
  }

  /* ---------- Trend chart ---------- */
  function trend() {
    var host = $('#pay-trend'); if (!host) return;
    var n = S.days, T = today(), all = txs(), cols = [], mx = 1, total = 0, best = null;
    for (var i = n - 1; i >= 0; i--) {
      var d = addDays(T, -i), k = iso(d), o = { k: k, d: d, cash: 0, upi: 0, card: 0, tot: 0, n: 0, today: i === 0 };
      all.forEach(function (t) { if (txDate(t) === k) { var a = Number(t.amount) || 0; o[modeOf(t)] += a; o.tot += a; o.n++; } });
      mx = Math.max(mx, o.tot); total += o.tot; if (!best || o.tot > best.tot) best = o; cols.push(o);
    }
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var bars = cols.map(function (o, idx) {
      var lbl = n <= 7 ? wd[o.d.getDay()] : (n <= 14 || idx % 5 === 0 || o.today) ? String(o.d.getDate()) : '';
      var tip = wd[o.d.getDay()] + ', ' + fmt(o.d) + ' \u00B7 ' + inr(o.tot) + (o.tot ? '<br>' + MODES.filter(function (m) { return o[m[0]]; }).map(function (m) { return m[1] + ' ' + inr(o[m[0]]); }).join(' \u00B7 ') : '<br>No payments');
      var segs = MODES.map(function (m) { return o[m[0]] ? '<i style="flex:' + o[m[0]] + ';background:' + m[2] + '"></i>' : ''; }).join('');
      return '<div class="pay-col' + (o.today ? ' t' : '') + '" data-tip="' + esc(tip) + '"><div class="pay-bw"><div class="pay-stack" style="height:' + (o.tot ? Math.max(4, o.tot / mx * 100) : 2) + '%">' + segs + '</div></div><em>' + lbl + '</em></div>';
    }).join('');
    host.innerHTML =
      '<h3>Collection trend<span class="r"><div class="pay-seg">' + [7, 14, 30].map(function (d) { return '<button type="button" data-pd="' + d + '" class="' + (S.days === d ? 'on' : '') + '">' + d + ' days</button>'; }).join('') + '</div></span></h3>' +
      '<div class="pay-sumline"><span>Total <b>' + inr(total) + '</b></span><span>Daily average <b>' + inr(total / n) + '</b></span>' + (best && best.tot ? '<span>Best day <b>' + fmt(best.d).slice(0, 6) + ' \u00B7 ' + inr(best.tot) + '</b></span>' : '') + '</div>' +
      '<div class="pay-chartbox"><div class="pay-tip" id="pay-tip"></div><div class="pay-chart">' + bars + '</div></div>' +
      '<div class="pay-leg">' + MODES.map(function (m) { return '<span><i style="background:' + m[2] + '"></i>' + m[1] + '</span>'; }).join('') + '</div>';
  }

  /* ---------- Collection mix ---------- */
  function mix() {
    var host = $('#pay-mix'); if (!host) return;
    var L = txs().filter(function (t) { return inRange(t, S.range); }), tot = sum(L);
    var h = '<h3>Collection mix<span class="r">' + RANGE_LABEL[S.range] + ' \u00B7 ' + inr(tot) + '</span></h3>';
    if (!L.length) { host.innerHTML = h + '<div class="pay-empty">No payments in this period yet.</div>'; return; }
    h += '<div class="pay-sub">By payment mode</div>' + MODES.map(function (m) {
      var a = sum(L.filter(function (t) { return modeOf(t) === m[0]; })), p = tot ? Math.round(a / tot * 100) : 0;
      return '<div class="pay-row" style="--k:' + m[2] + '"><i class="pay-dot"></i><b>' + m[1] + '</b><span class="v">' + inr(a) + '<small>' + p + '%</small></span><div class="pay-track"><i style="width:' + p + '%"></i></div></div>';
    }).join('');
    var ty = TYPES.map(function (t) { return { n: t[0], c: t[1], a: sum(L.filter(function (x) { return typeOf(x) === t[0]; })) }; }).filter(function (x) { return x.a > 0; });
    h += '<div class="pay-sub s2">By type</div><div class="pay-mixbar">' + ty.map(function (x) { return '<i style="flex:' + x.a + ';background:' + x.c + '" title="' + esc(x.n) + '"></i>'; }).join('') + '</div>' +
      '<div class="pay-types">' + ty.map(function (x) { return '<div><i class="pay-dot" style="background:' + x.c + '"></i>' + esc(x.n) + '<b>' + inr(x.a) + '</b></div>'; }).join('') + '</div>';
    host.innerHTML = h;
  }

  /* ---------- Pending renewals ---------- */
  function pending() {
    var host = $('#pay-pending'); if (!host) return;
    var list = mems().filter(function (m) { return state(m) !== 'a'; }).sort(function (a, b) {
      var x = daysLeft(a), y = daysLeft(b); return (x === null ? -9999 : x) - (y === null ? -9999 : y);
    });
    var over = list.filter(function (m) { return state(m) === 'x'; }), soon = list.filter(function (m) { return state(m) === 'e'; });
    var h = '<h3>Pending renewals<span class="r">' + list.length + (list.length === 1 ? ' member' : ' members') + '</span></h3>';
    if (!list.length) { host.innerHTML = h + '<div class="pay-empty">Everyone is up to date. Nothing pending.</div>'; return; }
    h += '<div class="pay-sumline"><span>Overdue <b class="x">' + inr(sum(over.map(function (m) { return { amount: fee(m) }; }))) + '</b> (' + over.length + ')</span><span>Expiring in 7 days <b>' + inr(sum(soon.map(function (m) { return { amount: fee(m) }; }))) + '</b> (' + soon.length + ')</span></div>';
    h += list.slice(0, 6).map(function (m) {
      var d = daysLeft(m), x = state(m) === 'x', key = m.id || m.memberId;
      var badge = x ? (d === null ? 'No expiry' : 'Expired ' + Math.abs(d) + 'd ago') : (d === 0 ? 'Ends today' : d + 'd left');
      return '<div class="pay-pr"><span class="pay-av" style="background:' + colorOf(m.name) + '">' + esc((m.name || 'M')[0]) + '</span>' +
        '<div class="pay-who"><b>' + esc(m.name) + '</b><small>' + esc(m.plan || 'Plan') + ' \u00B7 ' + inr(fee(m)) + '</small></div>' +
        '<span class="pay-due ' + (x ? 'x' : 'e') + '">' + badge + '</span>' +
        '<button class="pay-ib" type="button" data-prem="' + esc(key) + '" title="Remind on WhatsApp" aria-label="Remind ' + esc(m.name) + ' on WhatsApp">' + WA + '</button>' +
        '<button class="pay-mini" type="button" data-pren="' + esc(key) + '">Renew</button></div>';
    }).join('');
    if (list.length > 6) h += '<div class="pay-more">+ ' + (list.length - 6) + ' more &middot; <a href="#" data-pgo="members" style="color:var(--blu);font-weight:600">see all in Members</a></div>';
    host.innerHTML = h;
  }

  /* ---------- Ledger ---------- */
  function ledgerList() {
    var q = S.q.toLowerCase().trim();
    return txs().filter(function (t) {
      if (!inRange(t, S.range)) return false;
      if (S.mode !== 'all' && String(t.mode || 'Cash').toLowerCase() !== S.mode.toLowerCase()) return false;
      if (S.type !== 'all' && typeOf(t) !== S.type) return false;
      if (q && (String(t.name || '') + ' ' + String(t.id || '') + ' ' + String(t.memberId || '') + ' ' + String(t.type || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return txTs(b) - txTs(a); });
  }
  function ledger() {
    var L = ledgerList(), shown = L.slice(0, S.limit);
    var cnt = $('#pl-count'); if (cnt) cnt.textContent = L.length;
    var rows = $('#pl-rows'), foot = $('#pl-foot'); if (!rows) return;
    rows.innerHTML = shown.length ? shown.map(function (t) {
      var m = memberOfTx(t), ph = phoneOf(m), md = modeOf(t), id = String(t.id || '');
      var mm = MODES.filter(function (x) { return x[0] === md; })[0][1];
      return '<div class="pay-tr"><div class="pay-who" style="display:flex;align-items:center;gap:12px"><span class="pay-av" style="background:' + colorOf(t.name) + '">' + esc((t.name || 'M')[0]) + '</span><div class="pay-who"><b>' + esc(t.name || 'Anonymous') + '</b><small>' + esc((t.memberId || id).toString().slice(0, 12)) + '</small></div></div>' +
        '<div class="pay-meta"><span class="pay-chip2">' + esc(typeOf(t)) + '</span><span class="pm ' + md + '">' + mm + '</span><div class="pay-dt"><b>' + fmt(txDate(t)) + '</b><small>' + esc(t.time || '') + '</small></div></div>' +
        '<div class="pay-amt">+' + inr(t.amount) + '</div>' +
        '<div class="pay-act">' + (ph ? '<button class="pay-ib" type="button" data-pwa="' + esc(id) + '" title="Send receipt on WhatsApp" aria-label="Send receipt">' + WA + '</button>' : '') + '</div></div>';
    }).join('') : '<div class="pay-empty">No payments match these filters.</div>';
    foot.innerHTML = '<span>Showing ' + shown.length + ' of ' + L.length + ' payments</span>' +
      (L.length > shown.length ? '<button class="pay-btn ghost sm" type="button" data-pmore>Show more</button>' : '') +
      '<span>Total <b>' + inr(sum(L)) + '</b></span>';
  }

  function syncCtl() {
    $$('#pay-range button').forEach(function (b) { b.classList.toggle('on', b.dataset.pr === S.range); });
    $$('#pl-modes button').forEach(function (b) { b.classList.toggle('on', b.dataset.pm === S.mode); });
    var dl = $('#pay-names'); if (dl && !dl.dataset.n || (dl && +dl.dataset.n !== mems().length)) { dl.innerHTML = mems().map(function (m) { return '<option value="' + esc(m.name) + '">'; }).join(''); dl.dataset.n = mems().length; }
  }

  function render(anim) {
    if (!view()) return;
    kpis(anim); pot(anim); trend(); mix(); pending(); ledger(); syncCtl();
  }

  /* ---------- CSV + receipts + quick payment ---------- */
  function exportCsv() {
    var L = ledgerList(); if (!L.length) { toast('Nothing to export for these filters', 'error'); return; }
    var rows = [['Date', 'Time', 'Member', 'Type', 'Mode', 'Amount', 'ID']].concat(L.map(function (t) { return [txDate(t), t.time || '', t.name || '', t.type || '', t.mode || '', Number(t.amount) || 0, t.id || '']; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'gympro-payments-' + iso(new Date()) + '.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Exported ' + L.length + ' payments');
  }
  function receipt(id) {
    var t = txs().filter(function (x) { return String(x.id) === id; })[0]; if (!t) return;
    var ph = phoneOf(memberOfTx(t)); if (!ph) { toast('No phone number found for ' + (t.name || 'this member'), 'error'); return; }
    var msg = 'Hi ' + t.name + ', we received ' + inr(t.amount) + ' (' + (t.mode || 'Cash') + ') for ' + typeOf(t) + ' on ' + fmt(txDate(t)) + '. Thank you! Regards, Gym Admin';
    window.open('https://wa.me/91' + ph + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    toast('Opening WhatsApp receipt for ' + t.name);
  }
  function quick(open) {
    var m = $('#pay-quick'); if (!m) return; m.classList.toggle('on', !!open);
    if (open) { setTimeout(function () { var n = $('#pqn'); if (n) n.focus(); }, 30); } else { var f = $('#pay-quick-form'); if (f) f.reset(); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var root = view(); if (!root) return;
    var t = e.target.closest('[data-pr],[data-pm],[data-pd],[data-pmore],[data-pexport],[data-pquick],[data-pclose],[data-pwa],[data-prem],[data-pren],[data-pgo],[data-pclose-bg]');
    if (!t || !root.contains(t)) return;
    var D = t.dataset;
    if (t.hasAttribute('data-pclose-bg')) { if (e.target === t) quick(false); return; }
    if (D.pgo) { e.preventDefault(); if (window.switchView) window.switchView(D.pgo); }
    else if (D.pr) { S.range = D.pr; S.limit = 10; mix(); ledger(); syncCtl(); }
    else if (D.pm) { S.mode = D.pm; S.limit = 10; ledger(); syncCtl(); }
    else if (D.pd) { S.days = +D.pd; trend(); }
    else if ('pmore' in D) { S.limit += 10; ledger(); }
    else if ('pexport' in D) exportCsv();
    else if ('pquick' in D) quick(true);
    else if ('pclose' in D) quick(false);
    else if (D.pwa) receipt(D.pwa);
    else if (D.prem) { var m = memberBy(D.prem); if (m && window.sendWhatsAppReminder) window.sendWhatsAppReminder(m.name, phoneOf(m) || m.phone || '', fmt(expOf(m)), fee(m)); }
    else if (D.pren) { var r = memberBy(D.pren); if (r && window.renewMember) window.renewMember(r.id || r.memberId, r.name, phoneOf(r)); }
  });
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest && e.target.closest('#pay-trend .pay-col'); var tip = $('#pay-tip');
    if (!tip) return; if (!c) { tip.style.opacity = 0; return; }
    var box = c.closest('.pay-chartbox'), cr = c.getBoundingClientRect(), br = box.getBoundingClientRect();
    tip.innerHTML = c.getAttribute('data-tip'); tip.style.left = Math.min(Math.max(cr.left - br.left + cr.width / 2, 90), br.width - 90) + 'px'; tip.style.top = '-6px'; tip.style.opacity = 1;
  });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'pl-q') { S.q = e.target.value; S.limit = 10; ledger(); } });
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'pl-type') { S.type = e.target.value; S.limit = 10; ledger(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') quick(false); });

  function bindForm() {
    var f = $('#pay-quick-form'); if (!f) return;
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = f.elements.pqn.value.trim(), amt = Number(f.elements.pqa.value) || 0;
      var type = (f.querySelector('[name=pqt]:checked') || {}).value || 'Walk-in', mode = (f.querySelector('[name=pqm]:checked') || {}).value || 'Cash';
      if (!name || amt <= 0) { toast('Enter a name and an amount', 'error'); return; }
      var btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        if (typeof window.recordQuickPayment === 'function') { await window.recordQuickPayment({ name: name, amount: amt, type: type, mode: mode }); }
        else {
          var now = new Date(), d = iso(now), list = window.allTransactions || [];
          list.unshift({ id: 'tx-' + Date.now(), name: name, amount: amt, mode: mode, type: type, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: d, d: d });
          if (window.updateDashboardTransactions) window.updateDashboardTransactions(list.slice()); else render(false);
          toast(type + ' payment of ' + inr(amt) + ' added (screen only: add recordQuickPayment to save it)');
        }
        quick(false);
      } catch (err) { toast('Could not save: ' + err.message, 'error'); } finally { btn.disabled = false; }
    });
  }

  /* ---------- hooks used by your existing code ---------- */
  function install() {
    window.initPaymentsTab = function () { render(true); };
    window.updatePaymentsViewData = function () { if (visible()) render(false); };
    window.renderPaymentsPage = render;
    bindForm();
    render(false);
  }
  if (document.readyState === 'complete') install(); else window.addEventListener('load', install);
})();