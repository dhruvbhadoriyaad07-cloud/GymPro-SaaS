const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

const domElements = {};
function createFakeEl(id, tagName = 'div') {
  return {
    id: id,
    tagName: tagName.toUpperCase(),
    textContent: '',
    innerHTML: '',
    value: '',
    dataset: {},
    style: {
      setProperty(k, v) { this[k] = v; }
    },
    parentNode: {
      appendChild() {}
    },
    appendChild() {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) { if (force !== undefined) { force ? this.add(c) : this.remove(c); } else { this._classes.has(c) ? this.remove(c) : this.add(c); } },
      contains(c) { return this._classes.has(c); }
    },
    querySelector(s) {
      if (s.startsWith('#')) return domElements[s.slice(1)] || null;
      return null;
    },
    querySelectorAll(s) { return []; },
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
  };
}

const mockIds = [
  'payments-view', 'dashboard-view', 'attendance-view', 'members-view', 'topbar-title', 'topbar-date',
  'kpi-today-cash', 'total-cash', 'kpi-cash-delta', 'kpi-cash-progress-bar',
  'present-count', 'stat-present-today', 'stat-present-floor', 'stat-floor-total',
  'kpi-active-members', 'stat-total-members', 'stat-inactive-members', 'kpi-occupancy-bar', 'kpi-occupancy-text',
  'expiring-count', 'stat-expiring-soon', 'kpi-expiring-week', 'kpi-new-joins',
  'expired-30-count', 'stat-expired-30', 'kpi-expired-30-bar', 'stat-expired-30-sub',
  'count-expired-30',
  'detailed-total-cash', 'detailed-cash-delta', 'tx-count-badge',
  'breakdown-new-memberships', 'breakdown-renewals', 'breakdown-walkins', 'breakdown-pt',
  'split-bar-cash', 'split-bar-upi', 'split-bar-card',
  'split-label-cash', 'split-label-upi', 'split-label-card',
  'transactions-list', 'activity-feed', 'toast', 'toast-icon', 'toast-msg',
  'pay-kpis', 'squid-pot-status', 'stage', 'gpPile',
  'squid-expected-revenue', 'squid-pot-collected', 'squid-remaining-revenue',
  'squid-pot-percentage', 'squid-members-count',
  'pay-trend', 'pay-range', 'pay-mix', 'pay-pending',
  'pl-modes', 'pl-type', 'pl-q', 'pl-count', 'pl-rows', 'pl-foot',
  'pay-quick', 'pay-quick-form',
  'expiry-table-body', 'count-all', 'count-today', 'count-week', 'count-month',
  'plan-count-monthly', 'plan-count-quarterly', 'plan-count-annual', 'plan-count-walkin', 'plan-total-donut', 'donut-chart-circle'
];

mockIds.forEach(id => {
  domElements[id] = createFakeEl(id);
});

const fakeDocument = {
  getElementById(id) { return domElements[id] || null; },
  querySelector(s) {
    if (s.startsWith('#')) return domElements[s.slice(1)] || null;
    return null;
  },
  querySelectorAll(s) { return []; },
  createElement(tag) { return createFakeEl('gen-' + Math.random(), tag); },
  createElementNS(ns, tag) { return createFakeEl('gen-ns-' + Math.random(), tag); },
  addEventListener() {},
  readyState: 'complete'
};

const fakeWindow = {
  document: fakeDocument,
  allMembers: [],
  allTransactions: [],
  addEventListener() {},
  requestAnimationFrame(cb) { setTimeout(cb, 0); },
  matchMedia() { return { matches: false }; },
  performance: { now() { return Date.now(); } }
};

fakeWindow.window = fakeWindow;

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const scripts = [];
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1]);
}

const modIndex = scripts.findIndex(s => s.includes('let allMembers =') || s.includes('allTransactions ='));
const modScript = scripts[modIndex].replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');

const ctx = vm.createContext({
  window: fakeWindow,
  document: fakeDocument,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  RegExp: RegExp
});

try {
  vm.runInContext(modScript, ctx);
} catch (e) {
  console.log('Module script execution notice:', e.message);
}

// Today is 2026-11-08
const now = new Date();
const expFuture30 = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
const expFuture60 = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0];
const expRecent3 = new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0];
const expOld45 = new Date(now.getTime() - 45 * 86400000).toISOString().split('T')[0];

const mockMembers = [
  { id: '1', name: 'Sahil', plan: '1 Month', status: 'active', expiryDate: expFuture30 },
  { id: '2', name: 'dhruv singh bhadoriya', plan: '1 Month', status: 'active', expiryDate: expFuture30 },
  { id: '3', name: 'Modi', plan: '3 Months', status: 'active', expiryDate: expFuture60 },
  { id: '4', name: 'mohit', plan: '1 Month', status: 'expired', expiryDate: expRecent3 },
  { id: '5', name: 'Ramesh', plan: '1 Month', status: 'expired', expiryDate: expOld45 }
];

// Run updateDashboardMembers
if (typeof fakeWindow.updateDashboardMembers === 'function') {
  fakeWindow.updateDashboardMembers(mockMembers);
}

console.log('--- RESULTS ---');
console.log('Total Members:', domElements['stat-total-members'].textContent);
console.log('Active Members:', domElements['kpi-active-members'].textContent);
console.log('Expiring Soon (0-7d):', domElements['stat-expiring-soon'].textContent);
console.log('Expired >30 Days Card:', domElements['stat-expired-30'].textContent);
console.log('Expired >30 Days Bar Width:', domElements['kpi-expired-30-bar'].style.width);
console.log('Count Tab Expired >30 Days:', domElements['count-expired-30'].textContent);
console.log('Cash Collected Card:', domElements['kpi-today-cash'].textContent);

// Test table render filter
if (typeof fakeWindow.renderTable === 'function') {
  fakeWindow.renderTable('expired30');
  console.log('RenderTable for expired30 table innerHTML contains Ramesh?', domElements['expiry-table-body'].innerHTML.includes('Ramesh'));
  console.log('RenderTable for expired30 table innerHTML contains Mohit (recent)?', domElements['expiry-table-body'].innerHTML.includes('mohit'));
}

if (
  domElements['stat-expired-30'].textContent === '1' &&
  domElements['kpi-expired-30-bar'].style.width === '20%' &&
  domElements['kpi-active-members'].textContent === '3' &&
  domElements['kpi-today-cash'].textContent === '₹7,000'
) {
  console.log('>>> ALL TESTS PASSED: Expired >30 Days card is working perfectly!');
} else {
  console.error('>>> TEST FAILED!');
  process.exit(1);
}

