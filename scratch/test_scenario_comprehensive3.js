const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Mock DOM
const elements = {};
function getOrCreate(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      addEventListener: () => {},
      remove: () => {},
      disabled: false,
      getAttribute: () => '',
      setAttribute: () => {},
      querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } })
    };
  }
  return elements[id];
}

const mockDocument = {
  getElementById: (id) => getOrCreate(id),
  querySelectorAll: () => [],
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
  createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {}, style: { setProperty: () => {} } }),
  body: { classList: { add: () => {}, remove: () => {} } }
};

const sandbox = {
  window: {},
  document: mockDocument,
  console,
  setTimeout,
  clearTimeout,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => { setTimeout(cb, 10); },
  isFirebaseLive: false,
  db: null,
  allMembers: [],
  allTransactions: [],
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
};
sandbox.window = sandbox;

// Read index.html and extract script blocks
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];

// Find module script
const moduleMatch = scriptMatches.find(m => m[0].includes('type="module"'));
const moduleCode = moduleMatch[1]
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, ''); // strip imports for VM

vm.createContext(sandbox);

// Minimal Firestore mock stubs
sandbox.doc = () => ({ id: 'docRef' });
sandbox.collection = () => ({ id: 'colRef' });
sandbox.query = () => ({});
sandbox.where = () => ({});
sandbox.getDocs = async () => ({ empty: true, docs: [] });
sandbox.updateDoc = async () => {};
sandbox.deleteDoc = async () => {};
sandbox.serverTimestamp = () => new Date();

vm.runInContext(moduleCode, sandbox);

// Setup the exact user scenario from the screenshots
const todayStr = sandbox.window.iso(new Date());

vm.runInContext(`
allMembers = [
  { id: 'm1', memberId: 'GYM-1586', name: 'Mohit', plan: '1 Month', amount: 1500, status: 'expired', startDate: '2026-10-05', expiryDate: '2026-11-05' },
  { id: 'm2', memberId: 'GYM-7257', name: 'Sahil', plan: '1 Month', amount: 1500, status: 'active', startDate: '${todayStr}', expiryDate: '2026-12-08' },
  { id: 'm3', memberId: 'GYM-5152', name: 'Dhruv Singh Bhadoriya', plan: '1 Month', amount: 1500, status: 'active', startDate: '${todayStr}', expiryDate: '2026-12-08' }
];

allTransactions = [
  { id: 'tx1', memberId: 'GYM-7257', name: 'Sahil', amount: 1500, mode: 'Cash', type: 'New Membership', date: '${todayStr}', d: '${todayStr}', time: '09:42 AM' },
  { id: 'tx2', memberId: 'GYM-5152', name: 'Dhruv Singh Bhadoriya', amount: 1500, mode: 'UPI', type: 'New Membership', date: '${todayStr}', d: '${todayStr}', time: '09:41 AM' },
  { id: 'tx3', memberId: 'GYM-1586', name: 'Mohit', amount: 1500, mode: 'UPI', type: 'New Membership', date: '2026-10-05', d: '2026-10-05', time: '12:00 PM' }
];
`, sandbox);

// Run updateDashboardTransactions
vm.runInContext('updateDashboardTransactions(allTransactions)', sandbox);

const todayCashText = elements['kpi-today-cash'].textContent;
const detailedCashText = elements['detailed-total-cash'].textContent;
const badgeCountText = elements['tx-count-badge'].textContent;
const newMembershipsText = elements['breakdown-new-memberships'].textContent;

console.log('Today Cash Text:', todayCashText);
console.log('Detailed Cash Text:', detailedCashText);
console.log('Badge Count Text:', badgeCountText);
console.log('New Memberships Breakdown:', newMembershipsText);

assert.strictEqual(todayCashText, '₹3,000', "Today's Cash must be ₹3,000 (excluding past Oct 5 transaction)");
assert.strictEqual(detailedCashText, '₹3,000', "Detailed Total Cash must be ₹3,000");
assert.strictEqual(badgeCountText, '2 transactions today', "Badge should say '2 transactions today'");
assert.strictEqual(newMembershipsText, '₹3,000', "Today's New Memberships breakdown must be ₹3,000");

// Verify Money Pot logic with these 3 members
const exp = sandbox.window.calculateExpectedRevenue();
const col = sandbox.window.currentPotCollected;
const rem = exp - col;
console.log(`Money Pot => Expected: ₹${exp}, Collected: ₹${col}, Remaining: ₹${rem}`);
assert.strictEqual(exp, 4500, 'Expected for all 3 members is 4500');
assert.strictEqual(col, 3000, 'Collected for 2 active members is 3000');
assert.strictEqual(rem, 1500, 'Remaining is 1500');

console.log('ALL VERIFICATIONS PASSED 100%!');

