const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== TEST 1: HTML Markup & Elements Check ===');
const checks = [
  'id="payments-view"',
  'class="pay"',
  'id="pay-kpis"',
  'id="squid-pot-status"',
  'id="gpPile"',
  'id="squid-expected-revenue"',
  'id="squid-pot-collected"',
  'id="squid-remaining-revenue"',
  'id="squid-pot-percentage"',
  'id="squid-members-count"',
  'id="pay-trend"',
  'id="pay-range"',
  'id="pay-mix"',
  'id="pay-pending"',
  'id="pl-modes"',
  'id="pl-type"',
  'id="pl-q"',
  'id="pl-count"',
  'id="pl-rows"',
  'id="pl-foot"',
  'id="pay-quick"',
  'id="pay-quick-form"'
];

let allMarkupPassed = true;
checks.forEach(c => {
  if (html.includes(c)) {
    console.log(`  ✓ Found ${c}`);
  } else {
    console.error(`  ✗ MISSING ${c}`);
    allMarkupPassed = false;
  }
});

console.log('All required markup present:', allMarkupPassed);

console.log('\n=== TEST 2: JSDOM Logic & Scenario Verification ===');
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
  'pay-quick', 'pay-quick-form'
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

console.log(`Extracted ${scripts.length} script blocks.`);

// Find module script
const modIndex = scripts.findIndex(s => s.includes('let allMembers =') || s.includes('allTransactions ='));
console.log('Module script is at index:', modIndex);

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

fakeWindow.allMembers = testMembers;
fakeWindow.allTransactions = testTransactions;

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

// Run module script
vm.runInContext(modScript, ctx);

// Run the remaining script blocks
for (let i = modIndex + 1; i < scripts.length; i++) {
  try {
    vm.runInContext(scripts[i], ctx);
  } catch (err) {
    console.error(`Error executing script ${i + 1}:`, err.message);
  }
}

// Now test updateDashboardTransactions with testTransactions
console.log('\n--- Calling updateDashboardTransactions ---');
fakeWindow.updateDashboardTransactions(testTransactions);

console.log('kpi-today-cash textContent:', domElements['kpi-today-cash'].textContent);
console.log('detailed-total-cash textContent:', domElements['detailed-total-cash'].textContent);
console.log('breakdown-new-memberships textContent:', domElements['breakdown-new-memberships'].textContent);
console.log('tx-count-badge textContent:', domElements['tx-count-badge'].textContent);

if (domElements['kpi-today-cash'].textContent === '₹3,000' &&
    domElements['detailed-total-cash'].textContent === '₹3,000' &&
    domElements['breakdown-new-memberships'].textContent === '₹3,000' &&
    domElements['tx-count-badge'].textContent === '2 transactions today') {
  console.log('>>> PASS: Dashboard Daily Cash correctly excluded past transaction (Mohit on 05 Oct 2026)! Today is ₹3,000.');
} else {
  console.error('>>> FAIL: Daily Cash mismatch!');
}

// Now test Payments Page render
console.log('\n--- Testing Payments Page Render ---');
if (typeof fakeWindow.renderPaymentsPage === 'function') {
  fakeWindow.renderPaymentsPage(false);
  console.log('squid-expected-revenue:', domElements['squid-expected-revenue'].textContent);
  console.log('squid-pot-collected:', domElements['squid-pot-collected'].textContent);
  console.log('squid-remaining-revenue:', domElements['squid-remaining-revenue'].textContent);
  console.log('squid-pot-percentage:', domElements['squid-pot-percentage'].textContent);
  console.log('pay-kpis innerHTML length:', domElements['pay-kpis'].innerHTML.length);
  console.log('pay-trend innerHTML length:', domElements['pay-trend'].innerHTML.length);
  console.log('pay-mix innerHTML length:', domElements['pay-mix'].innerHTML.length);
  console.log('pay-pending innerHTML length:', domElements['pay-pending'].innerHTML.length);
  console.log('pl-rows innerHTML length:', domElements['pl-rows'].innerHTML.length);

  // Check expected revenue: 3 members * 1500 = 4500
  // Collected: 2 active * 1500 = 3000
  // Remaining: 1500
  // Status: 67%
  if (domElements['squid-expected-revenue'].textContent === '₹4,500' &&
      domElements['squid-pot-collected'].textContent === '₹3,000' &&
      domElements['squid-remaining-revenue'].textContent === '₹1,500') {
    console.log('>>> PASS: Money Pot math is 100% accurate for 3 members!');
  } else {
    console.error('>>> FAIL: Money Pot math mismatch!');
  }
} else {
  console.error('FAIL: window.renderPaymentsPage is not a function!');
}

// Test Quick Payment function
console.log('\n--- Testing Quick Payment function ---');
if (typeof fakeWindow.recordQuickPayment === 'function') {
  fakeWindow.recordQuickPayment({ name: 'Walkin Visitor', amount: 300, type: 'Walk-in', mode: 'Cash' }).then(() => {
    console.log('New total transactions count:', fakeWindow.allTransactions.length);
    console.log('Today cash after quick payment:', domElements['kpi-today-cash'].textContent);
    console.log('Breakdown walk-ins:', domElements['breakdown-walkins'].textContent);
    if (domElements['kpi-today-cash'].textContent === '₹3,300' && domElements['breakdown-walkins'].textContent === '₹300') {
      console.log('>>> PASS: Quick Payment recorded and dashboard updated seamlessly!');
    }
  });
}
