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
  tailwind: { config: {} },
  performance: fakeWindow.performance,
  requestAnimationFrame: fakeWindow.requestAnimationFrame,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date,
  Math: Math,
  Array: Array,
  Object: Object,
  Number: Number,
  String: String,
  Boolean: Boolean,
  RegExp: RegExp,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN
});

vm.runInContext(modScript, ctx);

for (let i = modIndex + 1; i < scripts.length; i++) {
  try {
    vm.runInContext(scripts[i], ctx);
  } catch (err) {}
}

// 4 transactions as in user's screenshot:
const testTransactions = [
  { id: 'tx-1', name: 'Sahil', amount: 1500, mode: 'Cash', type: 'New Membership', time: '09:42 AM', date: '2026-11-08' },
  { id: 'tx-2', name: 'dhruv singh bhadoriya', amount: 1500, mode: 'UPI', type: 'New Membership', time: '09:41 AM', date: '2026-11-08' },
  { id: 'tx-3', name: 'mohit', amount: 1500, mode: 'UPI', type: 'New Membership', time: '12:00 PM', date: '2026-10-05' },
  { id: 'tx-4', name: 'Modi', amount: 4000, mode: 'UPI', type: 'New Membership', time: '12:00 PM', date: '2026-10-02' }
];

fakeWindow.updateDashboardTransactions(testTransactions);

console.log('--- RESULTS ---');
console.log('Top Card Total Revenue (All-time):', domElements['kpi-today-cash'].textContent);
console.log('Top Card Subtitle (Delta text):', domElements['kpi-cash-delta'].textContent);
console.log('Section 2 Today Collected Today:', domElements['detailed-total-cash'].textContent);
console.log('Section 2 Breakdown New Memberships:', domElements['breakdown-new-memberships'].textContent);
console.log('Section 2 Transactions Badge:', domElements['tx-count-badge'].textContent);

if (domElements['kpi-today-cash'].textContent === '₹8,500' &&
    domElements['detailed-total-cash'].textContent === '₹3,000' &&
    domElements['breakdown-new-memberships'].textContent === '₹3,000') {
  console.log('>>> TEST PASSED: Top card is now Total Revenue (₹8,500, all-time)! Section 2 correctly remains Today Cash (₹3,000)!');
} else {
  console.error('>>> TEST FAILED!');
}

