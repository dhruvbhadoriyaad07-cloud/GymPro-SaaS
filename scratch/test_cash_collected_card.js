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
  'kpi-active-members', 'stat-total-members', 'stat-inactive-members', 'kpi-occupancy-bar', 'kpi-occupancy-text',
  'expiring-count', 'stat-expiring-soon', 'kpi-expiring-week', 'kpi-new-joins'
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

// Check HTML label
const labelMatch = html.match(/<div class="st c-g">[\s\S]*?<span>(.*?)<\/span>/i);
console.log('HTML Card 1 Title:', labelMatch ? labelMatch[1] : 'NOT FOUND');

// Mock 4 members (3 active, 1 expired)
const mockMembers = [
  { id: '1', name: 'Sahil', plan: '1 Month', status: 'active', expiryDate: '2026-12-08' },
  { id: '2', name: 'dhruv singh bhadoriya', plan: '1 Month', status: 'active', expiryDate: '2026-12-08' },
  { id: '3', name: 'mohit', plan: '1 Month', status: 'expired', expiryDate: '2026-11-05' },
  { id: '4', name: 'Modi', plan: '3 Months', status: 'active', expiryDate: '2027-01-02' }
];

// Mock 4 transactions (2 today, 2 past)
const todayStr = new Date().toISOString().split('T')[0];
const mockTransactions = [
  { id: 't1', name: 'Sahil', amount: 1500, type: 'New Membership', mode: 'Cash', date: todayStr, d: todayStr },
  { id: 't2', name: 'dhruv singh bhadoriya', amount: 1500, type: 'New Membership', mode: 'UPI', date: todayStr, d: todayStr },
  { id: 't3', name: 'mohit', amount: 1500, type: 'New Membership', mode: 'UPI', date: '2026-10-05', d: '2026-10-05' },
  { id: 't4', name: 'Modi', amount: 4000, type: 'New Membership', mode: 'UPI', date: '2026-10-02', d: '2026-10-02' }
];

// Execute updateDashboardMembers
if (typeof fakeWindow.updateDashboardMembers === 'function') {
  fakeWindow.updateDashboardMembers(mockMembers);
}

// Execute updateDashboardTransactions
if (typeof fakeWindow.updateDashboardTransactions === 'function') {
  fakeWindow.updateDashboardTransactions(mockTransactions);
}

console.log('--- RESULTS ---');
console.log('Top Card Cash Collected (Active Members):', domElements['kpi-today-cash'].textContent);
console.log('Top Card Progress Bar Width:', domElements['kpi-cash-progress-bar'].style.width);
console.log('Top Card Subtitle:', domElements['kpi-cash-delta'].textContent);
console.log('Section 2 Today Collected Today:', domElements['detailed-total-cash'].textContent);
console.log('Section 2 Breakdown New Memberships:', domElements['breakdown-new-memberships'].textContent);
console.log('Section 2 Transactions Badge:', domElements['tx-count-badge'].textContent);

if (
  domElements['kpi-today-cash'].textContent === '₹7,000' &&
  domElements['detailed-total-cash'].textContent === '₹3,000' &&
  labelMatch && labelMatch[1] === 'CASH COLLECTED'
) {
  console.log('>>> TEST PASSED: Top Card is CASH COLLECTED showing ₹7,000 (Active collected), while Section 2 shows Today Cash ₹3,000!');
} else {
  console.log('>>> TEST FAILED!');
  process.exit(1);
}

