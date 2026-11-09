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
  'kpi-today-cash', 'total-cash', 'detailed-total-cash', 'tx-count-badge',
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

domElements['payments-view'].classList.add('hidden');

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
  } catch (err) {
    // console.log(err.message);
  }
}

const testMembers = [
  { id: 'GYM-1586', memberId: 'GYM-1586', name: 'Mohit', phone: '+91 7584691238', plan: '1 Month', amount: 1500, expiryDate: '2026-11-05', status: 'expired' },
  { id: 'GYM-7257', memberId: 'GYM-7257', name: 'Sahil', phone: '+91 7584569325', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' },
  { id: 'GYM-5152', memberId: 'GYM-5152', name: 'Dhruv Singh Bhadoriya', phone: '+91 8269583846', plan: '1 Month', amount: 1500, expiryDate: '2026-12-08', status: 'active' }
];

const testTransactions = [
  { id: 'tx-1', name: 'Sahil', amount: 1500, mode: 'Cash', type: 'New Membership', time: '09:42 AM', date: '2026-11-08' },
  { id: 'tx-2', name: 'dhruv singh bhadoriya', amount: 1500, mode: 'UPI', type: 'New Membership', time: '09:41 AM', date: '2026-11-08' },
  { id: 'tx-3', name: 'mohit', amount: 1500, mode: 'UPI', type: 'New Membership', time: '12:00 PM', date: '2026-10-05' }
];

// Set members & transactions via dashboard update functions
fakeWindow.updateDashboardMembers(testMembers);
fakeWindow.updateDashboardTransactions(testTransactions);

console.log('Today Cash:', domElements['kpi-today-cash'].textContent);
console.log('Detailed Cash:', domElements['detailed-total-cash'].textContent);
console.log('Breakdown New Memberships:', domElements['breakdown-new-memberships'].textContent);
console.log('Tx Badge:', domElements['tx-count-badge'].textContent);

// Render Payments Page
fakeWindow.renderPaymentsPage(false);

console.log('squid-expected-revenue:', domElements['squid-expected-revenue'].textContent);
console.log('squid-pot-collected:', domElements['squid-pot-collected'].textContent);
console.log('squid-remaining-revenue:', domElements['squid-remaining-revenue'].textContent);
console.log('squid-pot-percentage:', domElements['squid-pot-percentage'].textContent);

if (domElements['squid-expected-revenue'].textContent === '₹4,500' &&
    domElements['squid-pot-collected'].textContent === '₹3,000' &&
    domElements['squid-remaining-revenue'].textContent === '₹1,500' &&
    domElements['squid-pot-percentage'].textContent === '67%') {
  console.log('>>> ALL TESTS PASSED! Expected: ₹4,500, Collected: ₹3,000, Remaining: ₹1,500, Status: 67%');
}

